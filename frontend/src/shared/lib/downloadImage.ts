export function downloadImage(src: string, name: string): void {
  const params = new URLSearchParams({ src, name });
  const link = document.createElement("a");
  link.href = `/api/download?${params.toString()}`;
  link.download = name;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}
