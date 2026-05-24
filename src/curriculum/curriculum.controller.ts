import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { CurriculumService } from './curriculum.service';
import { SeedCurriculumDto } from './dto/seed-curriculum.dto';
import { SeedGeneralCurriculumDto } from './dto/seed-general-curriculum.dto';

@UseGuards(JwtAuthGuard)
@Controller('curriculum')
export class CurriculumController {
  constructor(private curriculumService: CurriculumService) {}

  // ─── Browse (fallback-aware) ────────────────────────────────────────────

  @Get('states')
  async getStates() {
    return {
      success: true,
      data: { states: await this.curriculumService.getStates() },
    };
  }

  @Get('subjects')
  async getSubjects(
    @Query('state') state: string,
    @Query('classLevel') classLevel: string,
  ) {
    return {
      success: true,
      data: {
        subjects: await this.curriculumService.getSubjects(state, classLevel),
      },
    };
  }

  /**
   * Returns weeks for a given state/subject/classLevel/term.
   * Each item carries a `source` ('state' | 'general') and an `id`
   * that the frontend passes to POST /generation/plan.
   */
  @Get('weeks')
  async getWeeks(
    @Query('state') state: string,
    @Query('subject') subject: string,
    @Query('classLevel') classLevel: string,
    @Query('term') term: string,
  ) {
    return {
      success: true,
      data: {
        weeks: await this.curriculumService.getWeeks(
          state,
          subject,
          classLevel,
          +term,
        ),
      },
    };
  }

  /**
   * Returns a single week — state curriculum preferred, general as fallback.
   */
  @Get('week')
  async getWeek(
    @Query('state') state: string,
    @Query('subject') subject: string,
    @Query('classLevel') classLevel: string,
    @Query('term') term: string,
    @Query('week') week: string,
  ) {
    return {
      success: true,
      data: await this.curriculumService.getWeek(
        state,
        subject,
        classLevel,
        +term,
        +week,
      ),
    };
  }

  // ─── Admin seeding ──────────────────────────────────────────────────────

  /** Seed state-specific curriculum weeks (admin only). */
  @Post('seed')
  @UseGuards(AdminGuard)
  async seed(@Body() dto: SeedCurriculumDto) {
    return { success: true, data: await this.curriculumService.seed(dto) };
  }

  /** Seed national (general) curriculum weeks (admin only). */
  @Post('general/seed')
  @UseGuards(AdminGuard)
  async seedGeneral(@Body() dto: SeedGeneralCurriculumDto) {
    return {
      success: true,
      data: await this.curriculumService.seedGeneral(dto),
    };
  }
}
