import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const gearCategoryEnum = z.enum([
  'Moto',
  'Bagages',
  'Vêtements',
  'Tech',
  'Campement',
  'Cuisine',
  'Atelier',
  'Hygiène',
  'Administratif',
])

const voyages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/voyages' }),
  schema: ({ image }) =>
    z.object({
      id: z.string().min(1),
      titre: z.string().min(1),
      description: z.string().min(1),
      date: z.coerce.date(),
      gpxFile: z.string().min(1),
      country: z.string().min(1),
      duration: z.number().positive(),
      draft: z.boolean().default(false),
      image: image(),
      youtubeId: z.string().min(1),
    }),
})

const gear = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/gear' }),
  schema: ({ image }) =>
    z.object({
      id: z.string().min(1),
      titre: z.string().min(1),
      marque: z.string().min(1).optional(),
      categorie: gearCategoryEnum.optional(),
      description: z.string().min(1),
      proTip: z.string().optional(),
      specs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
      image: image(),
      url: z.string().url().optional(),
    }),
})

export const collections = {
  voyages,
  gear,
}
