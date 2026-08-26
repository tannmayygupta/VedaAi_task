import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

describe("Sidebar", () => {
  it("renders the brand and nav items without crashing", () => {
    render(<Sidebar />);
    expect(screen.getByText("VedaAI")).toBeInTheDocument();
    expect(screen.getByText("Exams")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("renders the sidebar toggle button", () => {
    render(<Sidebar />);
    expect(screen.getByRole("button", { name: /toggle sidebar/i })).toBeInTheDocument();
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

  it("renders the notifications button with an unread indicator", () => {
    const { container } = render(<TopBar />);
    const notificationsButton = screen.getByRole("button", { name: /notifications/i });
    expect(notificationsButton).toBeInTheDocument();
    expect(container.querySelector(".bg-danger")).toBeInTheDocument();
  });
});
