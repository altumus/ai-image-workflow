export type Preset = {
  id: string;
  name: string;
  mainPrompt: string;
  negativePrompt: string;
  references: string[];
};

export type PresetPatch = {
  name?: string;
  mainPrompt?: string;
  negativePrompt?: string;
  references?: string[];
};
