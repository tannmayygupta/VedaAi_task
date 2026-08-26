"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { LoadingScreen } from "@/components/upload/LoadingScreen";
import { QuestionListPanel } from "@/components/mapping/QuestionListPanel";
import { AnswerSheetViewer } from "@/components/mapping/AnswerSheetViewer";
import { UnmatchedAnswersPanel } from "@/components/mapping/UnmatchedAnswersPanel";
import { NoAnswerFoundState } from "@/components/mapping/NoAnswerFoundState";
import { useMappingData, type MappingData } from "@/lib/mapping/useMappingData";
import { useMappingSelection } from "@/lib/mapping/useMappingSelection";

function parseBlobUrls(param: string | null): string[] {
  return (param ?? "").split(",").filter(Boolean);
}

function ErrorState({ title, message, router }: { title: string; message: string; router: ReturnType<typeof useRouter> }) {
  return (
    <AppShell>
      <div className="flex h-full min-h-[600px] flex-col items-center justify-center gap-3 text-center">
        <p className="text-lg font-bold text-ink-primary">{title}</p>
        <p className="text-sm text-ink-secondary">{message}</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-2 rounded-pill bg-surface-dark-grey px-6 py-3 text-sm font-medium text-white"
        >
          Back to upload
        </button>
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
  const unmatchedRegions = regions.filter((r) => r.matchedQuestionId === null);
  const selectedQuestion = questions.find((q) => q.id === selection.selectedQuestionId);
  const highlightLabel =
    selectedQuestion?.displayLabel ?? (selection.selectedUnmatchedRegionId ? "Unmatched" : null);

  return (
    <AppShell>
      <div className="flex h-full gap-3">
        <div className="flex w-[672px] shrink-0 flex-col gap-4 overflow-y-auto rounded-xl bg-surface-white/50 p-4">
          <QuestionListPanel
            questions={questions}
            gradings={gradings}
            regions={regions}
            selectedQuestionId={selection.selectedQuestionId}
            onSelectQuestion={selection.selectQuestion}
          />
          <UnmatchedAnswersPanel
            unmatchedRegions={unmatchedRegions}
            onSelectRegion={selection.selectUnmatchedRegion}
            selectedRegionId={selection.selectedUnmatchedRegionId}
          />
        </div>
        <div className="flex flex-1 flex-col">
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

  const questionPaperUrls = useMemo(
    () => parseBlobUrls(searchParams.get("questionPaper")),
    [searchParams],
  );
  const answerSheetUrls = useMemo(
    () => parseBlobUrls(searchParams.get("answerSheet")),
    [searchParams],
  );

  const questionPaperUrl = questionPaperUrls[0] ?? "";
  const answerSheetUrl = answerSheetUrls[0] ?? "";
  // Known limitation (see docs/DECISIONS.md): only the first file per slot is sent to
  // Gemini today. A single multi-page PDF is fully supported end-to-end; multiple
  // separate images beyond the first aren't analyzed yet, so the viewer only shows
  // that first one too, to avoid implying pages were checked when they weren't.
  const viewerBlobUrls = answerSheetUrls.length > 1 ? [answerSheetUrls[0]] : answerSheetUrls;

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
      <AppShell>
        <LoadingScreen message="Extracting…" />
      </AppShell>
    );
  }

  if (dataState.status === "error") {
    return <ErrorState title="Something went wrong" message={dataState.message} router={router} />;
  }

  return <MappingScreen data={dataState.data} viewerBlobUrls={viewerBlobUrls} />;
}

export default function MappingPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <LoadingScreen message="Extracting…" />
        </AppShell>
      }
    >
      <MappingPageContent />
    </Suspense>
  );
}
