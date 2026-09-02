import { useGraphStore } from "@entities/graph";
import { useSelectedPreset } from "@entities/preset";
import { buildRequest } from "@workflow/shared/request-builder";

export function RequestPreview() {
  const nodes = useGraphStore((state) => state.nodes);
  const preset = useSelectedPreset();
  const userPrompt = nodes
    .filter((node) => node.type === "prompt")
    .map((node) => node.data.text?.trim())
    .filter(Boolean)
    .join("\n");
  const request = buildRequest(userPrompt || "", preset);

  return (
    <section className="request-builder">
      <div className="section-label">Request Builder</div>
      <dl className="request-fields">
        <div>
          <dt>User prompt</dt>
          <dd>{request.userPrompt || "—"}</dd>
        </div>
        <div>
          <dt>Preset</dt>
          <dd>{request.presetName ?? "none"}</dd>
        </div>
        {request.presetId && (
          <>
            <div>
              <dt>mainPrompt</dt>
              <dd>{request.mainPrompt}</dd>
            </div>
            <div>
              <dt>negativePrompt</dt>
              <dd>{request.negativePrompt || "—"}</dd>
            </div>
            <div>
              <dt>references</dt>
              <dd className="ref-row">
                {request.references.length === 0 && "—"}
                {request.references.map((url) => (
                  <img key={url} src={url} alt="preset reference" className="ref-thumb" />
                ))}
              </dd>
            </div>
          </>
        )}
      </dl>
    </section>
  );
}
