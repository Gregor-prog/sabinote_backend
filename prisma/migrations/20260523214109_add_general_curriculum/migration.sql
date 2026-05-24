-- AlterTable
ALTER TABLE "LessonNote" ADD COLUMN     "generalCurriculumId" TEXT;

-- AlterTable
ALTER TABLE "Wallet" ALTER COLUMN "balance" SET DEFAULT 24.00;

-- CreateTable
CREATE TABLE "GeneralCurriculum" (
    "generalCurriculumId" TEXT NOT NULL,
    "subject" VARCHAR(150) NOT NULL,
    "classLevel" VARCHAR(20) NOT NULL,
    "term" SMALLINT NOT NULL,
    "week" SMALLINT NOT NULL,
    "topic" VARCHAR(255) NOT NULL,
    "subTopics" TEXT[],
    "objectives" TEXT[],
    "teachingActivities" TEXT,
    "teachingAids" TEXT,
    "evaluation" TEXT,
    "referenceText" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneralCurriculum_pkey" PRIMARY KEY ("generalCurriculumId")
);

-- CreateIndex
CREATE INDEX "idx_general_curriculum_subject" ON "GeneralCurriculum"("subject", "classLevel");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralCurriculum_subject_classLevel_term_week_key" ON "GeneralCurriculum"("subject", "classLevel", "term", "week");
