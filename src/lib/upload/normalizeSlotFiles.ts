import { validateFiles, type FileValidationResult } from "../validation/fileValidation";
import { countPagesForSlotFiles } from "../validation/pageCount";

export type SlotFilesSummary = {
  files: File[];
  kind: "pdf" | "images" | "empty";
  totalPages: number;
  totalSizeBytes: number;
  validation: FileValidationResult;
};

function classifyKind(files: File[]): SlotFilesSummary["kind"] {
  if (files.length === 0) {
    return "empty";
  }
  if (files.length === 1 && files[0].type === "application/pdf") {
    return "pdf";
  }
  return "images";
}

export async function normalizeSlotFiles(files: File[]): Promise<SlotFilesSummary> {
  const kind = classifyKind(files);
  const totalSizeBytes = files.reduce((sum, file) => sum + file.size, 0);
  const totalPages = await countPagesForSlotFiles(files);
  const validation = validateFiles(files);

  return {
    files,
    kind,
    totalPages,
    totalSizeBytes,
    validation,
  };
}
