"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { LoadingScreen } from "@/components/upload/LoadingScreen";
import { QuestionListPanel } from "@/components/mapping/QuestionListPanel";
import { AnswerSheetViewer } from "@/components/mapping/AnswerSheetViewer";
import { UnmatchedAnswersPanel } from "@/components/mapping/UnmatchedAnswersPanel";
import { NoAnswerFoundState } from "@/components/mapping/NoAnswerFoundState";
import { NoQuestionsFoundState } from "@/components/mapping/NoQuestionsFoundState";
import { useMappingData, type MappingData } from "@/lib/mapping/useMappingData";
import { useMappingSelection } from "@/lib/mapping/useMappingSelection";
import { useHandwritingCrossCheck } from "@/lib/mapping/useHandwritingCrossCheck";

function ErrorState({
  title,
  message,
  router,
  onRetry,
}: {
  title: string;
  message: string;
  router: ReturnType<typeof useRouter>;
  onRetry?: () => void;
}) {
  return (
    <AppShell background="muted">
      <div className="flex h-full min-h-[600px] flex-col items-center justify-center gap-3 text-center">
        <p className="text-lg font-bold text-ink-primary">{title}</p>
        <p className="text-sm text-ink-secondary">{message}</p>
        <div className="mt-2 flex items-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-pill bg-brand-orange px-6 py-3 text-sm font-medium text-white"
            >
              Try Again
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-pill bg-surface-dark-grey px-6 py-3 text-sm font-medium text-white"
          >
            Back to upload
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function MappingScreen({
  data,
  viewerBlobUrls,
}: {
  data: MappingData;
  viewerBlobUrls: string[];
}) {
  const { questions, regions, gradings } = data;
  const selection = useMappingSelection(questions, regions);
  // Mobile only (Figma's phone frames replace the desktop two-panel layout
  // with a "Questions | Answer Sheet" tab toggle — see
  // "Question - Answer mapping screen - Question/answer toggle (phone)").
  const [mobileTab, setMobileTab] = useState<"questions" | "answerSheet">("questions");
  // Phase 9 (docs/PRD.md §16): runs after this screen has already rendered
  // from Gemini's data — never blocks or delays the initial render.
  const crossCheck = useHandwritingCrossCheck(viewerBlobUrls, regions);
  const mismatchedRegionIds =
    crossCheck.status === "done" ? crossCheck.mismatchedRegionIds : new Set<string>();

  if (questions.length === 0) {
    return (
      <AppShell background="muted">
        <NoQuestionsFoundState />
      </AppShell>
    );
  }

  const unmatchedRegions = regions.filter((r) => r.matchedQuestionId === null);
  const selectedQuestion = questions.find((q) => q.id === selection.selectedQuestionId);
  const highlightLabel =
    selectedQuestion?.displayLabel ?? (selection.selectedUnmatchedRegionId ? "Unmatched" : null);

  function selectQuestionAndShowAnswer(questionId: string) {
    selection.selectQuestion(questionId);
    setMobileTab("answerSheet");
  }

  function selectRegionAndShowAnswer(regionId: string) {
    selection.selectUnmatchedRegion(regionId);
    setMobileTab("answerSheet");
  }

  return (
    <AppShell background="muted">
      <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row">
        <div className="flex w-full items-center rounded-full bg-surface-white p-1 shadow-realistic lg:hidden">
          <button
            type="button"
            onClick={() => setMobileTab("questions")}
            className={`flex-1 rounded-full py-2 text-sm font-medium ${
              mobileTab === "questions"
                ? "bg-surface-dark-grey text-white"
                : "text-ink-secondary"
            }`}
          >
            Questions
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("answerSheet")}
            className={`flex-1 rounded-full py-2 text-sm font-medium ${
              mobileTab === "answerSheet"
                ? "bg-surface-dark-grey text-white"
                : "text-ink-secondary"
            }`}
          >
            Answer Sheet
          </button>
        </div>

        <div
          className={`w-full min-h-0 flex-col gap-4 overflow-y-auto rounded-xl bg-surface-white/50 p-4 lg:flex lg:w-2/5 lg:min-w-[320px] lg:max-w-[672px] lg:shrink-0 ${
            mobileTab === "questions" ? "flex" : "hidden"
          }`}
        >
          <QuestionListPanel
            questions={questions}
            gradings={gradings}
            regions={regions}
            selectedQuestionId={selection.selectedQuestionId}
            onSelectQuestion={selectQuestionAndShowAnswer}
            mismatchedRegionIds={mismatchedRegionIds}
          />
          <UnmatchedAnswersPanel
            unmatchedRegions={unmatchedRegions}
            onSelectRegion={selectRegionAndShowAnswer}
            selectedRegionId={selection.selectedUnmatchedRegionId}
          />
        </div>
        <div
          className={`min-h-0 min-w-0 flex-1 flex-col lg:flex ${mobileTab === "answerSheet" ? "flex" : "hidden"}`}
        >
          {selection.hasNoAnswer ? (
            <NoAnswerFoundState
              questionLabel={`Question ${selectedQuestion?.displayLabel ?? ""}`}
            />
          ) : (
            <AnswerSheetViewer
              blobUrls={viewerBlobUrls}
              currentPageIndex={selection.currentPageIndex}
              onGoToPage={selection.goToPage}
              highlightRegions={selection.activeRegions}
              highlightLabel={highlightLabel}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

function MappingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const questionPaperUrl = searchParams.get("questionPaper") ?? "";
  const answerSheetUrl = searchParams.get("answerSheet") ?? "";
  // Multi-image answer sheets are merged into a single PDF client-side before
  // upload (see src/lib/upload/mergeFilesToPdf.ts and docs/DECISIONS.md), so
  // every slot is always exactly one blob URL by the time it reaches this page.
  const viewerBlobUrls = useMemo(
    () => (answerSheetUrl ? [answerSheetUrl] : []),
    [answerSheetUrl],
  );

  const dataState = useMappingData(questionPaperUrl, answerSheetUrl);

  if (!questionPaperUrl || !answerSheetUrl) {
    return (
      <ErrorState
        title="Missing files"
        message="Please upload a question paper and an answer sheet first."
        router={router}
      />
    );
  }

  if (dataState.status === "loading") {
    return (
      <AppShell background="muted">
        <LoadingScreen message="Extracting…" />
      </AppShell>
    );
  }

  if (dataState.status === "error") {
    return (
      <ErrorState
        title="Something went wrong"
        message={dataState.message}
        router={router}
        onRetry={dataState.retry}
      />
    );
  }

  return <MappingScreen data={dataState.data} viewerBlobUrls={viewerBlobUrls} />;
}

export default function MappingPage() {
  return (
    <Suspense
      fallback={
        <AppShell background="muted">
          <LoadingScreen message="Extracting…" />
        </AppShell>
      }
    >
      <MappingPageContent />
    </Suspense>
  );
}
