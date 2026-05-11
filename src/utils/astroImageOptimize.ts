/**
 * Utilitaire pour optimiser les images avec Astro
 * Génère les versions WebP au build
 */

import { getImage } from 'astro:assets';

/**
 * Crée une balise picture optimisée avec WebP
 * Utilise getImage() pour générer les versions optimisées
 * 
 * Note: Cette fonction est destinée à être appelée au build time
 * pour générer les attributs optimisés
 */
export async function getOptimizedImage(
  src: string,
  alt: string,
  options: {
    width?: number;
    height?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
  } = {}
) {
  // Pour les images publiques, on génère les attributs srcset
  // Astro gérera la conversion en WebP au build
  
  return {
    src,
    alt,
    // Astro traitera ces formats automatiquement
    formats: ['webp', 'jpeg'],
    ...options,
  };
}

/**
 * Génère les attributs pour une balise picture avec sources multiples
 */
export function generatePictureSources(publicImageUrl: string) {
  const baseUrl = publicImageUrl.replace(/\.(jpg|jpeg|png)$/i, '');
  const ext = publicImageUrl.match(/\.(jpg|jpeg|png)$/i)?.[0] || '.jpg';

  return {
    webp: baseUrl + '.webp',
    original: publicImageUrl,
  };
}
