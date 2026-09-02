import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { updatePreset, useSelectedPreset } from "@entities/preset";
import { api } from "@shared/api/client";
import { Button } from "@shared/ui/Button";

const MAX_REFS = 5;

type Props = {
  onClose: () => void;
};

export function PresetEditor({ onClose }: Props) {
  const selected = useSelectedPreset();
  const [name, setName] = useState(selected?.name ?? "");
  const [mainPrompt, setMainPrompt] = useState(selected?.mainPrompt ?? "");
  const [negativePrompt, setNegativePrompt] = useState(selected?.negativePrompt ?? "");
  const [references, setReferences] = useState<string[]>(selected?.references ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!selected) return null;
  const preset = selected;

  async function onUpload(file?: File) {
    if (!file) return;
    if (references.length >= MAX_REFS) {
      setError(`At most ${MAX_REFS} references`);
      return;
    }
    try {
      const { url } = await api.upload(file);
      setReferences((current) => [...current, url]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function onSave() {
    setSaving(true);
    try {
      await updatePreset(preset.id, { name, mainPrompt, negativePrompt, references });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preset-editor-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="preset-editor-title">Edit preset</h2>
        <label className="field">
          <span>Name</span>
          <input className="wf-input" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="field">
          <span>mainPrompt</span>
          <textarea
            className="wf-textarea wf-textarea-fixed nodrag nowheel"
            value={mainPrompt}
            onChange={(event) => setMainPrompt(event.target.value)}
          />
        </label>
        <label className="field">
          <span>negativePrompt</span>
          <textarea
            className="wf-textarea wf-textarea-fixed nodrag nowheel"
            value={negativePrompt}
            onChange={(event) => setNegativePrompt(event.target.value)}
          />
        </label>
        <div className="field">
          <span>References ({references.length}/{MAX_REFS})</span>
          <div className="ref-row">
            {references.map((url) => (
              <div className="ref-chip" key={url}>
                <img src={url} alt="" />
                <button
                  type="button"
                  className="ref-remove"
                  aria-label="Remove reference"
                  onClick={() => setReferences((current) => current.filter((item) => item !== url))}
                >
                  ×
                </button>
              </div>
            ))}
            {references.length < MAX_REFS && (
              <label className="btn file-btn ref-add">
                + Add
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(event) => {
                    void onUpload(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        </div>
        {error && <p className="local-error">{error}</p>}
        <div className="modal-actions">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={saving} onClick={() => void onSave()}>
            {saving ? "Saving…" : "Save preset"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
