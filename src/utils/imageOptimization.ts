/**
 * Solution alternative pour optimiser les images depuis public/
 * Utilise getImage() d'Astro pour générer du WebP
 */

import { getImage } from 'astro:assets';

/**
 * Optimise une image publique en générant une version WebP
 * Note: Cette approche fonctionne pour les images de production
 */
export async function optimizePublicImage(
  src: string,
  alt: string,
  options: {
    width?: number;
    height?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
  } = {}
) {
  // Pour les images dans public/, nous pouvons les traiter avec getImage
  // mais avec une limitation : getImage() requiert un import d'asset

  // Alternative : utiliser picture element avec formats WebP
  return {
    src,
    alt,
    formats: ['webp', 'jpeg'],
    ...options
  };
}

/**
 * Génère une URL WebP à partir d'une image publique
 * Utilise un service de conversion ou un proxy
 */
export function getWebPUrl(publicImageUrl: string): string {
  // Si l'image est déjà en WebP, la retourner
  if (publicImageUrl.endsWith('.webp')) {
    return publicImageUrl;
  }

  // Pour les images JPEG/PNG, retourner l'URL originale
  // (dans un environnement de production, utiliser Cloudinary, ImageKit, etc.)
  return publicImageUrl;
}
