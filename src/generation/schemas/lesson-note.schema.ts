import { z } from 'zod';

export const LessonNoteSchema = z.object({
  header: z.object({
    subject: z.string(),
    classLevel: z.string(),
    topic: z.string(),
    subTopics: z.array(z.string()),
    term: z.coerce.number(),
    week: z.coerce.number(),
    duration: z.string(), // e.g. "40 minutes"
    state: z.string(),
    session: z.string().optional(),
  }),

  referenceBooks: z.array(z.string()).min(1),

  instructionalMaterials: z.array(z.string()).min(2),

  // Specific prerequisite skills students MUST possess to access this lesson
  entryBehaviour: z.string(),

  // Related content from previous lessons used to bridge to today's topic
  previousKnowledge: z.string(),

  objectives: z.object({
    // Bloom's taxonomy: identify, define, state, explain, calculate, apply, analyse, compare, evaluate
    cognitive: z.array(z.string()).min(2),
    // Values and attitudes: appreciate, value, show interest, cooperate, demonstrate willingness
    affective: z.array(z.string()).min(1),
    // Observable skills: draw, construct, measure, demonstrate, perform, use
    psychomotor: z.array(z.string()).min(1),
  }),

  // Full 3-step NERDC lesson presentation with complete teaching content
  presentation: z.array(
    z.object({
      step: z.number(),
      // Step 1: "Identification of Prior Ideas" — Step 2: "Exploration" — Step 3: "Discussion & Application"
      title: z.string(),
      teacherActivity: z.string(),   // what the teacher does/says in this step
      studentActivity: z.string(),   // what students do in this step
      // Full teaching content, explanation, narrative, questions asked — enough for a substitute teacher
      content: z.string(),
      duration: z.string().optional(),
    }),
  ).min(3),

  // Detailed subject content per sub-topic — the academic knowledge section
  subjectContent: z.array(
    z.object({
      subTopic: z.string(),
      // Complete conceptual explanation a student can study from
      explanation: z.string(),
      workedExamples: z.array(
        z.object({
          problem: z.string(),
          solution: z.string(), // full step-by-step working
        }),
      ),
      // Key sentences/rules to write on the board
      keyPoints: z.array(z.string()).min(2),
    }),
  ).min(1),

  // Concise points written on the board for students to copy
  boardSummary: z.array(z.string()).min(3),

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

  evaluation: z.array(
    z.object({
      question: z.string(),
      expectedAnswer: z.string(),
    }),
  ).min(3),

  // How the teacher wraps up the lesson — recap, connecting to next lesson
  summary: z.string(),

  assignment: z.array(z.string()).min(2),
});

export type LessonNote = z.infer<typeof LessonNoteSchema>;
