import { IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class GeneratePlanDto {
  /** ID from CurriculumWeek (state-specific). Provide this OR generalCurriculumId. */
  @IsOptional() @IsUUID() curriculumWeekId?: string;

  /** ID from GeneralCurriculum (national fallback). Provide this OR curriculumWeekId. */
  @IsOptional() @IsUUID() generalCurriculumId?: string;

  @IsNumber() @IsPositive() durationMinutes: number;

  @IsOptional() @IsUUID() resourceId?: string;
}
