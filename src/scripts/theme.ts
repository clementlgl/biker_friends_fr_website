/**
 * Gestion du thème sombre/clair
 * Persiste le choix de l'utilisateur et applique sans flash
 */

export type Theme = 'light' | 'dark' | 'auto';

export const THEME_KEY = 'theme';

/**
 * Détecte si le mode sombre est préféré par le système
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Obtient le thème effectif en fonction des préférences sauvegardées et du système
 */
export function getEffectiveTheme(saved?: Theme): 'light' | 'dark' {
  const theme = saved || (typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_KEY) : null) || 'auto';
  
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  return getSystemTheme(); // auto
}

/**
 * Applique le thème au DOM
 */
export function applyTheme(theme: 'light' | 'dark'): void {
  const html = document.documentElement;
  
  if (theme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  
  // Applique color-scheme pour les éléments natifs du navigateur
  html.style.colorScheme = theme;
}

/**
 * Bascule le thème entre light et dark
 */
export function toggleTheme(): void {
  const html = document.documentElement;
  const isDark = html.classList.contains('dark');
  const newTheme: Theme = isDark ? 'light' : 'dark';
  
  applyTheme(newTheme);
  localStorage.setItem(THEME_KEY, newTheme);
}

/**
 * Initialise le thème au chargement de la page
 */
export function initTheme(): void {
  const saved = typeof localStorage !== 'undefined' ? (localStorage.getItem(THEME_KEY) as Theme | null) : null;
  const theme = getEffectiveTheme(saved || undefined);
  applyTheme(theme);
}

/**
 * Script d'initialisation INLINE pour éviter le flash blanc
 * À inclure dans le <head> avec is:inline
 */
export const INLINE_INIT_SCRIPT = `
(function() {
  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  function getEffectiveTheme() {
    const saved = localStorage.getItem('theme') || 'auto';
    if (saved === 'dark') return 'dark';
    if (saved === 'light') return 'light';
    return getSystemTheme();
  }
  
  const theme = getEffectiveTheme();
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
  document.documentElement.style.colorScheme = theme;
})();
`;
