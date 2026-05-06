import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calcule la distance totale en km depuis un fichier GPX dans /public.
 * @param gpxPublicPath ex: "/gpx/trans-pyrenean-adventure.gpx"
 * @returns distance arrondie en km, ou null si le fichier est introuvable / invalide
 */
export function distanceFromGpx(gpxPublicPath: string): number | null {
  try {
    const fullPath = join(process.cwd(), 'public', gpxPublicPath);
    const xml = readFileSync(fullPath, 'utf-8');

    const matches = [...xml.matchAll(/lat="([\d.\-]+)"\s+lon="([\d.\-]+)"/g)];
    if (matches.length < 2) return null;

    let total = 0;
    for (let i = 1; i < matches.length; i++) {
      const [, lat1, lon1] = matches[i - 1];
      const [, lat2, lon2] = matches[i];
      total += haversineKm(+lat1, +lon1, +lat2, +lon2);
    }
    return Math.ceil(total / 50) * 50;
  } catch {
    return null;
  }
}
