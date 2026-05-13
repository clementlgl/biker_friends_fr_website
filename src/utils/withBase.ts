/**
 * Ajoute le BASE_URL à un chemin absolu s'il commence par /
 * Utilisé pour supporter différents base paths en local et production
 */
export function withBase(path: string, baseUrl: string): string {
  // Si le path est vide, retourner le baseUrl
  if (!path) return baseUrl

  // Si le path commence par /, le préfixer avec le baseUrl
  if (path.startsWith('/')) {
    return baseUrl + path.slice(1)
  }

  // Sinon, retourner le path tel quel (pour les URLs externes)
  return path
}
