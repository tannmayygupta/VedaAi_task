import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MappingPage from "./page";

const pushMock = vi.fn();
const retryMock = vi.fn();

let searchParamsValue: Record<string, string> = {
  questionPaper: "https://blob.example/qp.pdf",
  answerSheet: "https://blob.example/as.pdf",
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({
    get: (key: string) => searchParamsValue[key] ?? null,
  }),
}));

const { useMappingDataMock } = vi.hoisted(() => ({ useMappingDataMock: vi.fn() }));
vi.mock("@/lib/mapping/useMappingData", () => ({
  useMappingData: useMappingDataMock,
}));

describe("MappingPage", () => {
  beforeEach(() => {
    pushMock.mockClear();
    retryMock.mockClear();
    searchParamsValue = {
      questionPaper: "https://blob.example/qp.pdf",
      answerSheet: "https://blob.example/as.pdf",
    };
  });

  it("shows a 'Missing files' error state (no retry) when query params are absent", () => {
    searchParamsValue = {};
    useMappingDataMock.mockReturnValue({ status: "loading", retry: retryMock });

    render(<MappingPage />);

    expect(screen.getByText("Missing files")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });

  it("renders the error screen (not a crash or infinite loader) on extraction failure, with a working Try Again", async () => {
    useMappingDataMock.mockReturnValue({
      status: "error",
      message: "Gemini rate limit exceeded",
      retry: retryMock,
    });

    render(<MappingPage />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Gemini rate limit exceeded")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(retryMock).toHaveBeenCalledTimes(1);
    // Try Again retries in place — it must not navigate away and lose the
    // already-uploaded blob URLs.
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("'Back to upload' still navigates home from the error screen", async () => {
    useMappingDataMock.mockReturnValue({
      status: "error",
      message: "boom",
      retry: retryMock,
    });

    render(<MappingPage />);
    await userEvent.click(screen.getByRole("button", { name: /back to upload/i }));
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("shows the explicit empty-questions state when extraction succeeds with zero questions (not a blank screen)", () => {
    useMappingDataMock.mockReturnValue({
      status: "ready",
      data: {
        questions: [],
        regions: [],
        gradings: [],
        summary: { totalAwarded: 0, totalPossible: 0, percentage: 0, unansweredCount: 0 },
      },
      retry: retryMock,
    });

    render(<MappingPage />);

    expect(screen.getByText(/couldn't find any questions in this file/i)).toBeInTheDocument();
  });

  it("shows the loading screen while extraction is in progress", () => {
    useMappingDataMock.mockReturnValue({ status: "loading", retry: retryMock });

    render(<MappingPage />);

    expect(screen.getByText("Extracting…")).toBeInTheDocument();
  });
});
