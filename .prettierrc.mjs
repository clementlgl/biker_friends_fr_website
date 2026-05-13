/**
 * @prettier
 * Configuration Prettier pour Road Trip Moto
 * Formatage strict sans points-virgules et avec guillemets simples
 */
export default {
  // Pas de points-virgules
  semi: false,

  // Guillemets simples pour JavaScript
  singleQuote: true,

  // Largeur de ligne par défaut
  printWidth: 100,

  // Indentation avec 2 espaces
  tabWidth: 2,
  useTabs: false,

  // Pas de virgule traînante en ES5
  trailingComma: 'es5',

  // Espaces autour des crochets dans les objets
  bracketSpacing: true,

  // Placer la balise fermante > sur la même ligne dans JSX
  bracketSameLine: false,

  // Attributs entre parenthèses en JSX
  arrowParens: 'always',

  // HTML whitespace sensitivity
  htmlWhitespaceSensitivity: 'css',

  // Terminaison des lignes Unix
  endOfLine: 'lf',

  // Plugin pour gérer les fichiers Astro
  plugins: ['prettier-plugin-astro'],

  // Langues à supporter pour l'auto-détection
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
    {
      files: ['*.md', '*.mdx'],
      options: {
        parser: 'markdown',
        proseWrap: 'preserve',
      },
    },
    {
      files: '*.yaml',
      options: {
        parser: 'yaml',
      },
    },
  ],
}
