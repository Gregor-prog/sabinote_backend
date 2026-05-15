import { z } from 'zod';

const CoordSchema = z.object({
  x: z.number(),
  y: z.number(),
  label: z.string().optional(),
});

export const DiagramSchema = z.object({
  type: z.enum(['number_line', 'cartesian_plane', 'bar_chart', 'table_of_values']),
  title: z.string().optional(),

  // number_line
  range: z.tuple([z.number(), z.number()]).optional(),
  markedPoints: z.array(z.object({ value: z.number(), label: z.string().optional() })).optional(),

  // cartesian_plane
  xRange: z.tuple([z.number(), z.number()]).optional(),
  yRange: z.tuple([z.number(), z.number()]).optional(),
  points: z.array(CoordSchema).optional(),
  lines: z.array(z.object({ from: CoordSchema, to: CoordSchema })).optional(),

  // bar_chart
  bars: z.array(z.object({ label: z.string(), value: z.number() })).optional(),
  yAxisLabel: z.string().optional(),

  // table_of_values
  columns: z.array(z.object({ header: z.string(), values: z.array(z.string()) })).optional(),
});

export type Diagram = z.infer<typeof DiagramSchema>;
