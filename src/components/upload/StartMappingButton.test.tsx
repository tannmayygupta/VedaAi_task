import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StartMappingButton } from "./StartMappingButton";

describe("StartMappingButton", () => {
  it("is disabled and does not fire onClick when enabled=false", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<StartMappingButton enabled={false} onClick={onClick} />);

    const button = screen.getByRole("button", { name: /start mapping/i });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is enabled and fires onClick exactly once when enabled=true", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<StartMappingButton enabled={true} onClick={onClick} />);

    const button = screen.getByRole("button", { name: /start mapping/i });
    expect(button).not.toBeDisabled();

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
