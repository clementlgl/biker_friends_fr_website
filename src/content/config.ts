import { defineCollection, reference, z } from 'astro:content';

const difficultyEnum = z.enum(['Easy', 'Medium', 'Hard', 'Extreme']);
const gearCategoryEnum = z.enum(['Motorcycle', 'Luggage', 'Clothing', 'Tech']);

const voyages = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string().min(1),
    titre: z.string().min(1),
    description: z.string().min(1),
    date: z.coerce.date(),
    // difficulty: difficultyEnum, // supprimé
    // terrain: z.string().min(1), // supprimé
    distance: z.number().positive().optional(),
    duration: z.number().positive(),
    image: z.string().min(1),
    gpxFile: z.string().min(1),
    youtubeId: z.string().min(1),
    gearRelated: z.array(reference('gear')).default([])
  })
});

const gear = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string().min(1),
    titre: z.string().min(1),
    marque: z.string().min(1),
    categorie: gearCategoryEnum,
    description: z.string().min(1),
    proTip: z.string().min(1),
    specs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
    image: z.string().min(1)
  })
});

export const collections = {
  voyages,
  gear
};
