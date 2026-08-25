"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";

export type DropzoneProps = {
  label: string;
  accentLabel: string;
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
};

export function Dropzone({ label, accentLabel, onFilesSelected, multiple = true }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const prefix = label.slice(0, label.length - accentLabel.length);

  const openPicker = () => {
    inputRef.current?.click();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onFilesSelected(Array.from(event.dataTransfer.files));
      }}
      className="flex h-full flex-1 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-[1.5px] border-dashed border-[#cecece] bg-surface-white p-[10px]"
    >
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          onFilesSelected(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      <div className="flex size-12 items-center justify-center rounded-sm bg-surface-off-white p-1">
        <Upload className="size-6 text-ink-primary" />
      </div>

      <div className="flex flex-col items-center gap-0.5 text-center">
        <p className="text-xl font-semibold text-ink-primary">
          {prefix}
          <span className="text-brand-orange">{accentLabel}</span>
        </p>
        <p className="text-sm text-ink-secondary/55">Max 10MB</p>
      </div>
    </div>
  );
}
