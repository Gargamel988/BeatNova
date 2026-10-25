import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  distance,
  resamplePolyline,
  pickStarsAlongPath,
  generateCenterOutPreset,
  generateOuterInPreset,
  generateCycle24hPreset,
} from "../constellation";
import type { GalaxyStar } from "../buildGalaxy";

const mockStar = (
  id: string,
  x: number,
  y: number,
  radius: number,
  angle: number,
  played: boolean
): GalaxyStar => ({
  id,
  x,
  y,
  radius,
  angle,
  played,
  glow: played ? 0.8 : 0,
  total_secs: played ? 1000 : 0,
  title: `Şarkı ${id}`,
  artist: "Sanatçı",
  album: "Albüm",
  duration: 180,
  play_count: played ? 5 : 0,
  color: "#F8FAFC",
});

describe("constellation unit tests", () => {
  test("distance: iki nokta arası mesafeyi doğru hesaplar", () => {
    assert.equal(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
    assert.equal(distance({ x: 10, y: 10 }, { x: 10, y: 10 }), 0);
  });

  test("resamplePolyline: boş veya tek noktalı yolları güvenli işler", () => {
    assert.deepEqual(resamplePolyline([]), []);
    assert.deepEqual(resamplePolyline([{ x: 5, y: 5 }]), [{ x: 5, y: 5 }]);
  });

  test("resamplePolyline: uzun segmentleri adım adım alt noktalara böler", () => {
    const raw = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];
    const resampled = resamplePolyline(raw, 20);
    assert.ok(resampled.length >= 5);
    assert.equal(resampled[0].x, 0);
    assert.equal(resampled[resampled.length - 1].x, 100);
  });

  test("pickStarsAlongPath: yol üzerindeki yıldızları sıra ile ve duplikatsız yakalar", () => {
    const stars: GalaxyStar[] = [
      mockStar("s1", 10, 0, 50, 0, true),
      mockStar("s2", 50, 0, 100, 0, true),
      mockStar("s3", 90, 0, 150, 0, true),
      mockStar("s4", 500, 500, 500, 0, false), // uzakta
    ];

    // (0,0) -> (100,0) arası çizilen bir çizgi
    const path = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];

    const picked = pickStarsAlongPath(path, stars, 25);
    assert.equal(picked.length, 3);
    assert.equal(picked[0].id, "s1");
    assert.equal(picked[1].id, "s2");
    assert.equal(picked[2].id, "s3");
  });

  test("pickStarsAlongPath: aynı yıldıza birden fazla temas olsa bile tekrar eklemez", () => {
    const stars: GalaxyStar[] = [mockStar("s1", 10, 10, 50, 0, true)];
    // Yıldızın etrafında dolanan çizgi
    const path = [
      { x: 0, y: 10 },
      { x: 10, y: 10 },
      { x: 20, y: 10 },
      { x: 10, y: 10 },
    ];

    const picked = pickStarsAlongPath(path, stars, 15);
    assert.equal(picked.length, 1);
  });

  test("generateCenterOutPreset: radius küçükten büyüğe sıralar", () => {
    const stars: GalaxyStar[] = [
      mockStar("s_outer", 200, 0, 300, 0, false),
      mockStar("s_inner", 10, 0, 50, 0, true),
      mockStar("s_mid", 100, 0, 150, 0, true),
    ];
    const preset = generateCenterOutPreset(stars, 10);
    assert.equal(preset[0].id, "s_inner");
    assert.equal(preset[1].id, "s_mid");
    assert.equal(preset[2].id, "s_outer");
  });

  test("generateOuterInPreset: radius büyükten küçüğe sıralar", () => {
    const stars: GalaxyStar[] = [
      mockStar("s_inner", 10, 0, 50, 0, true),
      mockStar("s_outer", 200, 0, 300, 0, false),
    ];
    const preset = generateOuterInPreset(stars, 10);
    assert.equal(preset[0].id, "s_outer");
    assert.equal(preset[1].id, "s_inner");
  });

  test("generateCycle24hPreset: açıya göre sıralar", () => {
    const stars: GalaxyStar[] = [
      mockStar("s_noon", 0, 100, 100, Math.PI / 2, true),
      mockStar("s_dawn", 0, -100, 100, -Math.PI / 2, true),
    ];
    const preset = generateCycle24hPreset(stars, 10);
    assert.equal(preset[0].id, "s_dawn");
    assert.equal(preset[1].id, "s_noon");
  });
});
