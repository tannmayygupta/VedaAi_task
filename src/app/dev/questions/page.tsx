// Temporary dev-only page for manually inspecting extraction results during Phase 3.
// Remove once the real Phase 6 mapping UI exists.
import { QuestionListDebugView } from "@/components/dev/QuestionListDebugView";
import type { Question } from "@/lib/schemas/question";

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: "q1",
    number: "1",
    subpart: null,
    displayLabel: "1",
    text: "Sample question — replace with a real extraction result to inspect it here.",
    marksTotal: null,
    pageIndex: 0,
    order: 0,
  },
  {
    id: "q2",
    number: "2",
    subpart: null,
    displayLabel: "2",
    text: "Another sample question with stated marks.",
    marksTotal: 2,
    pageIndex: 0,
    order: 1,
  },
];

export default function DevQuestionsPage() {
  return (
    <div>
      <h1>Dev: Question List Debug View</h1>
      <QuestionListDebugView questions={SAMPLE_QUESTIONS} />
    </div>
  );
}
