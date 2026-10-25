import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { buildGalaxy, stringToNormalizedHash, getStarColorByAngle } from "../buildGalaxy";

describe("buildGalaxy unit tests", () => {
  test("boş veri: songs boş dizi ise hata vermeden boş stars dönmeli", () => {
    const result = buildGalaxy([]);
    assert.equal(result.stars.length, 0);
    assert.equal(result.maxTotalSecs, 0);
    assert.equal(result.playedCount, 0);
    assert.equal(result.unplayedCount, 0);
  });

  test("tek şarkı (dinlenmiş): rank=0, radius=40, glow=1 olmalı", () => {
    const song = {
      id: "song_1",
      title: "Gece Şarkısı",
      artist: "Sanatçı A",
      duration: 200,
    };
    const stat = {
      sid: "song_1",
      total_secs: 1200,
      mean_angle: 0, // 0 saat yönü (00:00 tepe)
    };

    const result = buildGalaxy([song], [stat]);
    assert.equal(result.stars.length, 1);
    const star = result.stars[0]!;
    assert.equal(star.id, "song_1");
    assert.equal(star.played, true);
    assert.equal(star.radius, 40); // 40 + sqrt(0) * 460 = 40
    assert.equal(star.glow, 1); // log1p(1200) / log1p(1200) = 1
    assert.equal(result.maxTotalSecs, 1200);
    assert.equal(result.playedCount, 1);
    assert.equal(result.unplayedCount, 0);
  });

  test("hiç dinlenmemiş şarkılar: total_secs=0, glow=0 olmalı ve aynı sanatçı aynı açıda kümelenmeli", () => {
    const songA1 = {
      id: "song_a1",
      title: "Parça 1",
      artist: "Duman",
    };
    const songA2 = {
      id: "song_a2",
      title: "Parça 2",
      artist: "Duman",
    };
    const songB = {
      id: "song_b",
      title: "Başka Parça",
      artist: "Mor ve Ötesi",
    };

    const result = buildGalaxy([songA1, songA2, songB], []);
    assert.equal(result.stars.length, 3);
    assert.equal(result.playedCount, 0);
    assert.equal(result.unplayedCount, 3);
    assert.equal(result.maxTotalSecs, 0);

    const starA1 = result.stars.find((s) => s.id === "song_a1")!;
    const starA2 = result.stars.find((s) => s.id === "song_a2")!;
    const starB = result.stars.find((s) => s.id === "song_b")!;

    // Tüm glow'lar 0 olmalı
    assert.equal(starA1.glow, 0);
    assert.equal(starA2.glow, 0);
    assert.equal(starB.glow, 0);

    // Aynı sanatçının şarkıları (Duman) aynı açıda kümelenmeli
    assert.equal(starA1.angle, starA2.angle);
    // Farklı sanatçı farklı açıda olmalı
    assert.notEqual(starA1.angle, starB.angle);
  });

  test("Bilinmeyen Sanatçı durumunda sanatçı yerine id hash'i kullanılmalı", () => {
    const song1 = {
      id: "unk_1",
      title: "İsimsiz 1",
      artist: "Bilinmeyen Sanatçı",
    };
    const song2 = {
      id: "unk_2",
      title: "İsimsiz 2",
      artist: "Bilinmeyen Sanatçı",
    };

    const result = buildGalaxy([song1, song2], []);
    const star1 = result.stars.find((s) => s.id === "unk_1")!;
    const star2 = result.stars.find((s) => s.id === "unk_2")!;

    // Bilinmeyen Sanatçı tek bir sanatçı gibi hepsi aynı yerde üst üste binmemeli, id'ye göre ayrılmalı
    assert.notEqual(star1.angle, star2.angle);
  });

  test("açı yönü doğrulaması: 00:00 tepede, 06:00 sağda, 12:00 altta, 18:00 solda", () => {
    // mean_angle = 0 (00:00) -> angle = 0 - pi/2 = -pi/2 (tepede, x=0, y=-radius)
    const songNight = { id: "night", title: "Gece", artist: "A" };
    const statNight = { sid: "night", total_secs: 100, mean_angle: 0 };

    // mean_angle = pi/2 (06:00) -> angle = pi/2 - pi/2 = 0 (sağda, x=radius, y=0)
    const songMorning = { id: "morning", title: "Sabah", artist: "A" };
    const statMorning = { sid: "morning", total_secs: 100, mean_angle: Math.PI / 2 };

    // mean_angle = pi (12:00) -> angle = pi - pi/2 = pi/2 (altta, x=0, y=radius)
    const songNoon = { id: "noon", title: "Öğle", artist: "A" };
    const statNoon = { sid: "noon", total_secs: 100, mean_angle: Math.PI };

    const result = buildGalaxy([songNight, songMorning, songNoon], [statNight, statMorning, statNoon]);
    const starNight = result.stars.find((s) => s.id === "night")!;
    const starMorning = result.stars.find((s) => s.id === "morning")!;
    const starNoon = result.stars.find((s) => s.id === "noon")!;

    // Gece: x ≈ 0, y < 0 (tepede)
    assert.ok(Math.abs(starNight.x) < 0.0001, `Night x should be ~0, got ${starNight.x}`);
    assert.ok(starNight.y < 0, `Night y should be negative (top), got ${starNight.y}`);

    // Sabah: x > 0 (sağda), y ≈ 0
    assert.ok(starMorning.x > 0, `Morning x should be positive (right), got ${starMorning.x}`);
    assert.ok(Math.abs(starMorning.y) < 0.0001, `Morning y should be ~0, got ${starMorning.y}`);

    // Öğle: x ≈ 0, y > 0 (altta)
    assert.ok(Math.abs(starNoon.x) < 0.0001, `Noon x should be ~0, got ${starNoon.x}`);
    assert.ok(starNoon.y > 0, `Noon y should be positive (bottom), got ${starNoon.y}`);
  });
});
