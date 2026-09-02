export type GenerateInput = {
  prompt: string;
  references?: string[];
};

export type EditInput = {
  prompt: string;
  imageUrl: string;
};

export type ImageResult = {
  url: string;
};

export interface ImageProvider {
  generate(input: GenerateInput): Promise<ImageResult>;
  edit(input: EditInput): Promise<ImageResult>;
}
