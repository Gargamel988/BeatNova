import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/user";

const requireUser = async () => {
  const user = await getUser();
  if (!user?.id) throw new Error("Kullanıcı oturumu bulunamadı");
  return user;
};

export const getSuggestedUsers = async (searchQuery?: string) => {
  try {
    const user = await requireUser();

    // Önce mevcut kullanıcının tüm ilişkilerini al (accepted, pending, rejected)
    const { data: allUserRelationships, error: relationsError } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id, status")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (relationsError) throw relationsError;

    // Zaten ilişkisi olan kullanıcıları filtrele (accepted, pending, rejected)
    const excludedUserIds = new Set<string>();
    if (allUserRelationships) {
      allUserRelationships.forEach((f) => {
        if (f.requester_id === user.id) {
          excludedUserIds.add(f.addressee_id);
        } else {
          excludedUserIds.add(f.requester_id);
        }
      });
    }

    // Mevcut kullanıcının sadece accepted arkadaşlarını al (mutual friends için)
    const userFriendIds = new Set<string>();
    if (allUserRelationships) {
      allUserRelationships
        .filter((f) => f.status === "accepted")
        .forEach((f) => {
          if (f.requester_id === user.id) {
            userFriendIds.add(f.addressee_id);
          } else {
            userFriendIds.add(f.requester_id);
          }
        });
    }

    // Profil sorgusu oluştur
    let query = supabase
      .from("profiles")
      .select("id, display_name, avatar_url, bio")
      .neq("id", user.id)
      .eq("allow_friend_requests", true);

    // Zaten ilişkisi olan kullanıcıları hariç tut
    if (excludedUserIds.size > 0) {
      const excludedArray = Array.from(excludedUserIds);
      // Supabase'de .not() ile array kullanımı
      query = query.not("id", "in", `(${excludedArray.join(",")})`);
    }

    // Arama sorgusu varsa ekle
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim();
      query = query.or(`display_name.ilike.%${q}%,bio.ilike.%${q}%`);
    }

    // Limit ve sıralama
    query = query.limit(20);

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Tüm önerilen kullanıcıların ID'lerini topla
    const suggestedUserIds = data.map((p) => p.id);

    // Tek sorguda tüm önerilen kullanıcıların friendships'lerini al (performans optimizasyonu)
    const { data: allSuggestedFriendships, error: allFriendsError } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .or(
        suggestedUserIds
          .map((id) => `requester_id.eq.${id},addressee_id.eq.${id}`)
          .join(",")
      )
      .eq("status", "accepted");

    if (allFriendsError) throw allFriendsError;

    // Her önerilen kullanıcının arkadaşlarını map'le
    const suggestedUserFriendsMap = new Map<string, Set<string>>();
    suggestedUserIds.forEach((id) => {
      suggestedUserFriendsMap.set(id, new Set<string>());
    });

    if (allSuggestedFriendships) {
      allSuggestedFriendships.forEach((f) => {
        // Requester tarafı
        if (suggestedUserIds.includes(f.requester_id)) {
          const friends = suggestedUserFriendsMap.get(f.requester_id);
          if (friends) friends.add(f.addressee_id);
        }
        // Addressee tarafı
        if (suggestedUserIds.includes(f.addressee_id)) {
          const friends = suggestedUserFriendsMap.get(f.addressee_id);
          if (friends) friends.add(f.requester_id);
        }
      });
    }

    // Her önerilen kullanıcı için listening_history'den genre hesapla
    const { data: listeningHistoryData } = await supabase
      .from("listening_history")
      .select("user_id, song_id, total_seconds")
      .in("user_id", suggestedUserIds)
      .order("total_seconds", { ascending: false });

    // Genre hesaplama için şarkı bilgilerini al
    const songIdsForGenre =
      listeningHistoryData?.map((h) => h.song_id).filter(Boolean) || [];
    const { data: songsData } = songIdsForGenre.length > 0
      ? await supabase
          .from("songs")
          .select("id, artist")
          .in("id", songIdsForGenre.slice(0, 100)) // İlk 100 şarkı yeterli
      : { data: null };

    // Kullanıcı başına en çok dinlenen artist'leri hesapla
    const userTopArtists = new Map<string, Map<string, number>>();
    if (listeningHistoryData && songsData) {
      const songArtistMap = new Map(
        songsData.map((s) => [s.id, s.artist || "Unknown"])
      );

      listeningHistoryData.forEach((history) => {
        const artist = songArtistMap.get(history.song_id) || "Unknown";
        if (!userTopArtists.has(history.user_id)) {
          userTopArtists.set(history.user_id, new Map());
        }
        const artists = userTopArtists.get(history.user_id)!;
        artists.set(
          artist,
          (artists.get(artist) || 0) + (history.total_seconds || 0)
        );
      });
    }

    // Genre tahmin fonksiyonu (artist'e göre basit bir tahmin)
    const getGenreFromArtist = (artist: string): string => {
      const artistLower = artist.toLowerCase();
      if (artistLower.includes("rock") || artistLower.includes("metal")) {
        return "Rock";
      }
      if (artistLower.includes("pop")) {
        return "Pop";
      }
      if (artistLower.includes("jazz")) {
        return "Jazz";
      }
      if (artistLower.includes("hip") || artistLower.includes("rap")) {
        return "Hip-Hop";
      }
      if (artistLower.includes("electronic") || artistLower.includes("edm")) {
        return "Electronic";
      }
      if (artistLower.includes("classical")) {
        return "Classical";
      }
      return "Pop"; // Varsayılan
    };

    // Her önerilen kullanıcı için istatistikleri hesapla
    const suggestedUsersWithStats = data.map((profile) => {
      const suggestedUserFriendIds =
        suggestedUserFriendsMap.get(profile.id) || new Set<string>();

      // Mutual friends hesapla (kesişim)
      const mutualFriends = Array.from(userFriendIds).filter((id) =>
        suggestedUserFriendIds.has(id)
      ).length;

      // Genre hesapla
      let genre = "Pop"; // Varsayılan
      const topArtists = userTopArtists.get(profile.id);
      if (topArtists && topArtists.size > 0) {
        // En çok dinlenen artist'i bul
        const topArtist = Array.from(topArtists.entries()).sort(
          (a, b) => b[1] - a[1]
        )[0][0];
        genre = getGenreFromArtist(topArtist);
      }

      return {
        ...profile,
        mutualFriends,
        genre,
      };
    });

    // Sıralama: Mutual friends'e göre
    suggestedUsersWithStats.sort((a, b) => {
      // Mutual friends'e göre azalan sıralama
      return b.mutualFriends - a.mutualFriends;
    });

    return suggestedUsersWithStats;
  } catch (error) {
    console.error("getSuggestedUsers error:", error);
    throw error;
  }
};

export const addFriend = async (userId: string) => {
  const user = await requireUser();

  if (user.id === userId) {
    throw new Error("Kendinize arkadaşlık isteği gönderemezsiniz");
  }

  // Tek sorgu ile her iki yönü de çek
  const { data: existing, error: fetchError } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`
    )
    .order("id", { ascending: false }); // en yeni kayıt önde
  if (fetchError) throw fetchError;

  // Eğer kabul edilmiş bir ilişki varsa
  if (existing?.some((r) => r.status === "accepted")) {
    throw new Error("Bu kullanıcı zaten arkadaşınız");
  }

  // Eğer zaten pending bir istek varsa -> kimin gönderdiğine göre farklı mesaj
  const pendingFromMe = existing?.find(
    (r) => r.status === "pending" && r.requester_id === user.id
  );
  if (pendingFromMe) {
    throw new Error("Bu kullanıcıya zaten bir arkadaşlık isteği gönderdiniz");
  }
  const pendingFromThem = existing?.find(
    (r) => r.status === "pending" && r.requester_id === userId
  );
  if (pendingFromThem) {
    throw new Error("Bu kullanıcı size zaten bir arkadaşlık isteği gönderdi");
  }

  // Eğer daha önce reddedilmiş bir kayıt varsa -> aynı kayıtı güncelle (duplicate oluşturma)
  const rejected = existing?.find((r) => r.status === "rejected");
  if (rejected) {
    const { error: updErr } = await supabase
      .from("friendships")
      .update({
        status: "pending",
        requester_id: user.id,
        addressee_id: userId,
      })
      .eq("id", rejected.id);
    if (updErr) throw updErr;
    return true;
  }

  // Normal insert (yoksa)
  const { error: insertErr } = await supabase
    .from("friendships")
    .insert({ requester_id: user.id, addressee_id: userId });
  if (insertErr) throw insertErr;
  return true;
};

export const acceptFriendRequest = async (userId: string) => {
  const user = await requireUser();

  // Güncelle ve güncellenen satır sayısını kontrol et
  const { data, error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("requester_id", userId)
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Bekleyen arkadaşlık isteği bulunamadı");
  }
  return true;
};

export const rejectFriendRequest = async (userId: string) => {
  const user = await requireUser();

  const { data, error } = await supabase
    .from("friendships")
    .update({ status: "rejected" })
    .eq("requester_id", userId)
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Bekleyen arkadaşlık isteği bulunamadı");
  }
  return true;
};

// Gelen arkadaşlık istekleri (pending)
export const getFriendRequests = async () => {
  const user = await requireUser();

  // Önce friendships'leri çek
  const { data: requests, error } = await supabase
    .from("friendships")
    .select("id, requester_id")
    .eq("addressee_id", user.id)
    .eq("status", "pending");
  if (error) throw error;

  if (!requests || requests.length === 0) return [];

  // Requester ID'lerini topla
  const requesterIds = requests.map((r) => r.requester_id);

  // Requester profillerini getir
  const { data: profiles, error: error2 } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio")
    .in("id", requesterIds);

  if (error2) throw error2;

  // Request ID'leri ile birleştir
  return (
    profiles?.map((profile) => ({
      id: profile.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      request_id: requests.find((r) => r.requester_id === profile.id)?.id,
    })) || []
  );
};

// Kabul edilmiş arkadaşlar (accepted)
export const getFriends = async () => {
  const user = await requireUser();

  // accepted olan ve içinde user geçen tüm satırları çek, hem requester hem addressee profil bilgilerini al
  const { data, error } = await supabase
    .from("friendships")
    .select(
      "id, requester:requester_id(id, display_name, avatar_url, bio, current_song_id), addressee:addressee_id(id, display_name, avatar_url, bio, current_song_id)"
    )
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .eq("status", "accepted");
  if (error) throw error;

  if (!data || data.length === 0) return [];

  // Her kayıttan "diğer kişiyi" al
  const friends = data.map((row: any) => {
    const requester = row.requester;
    const addressee = row.addressee;
    // kullanıcı requester ise friend = addressee, değilse friend = requester
    if (requester?.id === user.id) return addressee;
    return requester;
  });

  // friend listesinde duplicates olabilir (mantıksal olarak olmamalı ama güvenlik için uniq)
  const uniqueMap = new Map<string, any>();
  friends.forEach((f) => {
    if (f && f.id) uniqueMap.set(f.id, f);
  });

  return Array.from(uniqueMap.values());
};

export const removeFriend = async (userId: string) => {
  const user = await requireUser();
  // Silme koşulu: accepted ve iki yönden biri
  const orCond = `and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`;
  const { data, error } = await supabase
    .from("friendships")
    .delete()
    .or(orCond)
    .eq("status", "accepted")
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Silinecek arkadaşlık bulunamadı");
  }
  return true;
};
