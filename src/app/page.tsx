"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { UploadSlotCard } from "@/components/upload/UploadSlotCard";
import { StartMappingButton } from "@/components/upload/StartMappingButton";
import { LoadingScreen } from "@/components/upload/LoadingScreen";
import { useUploadFlow } from "@/lib/upload/useUploadFlow";
import { uploadFileToBlob } from "@/lib/upload/uploadFileToBlob";

export default function Home() {
  const router = useRouter();
  const { slots, canStartMapping, selectFiles, removeFiles } = useUploadFlow();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleStartMapping() {
    setUploadError(null);
    setIsUploading(true);
    try {
      const [questionPaperBlobs, answerSheetBlobs] = await Promise.all([
        Promise.all(slots.questionPaper.files.map((file) => uploadFileToBlob(file))),
        Promise.all(slots.answerSheet.files.map((file) => uploadFileToBlob(file))),
      ]);
      const params = new URLSearchParams({
        questionPaper: questionPaperBlobs.map((b) => b.url).join(","),
        answerSheet: answerSheetBlobs.map((b) => b.url).join(","),
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
      <div className="flex h-full min-h-[694px] flex-col items-center justify-center gap-9 rounded-[40px]">
        <div className="flex flex-col items-center gap-5">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-[40px] font-bold tracking-[-0.04em] text-[#2b2b2b]">Upload</h1>
              <h1 className="rounded-sm bg-[rgba(255,147,80,0.15)] px-2 py-1 text-[40px] font-bold tracking-[-0.04em] text-brand-orange">
                Question Paper &amp; Answer Sheets
              </h1>
            </div>
            <p className="text-xl text-ink-primary">Upload both files to get started</p>
          </div>

          <div className="flex w-[789px] flex-col items-center rounded-2xl bg-surface-white/50 p-3">
            <div className="flex h-[205px] w-full flex-1 gap-4">
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

        <div className="flex flex-col items-center gap-3">
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
