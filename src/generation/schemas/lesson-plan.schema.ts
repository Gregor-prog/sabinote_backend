import { z } from 'zod';

export const LessonPlanSchema = z.object({
  metadata: z.object({
    subject: z.string(),
    classLevel: z.string(),
    topic: z.string(),
    subTopics: z.array(z.string()),
    term: z.coerce.number(),
    week: z.coerce.number(),
    duration: z.coerce.number(), // in minutes
    state: z.string(),
    session: z.string().optional(),
  }),

  referenceBooks: z.array(z.string()).min(1),

  instructionalMaterials: z.array(z.string()).min(1),

  // Prerequisites students MUST already have to follow this lesson
  entryBehaviour: z.string(),

  // Related content learned in previous lessons — used for review/bridging
  previousKnowledge: z.string(),

  objectives: z.object({
    // Bloom's taxonomy — knowledge, comprehension, application, analysis
    cognitive: z.array(z.string()).min(2),
    // Values, attitudes, appreciation
    affective: z.array(z.string()).min(1),
    // Observable physical/practical skills
    psychomotor: z.array(z.string()).min(1),
  }),

  // 3-step NERDC presentation format
  presentation: z.array(
    z.object({
      step: z.number(),
      title: z.string(), // e.g. "Identification of Prior Ideas", "Exploration", "Discussion"
      teacherActivity: z.string(),
      studentActivity: z.string(),
      duration: z.string().optional(),
    }),
  ).min(3),

  commonMisconceptions: z.array(
    z.object({
      description: z.string(),
      reason: z.string(),
      correction: z.string(),
    })
  ).min(1),

  differentiation: z.object({
    support: z.string(),
    extension: z.string(),
  }),

  evaluation: z.array(z.string()).min(3),

  summary: z.string(),

  assignment: z.string(),
});

export type LessonPlan = z.infer<typeof LessonPlanSchema>;
