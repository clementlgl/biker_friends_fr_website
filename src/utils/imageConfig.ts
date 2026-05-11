/**
 * Utilitaire pour gérer les images de manière optimisée
 * Supporte à la fois src/assets/ (optimisé) et public/ (static)
 */

export interface ImageProps {
  src: string;
  alt: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  widths?: number[];
  sizes?: string;
}

/**
 * Détecte si une image est dans src/assets/ ou public/
 */
export function isAssetImage(src: string): boolean {
  // Les images dans public/ commencent par /
  // Les images dans src/assets/ sont des imports
  return !src.startsWith('/');
}

/**
 * Configuration des images responsives par usage
 */
export const imageConfigs = {
  // Hero / Banner - LCP candidate
  hero: {
    loading: 'eager',
    decoding: 'sync',
    widths: [640, 1024, 1280, 1536],
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw',
  },
  
  // Cartes de voyage - Galerie
  card: {
    loading: 'lazy',
    decoding: 'async',
    widths: [400, 600, 800, 1000],
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw',
  },
  
  // Équipement - Galerie
  gear: {
    loading: 'lazy',
    decoding: 'async',
    widths: [700, 900],
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  },
  
  // Petites images - Thumbnails
  thumbnail: {
    loading: 'lazy',
    decoding: 'async',
    widths: [600],
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  },
};

/**
 * Format d'export des images optimisées
 * WebP principal avec fallback JPEG
 */
export const imageFormats = ['webp', 'jpeg'] as const;
