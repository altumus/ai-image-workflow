import { AI_TIMEOUT_MS, XAI_API_KEY, XAI_BASE_URL, XAI_IMAGE_MODEL } from "../config.ts";
import type { EditInput, GenerateInput, ImageProvider, ImageResult } from "./provider.ts";

type XaiImageResponse = {
  data?: Array<{ url?: string; b64_json?: string }>;
};

export class AiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AiRequestError";
  }
}

export function createXaiImagineProvider(
  toSendableImage: (url: string) => Promise<string>,
): ImageProvider {
  return {
    async generate(input: GenerateInput): Promise<ImageResult> {
      if (input.references?.length) {
        return requestEdit(input.prompt, input.references, toSendableImage);
      }
      const body = await postJson("/images/generations", {
        model: XAI_IMAGE_MODEL,
        prompt: input.prompt,
      });
      return extractUrl(body);
    },

    async edit(input: EditInput): Promise<ImageResult> {
      return requestEdit(input.prompt, [input.imageUrl], toSendableImage);
    },
  };
}

async function requestEdit(
  prompt: string,
  imageUrls: string[],
  toSendableImage: (url: string) => Promise<string>,
): Promise<ImageResult> {
  const images = await Promise.all(
    imageUrls.map(async (url) => ({
      type: "image_url" as const,
      url: await toSendableImage(url),
    })),
  );

  const payload =
    images.length === 1
      ? {
          model: XAI_IMAGE_MODEL,
          prompt,
          image: images[0],
        }
      : {
          model: XAI_IMAGE_MODEL,
          prompt,
          images,
        };

  const body = await postJson("/images/edits", payload);
  return extractUrl(body);
}

async function postJson(pathname: string, payload: unknown): Promise<XaiImageResponse> {
  if (!XAI_API_KEY) {
    throw new AiRequestError("XAI_API_KEY is not set");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(`${XAI_BASE_URL}${pathname}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    if (!response.ok) {
      throw new AiRequestError(
        `AI API ${response.status}: ${text.slice(0, 280) || response.statusText}`,
        response.status,
      );
    }

    return text ? (JSON.parse(text) as XaiImageResponse) : {};
  } catch (error) {
    if (error instanceof AiRequestError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AiRequestError(`AI request timed out after ${AI_TIMEOUT_MS}ms`);
    }
    throw new AiRequestError(error instanceof Error ? error.message : "AI request failed");
  } finally {
    clearTimeout(timer);
  }
}

function extractUrl(body: XaiImageResponse): ImageResult {
  const first = body.data?.[0];
  if (first?.url) return { url: first.url };
  if (first?.b64_json) {
    return { url: `data:image/jpeg;base64,${first.b64_json}` };
  }
  throw new AiRequestError("AI API returned no image");
}
