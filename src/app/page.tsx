"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { UploadSlotCard } from "@/components/upload/UploadSlotCard";
import { StartMappingButton } from "@/components/upload/StartMappingButton";
import { LoadingScreen } from "@/components/upload/LoadingScreen";
import { UploadHeroIllustration } from "@/components/upload/UploadHeroIllustration";
import { useUploadFlow } from "@/lib/upload/useUploadFlow";
import { uploadFileToBlob } from "@/lib/upload/uploadFileToBlob";
import { mergeFilesToPdf } from "@/lib/upload/mergeFilesToPdf";

async function prepareSlotFileForUpload(files: File[]): Promise<File> {
  return files.length > 1 ? mergeFilesToPdf(files) : files[0];
}

export default function Home() {
  const router = useRouter();
  const { slots, canStartMapping, selectFiles, removeFiles } = useUploadFlow();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleStartMapping() {
    setUploadError(null);
    setIsUploading(true);
    try {
      const [questionPaperFile, answerSheetFile] = await Promise.all([
        prepareSlotFileForUpload(slots.questionPaper.files),
        prepareSlotFileForUpload(slots.answerSheet.files),
      ]);
      const [questionPaperBlob, answerSheetBlob] = await Promise.all([
        uploadFileToBlob(questionPaperFile),
        uploadFileToBlob(answerSheetFile),
      ]);
      const params = new URLSearchParams({
        questionPaper: questionPaperBlob.url,
        answerSheet: answerSheetBlob.url,
      });
      router.push(`/mapping?${params.toString()}`);
    } catch {
      setUploadError(
        "Upload failed — check your connection (and that Vercel Blob is configured) and try again.",
      );
      setIsUploading(false);
    }
  }

  if (isUploading) {
    return (
      <AppShell>
        <LoadingScreen message="Uploading…" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex h-full min-h-[500px] flex-col items-center justify-center gap-6 rounded-[40px] py-8 lg:min-h-[694px] lg:gap-9">
        <div className="flex flex-col items-center gap-5 px-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-3">
              <h1 className="text-[28px] font-bold tracking-[-0.04em] text-[#2b2b2b] lg:text-[40px]">
                Upload
              </h1>
              <h1 className="rounded-sm bg-[rgba(255,147,80,0.15)] px-2 py-1 text-[28px] font-bold tracking-[-0.04em] text-brand-orange lg:text-[40px]">
                Question Paper &amp; Answer Sheets
              </h1>
            </div>
            <p className="text-base text-ink-primary lg:text-xl">Upload both files to get started</p>
          </div>

          <UploadHeroIllustration />

          <div className="flex w-full max-w-[789px] flex-col items-center rounded-2xl bg-surface-white/50 p-3">
            <div className="flex w-full flex-1 flex-col gap-4 md:h-[205px] md:flex-row">
              <UploadSlotCard
                label="Upload Question Paper"
                accentLabel="Question Paper"
                slotState={slots.questionPaper}
                onFilesSelected={(files) => selectFiles("questionPaper", files)}
                onRemove={() => removeFiles("questionPaper")}
              />
              <UploadSlotCard
                label="Upload Answer Sheet"
                accentLabel="Answer Sheet"
                slotState={slots.answerSheet}
                onFilesSelected={(files) => selectFiles("answerSheet", files)}
                onRemove={() => removeFiles("answerSheet")}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 px-4 text-center">
          <StartMappingButton enabled={canStartMapping} onClick={handleStartMapping} />
          <p className="text-sm text-ink-secondary/80">
            Once both files are uploaded, you&apos;ll able to map answers with questions
          </p>
          {uploadError && <p className="text-sm text-danger">{uploadError}</p>}
        </div>
      </div>
    </AppShell>
  );
}
