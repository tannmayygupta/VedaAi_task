import type { MappingData } from "./useMappingData";

export function serializeMappingData(data: MappingData): string {
  return JSON.stringify(data, null, 2);
}

/** Triggers a browser download of the given JSON string as a file. */
export function downloadJson(filename: string, jsonString: string): void {
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportMappingDataAsJson(data: MappingData): void {
  downloadJson("assessment-export.json", serializeMappingData(data));
}
