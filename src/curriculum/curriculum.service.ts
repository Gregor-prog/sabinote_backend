import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SeedCurriculumDto } from './dto/seed-curriculum.dto';
import { SeedGeneralCurriculumDto } from './dto/seed-general-curriculum.dto';

// Unified shape returned to callers — same fields regardless of source
export type NormalizedCurriculum = {
  source: 'state' | 'general';
  id: string;
  state: string;
  subject: string;
  classLevel: string;
  term: number;
  week: number;
  topic: string;
  subTopics: string[];
  objectives: string[];
  teachingActivities?: string | null;
  teachingAids?: string | null;
  evaluation?: string | null;
  referenceText?: string | null;
};

@Injectable()
export class CurriculumService {
  constructor(private prisma: PrismaService) {}

  // ─── State curriculum (unchanged) ────────────────────────────────────────

  async getStates() {
    const rows = await this.prisma.curriculumWeek.findMany({
      distinct: ['state'],
      select: { state: true },
      orderBy: { state: 'asc' },
    });
    return rows.map((r) => r.state);
  }

  async seed(dto: SeedCurriculumDto) {
    const results = await Promise.allSettled(
      dto.weeks.map((w) =>
        this.prisma.curriculumWeek.upsert({
          where: {
            state_subject_classLevel_term_week: {
              state: w.state, subject: w.subject,
              classLevel: w.classLevel, term: w.term, week: w.week,
            },
          },
          update: w,
          create: w,
        }),
      ),
    );
    return { upserted: results.filter((r) => r.status === 'fulfilled').length, total: dto.weeks.length };
  }

  // ─── General curriculum ───────────────────────────────────────────────────

  async seedGeneral(dto: SeedGeneralCurriculumDto) {
    const results = await Promise.allSettled(
      dto.weeks.map((w) =>
        this.prisma.generalCurriculum.upsert({
          where: {
            subject_classLevel_term_week: {
              subject: w.subject, classLevel: w.classLevel, term: w.term, week: w.week,
            },
          },
          update: w,
          create: w,
        }),
      ),
    );
    return { upserted: results.filter((r) => r.status === 'fulfilled').length, total: dto.weeks.length };
  }

  // ─── Fallback-aware browse endpoints ─────────────────────────────────────

  /**
   * Returns subjects available for a state+classLevel.
   * Merges state curriculum subjects with general curriculum subjects,
   * so the teacher always sees the full national catalogue.
   */
  async getSubjects(state: string, classLevel: string): Promise<string[]> {
    const [stateRows, generalRows] = await Promise.all([
      this.prisma.curriculumWeek.findMany({
        where: { state, classLevel },
        distinct: ['subject'],
        select: { subject: true },
        orderBy: { subject: 'asc' },
      }),
      this.prisma.generalCurriculum.findMany({
        where: { classLevel },
        distinct: ['subject'],
        select: { subject: true },
        orderBy: { subject: 'asc' },
      }),
    ]);

    const seen = new Set<string>();
    const subjects: string[] = [];
    for (const r of [...stateRows, ...generalRows]) {
      if (!seen.has(r.subject)) { seen.add(r.subject); subjects.push(r.subject); }
    }
    return subjects.sort();
  }

  /**
   * Returns weeks for a term/subject/class.
   * State curriculum weeks take priority; missing weeks fall back to general.
   */
  async getWeeks(
    state: string, subject: string, classLevel: string, term: number,
  ): Promise<{ id: string; week: number; topic: string; source: 'state' | 'general' }[]> {
    const [stateRows, generalRows] = await Promise.all([
      this.prisma.curriculumWeek.findMany({
        where: { state, subject, classLevel, term },
        select: { curriculumWeekId: true, week: true, topic: true },
        orderBy: { week: 'asc' },
      }),
      this.prisma.generalCurriculum.findMany({
        where: { subject, classLevel, term },
        select: { generalCurriculumId: true, week: true, topic: true },
        orderBy: { week: 'asc' },
      }),
    ]);

    const stateWeekNums = new Set(stateRows.map((r) => r.week));

    const result = [
      ...stateRows.map((r) => ({ id: r.curriculumWeekId, week: r.week, topic: r.topic, source: 'state' as const })),
      // Only add general rows for weeks not covered by state curriculum
      ...generalRows
        .filter((r) => !stateWeekNums.has(r.week))
        .map((r) => ({ id: r.generalCurriculumId, week: r.week, topic: r.topic, source: 'general' as const })),
    ];

    return result.sort((a, b) => a.week - b.week);
  }

  /**
   * Returns a single curriculum week.
   * Tries state curriculum first, falls back to general.
   * Throws NotFoundException if neither has the week.
   */
  async getWeek(
    state: string, subject: string, classLevel: string, term: number, week: number,
  ): Promise<NormalizedCurriculum> {
    const stateRow = await this.prisma.curriculumWeek.findUnique({
      where: { state_subject_classLevel_term_week: { state, subject, classLevel, term, week } },
    });

    if (stateRow) {
      return { source: 'state', id: stateRow.curriculumWeekId, ...stateRow };
    }

    const generalRow = await this.prisma.generalCurriculum.findUnique({
      where: { subject_classLevel_term_week: { subject, classLevel, term, week } },
    });

    if (generalRow) {
      return { source: 'general', id: generalRow.generalCurriculumId, state, ...generalRow };
    }

    throw new NotFoundException(
      `No curriculum found for ${subject} ${classLevel} Term ${term} Week ${week} in ${state} or general.`,
    );
  }

  /**
   * Looks up a state curriculum week by its primary key.
   * Used by generation when curriculumWeekId is provided.
   */
  async getStateWeekById(curriculumWeekId: string): Promise<NormalizedCurriculum> {
    const row = await this.prisma.curriculumWeek.findUnique({ where: { curriculumWeekId } });
    if (!row) throw new NotFoundException('Curriculum week not found');
    return { source: 'state', id: row.curriculumWeekId, ...row };
  }

  /**
   * Looks up a general curriculum week by its primary key.
   * The caller supplies the teacher's state so the prompt has a state value.
   */
  async getGeneralWeekById(generalCurriculumId: string, teacherState: string): Promise<NormalizedCurriculum> {
    const row = await this.prisma.generalCurriculum.findUnique({ where: { generalCurriculumId } });
    if (!row) throw new NotFoundException('General curriculum week not found');
    return { source: 'general', id: row.generalCurriculumId, state: teacherState, ...row };
  }
}
