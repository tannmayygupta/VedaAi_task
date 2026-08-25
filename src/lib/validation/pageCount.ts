const PAGE_MARKER_REGEX = /\/Type\s*\/Page(?!s)\b/g;

export async function countPagesInPdf(file: File): Promise<number> {
  const buffer = await file.arrayBuffer();
  const text = new TextDecoder("latin1").decode(new Uint8Array(buffer));
  const matches = text.match(PAGE_MARKER_REGEX);
  const count = matches?.length ?? 0;
  return count > 0 ? count : 1;
}

export async function countPagesForSlotFiles(files: File[]): Promise<number> {
  if (files.length === 0) return 0;
  if (files.length > 1) return files.length;

  const [file] = files;
  if (file.type === "application/pdf") {
    return countPagesInPdf(file);
  }
  return 1;
}
