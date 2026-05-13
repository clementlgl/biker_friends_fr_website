import { getCollection } from 'astro:content'
import type { CollectionEntry } from 'astro:content'

/**
 * Mapping des noms de dossiers vers les catégories avec capitalization
 */
const folderToCategoryMap: Record<string, string> = {
  administratif: 'Administratif',
  atelier: 'Atelier',
  bagages: 'Bagages',
  campement: 'Campement',
  cuisine: 'Cuisine',
  hygiene: 'Hygiène',
  moto: 'Moto',
  tech: 'Tech',
  vetements: 'Vêtements',
  // Dossiers spéciaux pour files mal organisés
  divers: 'Divers',
}

/**
 * Extrait la catégorie à partir du chemin du fichier
 */
function getCategoryFromPath(id: string): string {
  const parts = id.split('/')
  if (parts.length > 1) {
    const folder = parts[0].toLowerCase()
    return folderToCategoryMap[folder] || folder.charAt(0).toUpperCase() + folder.slice(1)
  }
  // Fallback si pas de dossier parent
  return 'Divers'
}

/**
 * Charge tous les items gear et ajoute la catégorie extraite du dossier
 */
export async function getGearItems() {
  const items = await getCollection('gear')

  return items.map((item) => ({
    ...item,
    data: {
      ...item.data,
      // Utiliser la catégorie du frontmatter si elle existe, sinon l'extraire du dossier
      categorie: item.data.categorie || getCategoryFromPath(item.id),
    },
  }))
}
