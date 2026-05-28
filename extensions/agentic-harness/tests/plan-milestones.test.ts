import { describe, it, expect, vi } from "vitest";
import extension from "../index.js";

describe("Plan milestones mode", () => {
  it("should route /plan --milestones to the milestone planning delegation prompt", async () => {
    const commands = new Map<string, any>();

    const mockPi: any = {
      registerTool: vi.fn(),
      registerCommand: (name: string, def: any) => {
        commands.set(name, def);
      },
      on: vi.fn(),
      sendUserMessage: vi.fn(),
    };

    extension(mockPi);

    const plan = commands.get("plan");
    expect(plan).toBeDefined();
    expect(plan.description).toContain("--milestones");
    expect(commands.has("ultraplan")).toBe(false);

    const mockCtx: any = {
      ui: {
        confirm: vi.fn().mockResolvedValue(true),
        setStatus: vi.fn(),
      },
    };

    await plan.handler("--milestones", mockCtx);

    // Should delegate to agent via sendUserMessage
    expect(mockPi.sendUserMessage).toHaveBeenCalledTimes(1);
    const prompt = mockPi.sendUserMessage.mock.calls[0][0];
    expect(prompt).toContain("agentic-milestone-planning");
    expect(prompt).toContain("subagent");

    // Should reference exactly 3 reviewers, not 5
    expect(prompt).toContain("all 3 reviewer");
    expect(prompt).not.toContain("all 5 reviewer");

    // The 3 retained reviewers
    expect(prompt).toContain("reviewer-feasibility");
    expect(prompt).toContain("reviewer-architecture");
    expect(prompt).toContain("reviewer-risk");

    // The 2 removed reviewers must NOT appear
    expect(prompt).not.toContain("reviewer-dependency");
    expect(prompt).not.toContain("reviewer-user-value");
  });

  it("should not proceed if user cancels milestone planning confirmation", async () => {
    const commands = new Map<string, any>();

    const mockPi: any = {
      registerTool: vi.fn(),
      registerCommand: (name: string, def: any) => {
        commands.set(name, def);
      },
      on: vi.fn(),
      sendUserMessage: vi.fn(),
    };

    extension(mockPi);

    const plan = commands.get("plan");
    const mockCtx: any = {
      ui: {
        confirm: vi.fn().mockResolvedValue(false),
        setStatus: vi.fn(),
      },
    };

    await plan.handler("--milestones", mockCtx);
    expect(mockPi.sendUserMessage).not.toHaveBeenCalled();
  });
});
