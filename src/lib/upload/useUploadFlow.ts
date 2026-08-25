"use client";

import { useCallback, useMemo, useState } from "react";
import { validateFiles } from "../validation/fileValidation";

export type UploadSlotKey = "questionPaper" | "answerSheet";

export type UploadSlotState = {
  files: File[];
  error: "invalid-type" | "too-large" | null;
};

export type UseUploadFlowResult = {
  slots: Record<UploadSlotKey, UploadSlotState>;
  canStartMapping: boolean;
  selectFiles: (slot: UploadSlotKey, files: File[]) => void;
  removeFiles: (slot: UploadSlotKey) => void;
};

const EMPTY_SLOT_STATE: UploadSlotState = { files: [], error: null };

function createInitialSlots(): Record<UploadSlotKey, UploadSlotState> {
  return {
    questionPaper: { ...EMPTY_SLOT_STATE },
    answerSheet: { ...EMPTY_SLOT_STATE },
  };
}

export function useUploadFlow(): UseUploadFlowResult {
  const [slots, setSlots] = useState<Record<UploadSlotKey, UploadSlotState>>(createInitialSlots);

  const selectFiles = useCallback((slot: UploadSlotKey, files: File[]) => {
    const result = validateFiles(files);
    setSlots((prev) => ({
      ...prev,
      [slot]: result.valid
        ? { files, error: null }
        : { files: [], error: result.reason },
    }));
  }, []);

  const removeFiles = useCallback((slot: UploadSlotKey) => {
    setSlots((prev) => ({
      ...prev,
      [slot]: { ...EMPTY_SLOT_STATE },
    }));
  }, []);

  const canStartMapping = useMemo(() => {
    return (Object.keys(slots) as UploadSlotKey[]).every(
      (key) => slots[key].files.length > 0 && slots[key].error === null,
    );
  }, [slots]);

  return { slots, canStartMapping, selectFiles, removeFiles };
}
