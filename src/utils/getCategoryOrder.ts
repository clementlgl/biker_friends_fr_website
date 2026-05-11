import fs from 'fs';
import path from 'path';

/**
 * Mapping des noms de dossiers vers les catégories avec capitalization
 */
const folderToCategoryMap: Record<string, string> = {
  'administratif': 'Administratif',
  'atelier': 'Atelier',
  'bagages': 'Bagages',
  'campement': 'Campement',
  'cuisine': 'Cuisine',
  'hygiene': 'Hygiène',
  'moto': 'Moto',
  'tech': 'Tech',
  'vetements': 'Vêtements',
};

/**
 * Ordre des catégories à utiliser
 */
const categoryOrderDefault = ['Administratif', 'Atelier', 'Campement', 'Cuisine', 'Hygiène', 'Tech', 'Vêtements', 'Bagages', 'Moto'];

/**
 * Récupère l'ordre des catégories à partir des sous-dossiers de src/content/gear
 */
export function getCategoryOrder(): string[] {
  const gearDir = path.join(process.cwd(), 'src', 'content', 'gear');
  
  try {
    const entries = fs.readdirSync(gearDir, { withFileTypes: true });
    
    // Filtrer les sous-dossiers (excluant les fichiers)
    const subdirs = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    
    // Convertir les noms de dossiers en catégories capitalisées et retourner dans l'ordre défini
    const categories = categoryOrderDefault.filter(cat => {
      const folder = Object.entries(folderToCategoryMap).find(([_, category]) => category === cat)?.[0];
      return folder && subdirs.includes(folder);
    });
    
    return categories;
  } catch (error) {
    console.error('Error reading gear directory:', error);
    // Fallback vers l'ordre par défaut si le répertoire n'existe pas
    return categoryOrderDefault;
  }
}
