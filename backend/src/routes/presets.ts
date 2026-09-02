import type { FastifyInstance } from "fastify";
import { getPreset, PRESETS, updatePreset, type PresetPatch } from "../domain/presets.ts";

export async function presetRoutes(app: FastifyInstance): Promise<void> {
  for (const prefix of ["/api/presets", "/presets"]) {
    app.get(prefix, async () => ({ presets: PRESETS }));
    app.get(`${prefix}/:id`, async (request, reply) => {
      const { id } = request.params as { id: string };
      const preset = getPreset(id);
      if (!preset) return reply.code(404).send({ error: "Preset not found" });
      return { preset };
    });
    app.put(`${prefix}/:id`, async (request, reply) => {
      const { id } = request.params as { id: string };
      if (!getPreset(id)) return reply.code(404).send({ error: "Preset not found" });
      try {
        const preset = updatePreset(id, (request.body ?? {}) as PresetPatch);
        return { preset };
      } catch (error) {
        return reply.code(400).send({
          error: error instanceof Error ? error.message : "Invalid preset",
        });
      }
    });
  }
}
