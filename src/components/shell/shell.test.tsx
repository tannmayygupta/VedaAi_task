import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

describe("Sidebar", () => {
  it("renders the brand and nav items without crashing", () => {
    render(<Sidebar collapsed={false} onToggleCollapse={() => {}} />);
    expect(screen.getByText("VedaAI")).toBeInTheDocument();
    expect(screen.getByText("Exams")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("renders a collapse button that calls onToggleCollapse when expanded", async () => {
    const onToggleCollapse = vi.fn();
    render(<Sidebar collapsed={false} onToggleCollapse={onToggleCollapse} />);
    await userEvent.click(screen.getByRole("button", { name: /collapse sidebar/i }));
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it("renders the icon-only collapsed rail (Figma's Loading state sidebar), with a working expand button", async () => {
    const onToggleCollapse = vi.fn();
    render(<Sidebar collapsed={true} onToggleCollapse={onToggleCollapse} />);
    // Labels are no longer visible text in the collapsed rail — only icon alt text/titles.
    expect(screen.queryByText("VedaAI")).not.toBeInTheDocument();
    expect(screen.getByAltText("Home")).toBeInTheDocument();
    expect(screen.getByAltText("Exams")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /expand sidebar/i }));
    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });
});

describe("TopBar", () => {
  it("renders the breadcrumb and user name without crashing", () => {
    render(<TopBar />);
    expect(screen.getByText("Exams")).toBeInTheDocument();
    expect(screen.getByText("Madhur Rastogi")).toBeInTheDocument();
  });

  it("renders a custom breadcrumb and user name when provided", () => {
    render(<TopBar breadcrumb="Assignments" userName="Jane Doe" />);
    expect(screen.getByText("Assignments")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders the notifications button (unread indicator is baked into the Figma-exported icon)", () => {
    render(<TopBar />);
    const notificationsButton = screen.getByRole("button", { name: /notifications/i });
    expect(notificationsButton).toBeInTheDocument();
  });
});
