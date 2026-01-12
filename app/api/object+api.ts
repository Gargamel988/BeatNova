import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { ObjectScheme } from "@/schemes/ObjectScheme";
import { webSearchTool } from "@/lib/tools/webSearch";

// Web search helper function - webSearchTool'dan sonuç alıp formatla
async function searchWeb(query: string): Promise<string> {
  try {
    const result = await webSearchTool.execute({ query });
    
    // Eğer hata varsa boş döndür
    
    if ('error' in result && result.error) {
      console.log(result.error);
      return "";
    }

    // Sonuçları formatla
    let formattedResult = "";
    if (result.answer) {
      formattedResult += `Web Arama Sonucu: ${result.answer}\n\n`;
    }
    if (result.results && result.results.length > 0) {
      formattedResult += "İlgili Kaynaklar:\n";
      result.results.slice(0, 3).forEach((item: any, index: number) => {
        formattedResult += `${index + 1}. ${item.title}: ${item.content?.substring(0, 200)}...\n`;
      });
    }
    
    return formattedResult;
  } catch {
    return "";
  }
}

// Expo Router API route handler
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const { input } = JSON.parse(body);
    if (!input) {
      return Response.json(
        { error: "Input must be a string" },
        { status: 400 }
      );
    }
    
    // Tüm müzik önerileri için web araması yap (güncel bilgiler için)
    // Özel durumlar: güncel, popüler, trend, yeni, son çıkan kelimeleri varsa daha spesifik arama yap
    const isSpecificSearch = 
      input.toLowerCase().includes('güncel') ||
      input.toLowerCase().includes('popüler') ||
      input.toLowerCase().includes('trend') ||
      input.toLowerCase().includes(new Date().getFullYear().toString()) ||
      input.toLowerCase().includes('yeni') ||
      input.toLowerCase().includes('son çıkan');
    
    
    let webSearchContext = "";
    // Her zaman web araması yap (güncel bilgiler için)
    // Ama API key yoksa sessizce devam et
    try {
      let searchQuery = "";
      
      if (isSpecificSearch) {
        // Spesifik arama - kullanıcının isteğine göre
        searchQuery = `${input} popüler şarkılar ${new Date().getFullYear()}`;
      } else {
        // Genel arama - kullanıcının isteğine uygun güncel şarkılar
        searchQuery = `${input} müzik önerileri ${new Date().getFullYear()}`;
      }
      
      webSearchContext = await searchWeb(searchQuery);
      
    } catch {
      webSearchContext = "";
    }

    // User message'ı hazırla
    const userMessage = webSearchContext 
      ? `${input}\n\n[Güncel Bilgiler]\n${webSearchContext}\n\nYukarıdaki güncel bilgileri kullanarak öneriler yap.`
      : input;
    
    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      messages: [{ role: 'user', content: userMessage }],
      
      system: `Sen profesyonel bir müzik önerisi asistanısın. Kullanıcıların müzik zevklerine uygun, çeşitli ve kaliteli şarkı önerileri sunuyorsun.

ÖNEMLİ KURALLAR:
1. TÜRKÇE ŞARKILAR: Her playlist'te mutlaka Türkçe şarkılar da öner. Türk pop, Türk rock, Türk rap, Anadolu rock gibi türlerden güncel ve popüler şarkılar ekle.

2. GÜNCEL ŞARKILAR: 2020-2024 yılları arasındaki popüler ve güncel şarkıları öncelik ver.

3. ÇEŞİTLİLİK: Her playlist'te farklı türlerden, farklı dönemlerden ve farklı dillerden şarkılar olsun.

4. POPÜLER ŞARKILAR: Spotify, Apple Music gibi platformlarda popüler olan şarkıları öner.

5. ŞARKI BİLGİLERİ: Her şarkı için doğru bilgiler ver (ad, sanatçı, albüm, yıl, türü, süre, enerji, mood).

6. PLAYLIST BİLGİLERİ: Her playlist için isim, açıklama, toplam süre, ruh hali ve etiketler ekle.

7. ÖNERİ NEDENİ: Neden bu şarkıları önerdiğini açıkla.

8. ŞARKI SAYISI: 8-15 şarkı öner.

9. KALİTE: Sadece gerçekten var olan, popüler şarkıları öner.

10. DİL DENGESİ: Türkçe ve yabancı şarkılar arasında denge kur.`,
      schema: ObjectScheme,
    });

    return Response.json(result.object);
  } catch (error: any) {
    console.error("API Error:", error);
    return Response.json({ error: error.message || "Bir hata oluştu" }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET() {
  return Response.json({ message: "Chat API endpoint is working" });
}

// OPTIONS method for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
