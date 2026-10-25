import type { GalaxyStar } from "./buildGalaxy";

export type Point2D = {
  x: number;
  y: number;
};

/**
 * İki nokta arasındaki Öklid mesafesi
 */
export function distance(p1: Point2D, p2: Point2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Polyline'ı belirli bir adım aralığıyla (step) yeniden örnekler.
 * Kullanıcı parmağını hızlı kaydırdığında arada kalan yıldızların
 * kaçırılmasını engeller.
 */
export function resamplePolyline(
  points: Point2D[],
  step: number = 12
): Point2D[] {
  if (!points || points.length === 0) return [];
  if (points.length === 1) return [{ ...points[0] }];

  const resampled: Point2D[] = [{ ...points[0] }];
  let prev = points[0];

  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    const segmentDist = distance(prev, curr);

    if (segmentDist >= step) {
      const numSteps = Math.floor(segmentDist / step);
      for (let s = 1; s <= numSteps; s++) {
        const t = (s * step) / segmentDist;
        resampled.push({
          x: prev.x + (curr.x - prev.x) * t,
          y: prev.y + (curr.y - prev.y) * t,
        });
      }
      prev = curr;
    }
  }

  // Son noktayı ekle
  const last = points[points.length - 1];
  if (
    distance(resampled[resampled.length - 1], last) > 0.1
  ) {
    resampled.push({ ...last });
  }

  return resampled;
}

/**
 * Çizilen yol üzerindeki yıldızları sıra korunarak ve duplikatsız yakalar.
 * @param pathPoints Galaksi uzayındaki çizim koordinatları
 * @param stars Haritadaki tüm yıldızlar
 * @param captureRadius Yakalama yarıçapı (varsayılan 35px)
 */
export function pickStarsAlongPath(
  pathPoints: Point2D[],
  stars: GalaxyStar[],
  captureRadius: number = 35
): GalaxyStar[] {
  if (!pathPoints || pathPoints.length === 0 || !stars || stars.length === 0) {
    return [];
  }

  const resampled = resamplePolyline(pathPoints, 10);
  const pickedStars: GalaxyStar[] = [];
  const pickedIds = new Set<string>();

  for (const point of resampled) {
    for (const star of stars) {
      if (pickedIds.has(star.id)) continue;

      const dist = distance(point, { x: star.x, y: star.y });
      if (dist <= captureRadius) {
        pickedIds.add(star.id);
        pickedStars.push(star);
      }
    }
  }

  return pickedStars;
}

/**
 * Hazır Şablon 1: Merkezden Dışa (En çok dinlenenlerden keşfedilmemişlere)
 */
export function generateCenterOutPreset(
  stars: GalaxyStar[],
  limit: number = 20
): GalaxyStar[] {
  if (!stars || stars.length === 0) return [];
  // radius'a göre artan sırala (küçük radius = merkez = çok dinlenen)
  const sorted = [...stars].sort((a, b) => a.radius - b.radius);
  return sorted.slice(0, limit);
}

/**
 * Hazır Şablon 2: Dıştan Merkeze (Sönüklerden / keşfedilmemişlerden favorilere)
 */
export function generateOuterInPreset(
  stars: GalaxyStar[],
  limit: number = 20
): GalaxyStar[] {
  if (!stars || stars.length === 0) return [];
  // radius'a göre azalan sırala (büyük radius = dış = az dinlenen)
  const sorted = [...stars].sort((a, b) => b.radius - a.radius);
  return sorted.slice(0, limit);
}

/**
 * Hazır Şablon 3: Günün Döngüsü (24 Saatlik Zaman Halkası)
 * Sabah (06:00) -> Gün Ortası (12:00) -> Akşam (18:00) -> Gece (00:00)
 */
export function generateCycle24hPreset(
  stars: GalaxyStar[],
  limit: number = 20
): GalaxyStar[] {
  if (!stars || stars.length === 0) return [];
  // Sadece dinlenmişleri al (dinleme saatleri anlamlı olsun), yoksa tümünü
  const pool = stars.filter((s) => s.played);
  const source = pool.length >= 5 ? pool : stars;

  // Açıya göre sırala (-PI .. PI)
  const sorted = [...source].sort((a, b) => a.angle - b.angle);
  return sorted.slice(0, limit);
}
