import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createMock = vi.fn();

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(function OpenAIMock() {
    return { responses: { create: createMock } };
  }),
}));

import { callOpenAiJson, DEFAULT_OPENAI_MODEL } from "./client";
import OpenAI from "openai";

describe("callOpenAiJson", () => {
  beforeEach(() => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    createMock.mockReset();
    vi.mocked(OpenAI).mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("resolves to the parsed JSON from output_text", async () => {
    createMock.mockResolvedValue({ output_text: '{"foo":"bar"}' });

    const result = await callOpenAiJson({
      instructions: "system",
      userText: "hello",
      images: [],
      responseJsonSchema: { type: "object" },
      responseSchemaName: "test_schema",
    });

    expect(result).toEqual({ foo: "bar" });
  });

  it("calls responses.create with the default model when no override is given", async () => {
    createMock.mockResolvedValue({ output_text: "{}" });

    await callOpenAiJson({
      instructions: "system",
      userText: "hi",
      images: [],
      responseJsonSchema: {},
      responseSchemaName: "test_schema",
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: DEFAULT_OPENAI_MODEL, instructions: "system" }),
    );
  });

  it("calls responses.create with a custom model when provided", async () => {
    createMock.mockResolvedValue({ output_text: "{}" });

    await callOpenAiJson({
      instructions: "system",
      userText: "hi",
      images: [],
      responseJsonSchema: {},
      responseSchemaName: "test_schema",
      model: "gpt-custom",
    });

    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-custom" }));
  });

  it("includes one input_text + input_image pair per image, in order", async () => {
    createMock.mockResolvedValue({ output_text: "{}" });

    await callOpenAiJson({
      instructions: "system",
      userText: "hi",
      images: ["data:image/png;base64,AAA", "data:image/png;base64,BBB"],
      responseJsonSchema: {},
      responseSchemaName: "test_schema",
    });

    const call = createMock.mock.calls[0][0];
    const content = call.input[0].content;
    expect(content).toEqual([
      { type: "input_text", text: "hi" },
      { type: "input_text", text: "Image 0:" },
      { type: "input_image", image_url: "data:image/png;base64,AAA", detail: "high" },
      { type: "input_text", text: "Image 1:" },
      { type: "input_image", image_url: "data:image/png;base64,BBB", detail: "high" },
    ]);
  });

  it("requests structured output via json_schema with the given schema and name", async () => {
    createMock.mockResolvedValue({ output_text: "{}" });
    const schema = { type: "object", properties: {} };

    await callOpenAiJson({
      instructions: "system",
      userText: "hi",
      images: [],
      responseJsonSchema: schema,
      responseSchemaName: "my_schema",
    });

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        text: { format: { type: "json_schema", name: "my_schema", schema, strict: true } },
      }),
    );
  });

  it("rejects when the response has no output_text", async () => {
    createMock.mockResolvedValue({ output_text: undefined });

    await expect(
      callOpenAiJson({
        instructions: "system",
        userText: "hi",
        images: [],
        responseJsonSchema: {},
        responseSchemaName: "test_schema",
      }),
    ).rejects.toThrow();
  });

  it("rejects when output_text isn't valid JSON", async () => {
    createMock.mockResolvedValue({ output_text: "not valid json" });

    await expect(
      callOpenAiJson({
        instructions: "system",
        userText: "hi",
        images: [],
        responseJsonSchema: {},
        responseSchemaName: "test_schema",
      }),
    ).rejects.toThrow();
  });

  it("rejects before constructing the client when OPENAI_API_KEY is unset", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.mocked(OpenAI).mockClear();

    await expect(
      callOpenAiJson({
        instructions: "system",
        userText: "hi",
        images: [],
        responseJsonSchema: {},
        responseSchemaName: "test_schema",
      }),
    ).rejects.toThrow(/OPENAI_API_KEY/);

    expect(OpenAI).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });
});
