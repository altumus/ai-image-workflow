import { api } from "@shared/api/client";

export async function uploadImage(file: File): Promise<string> {
  const { url } = await api.upload(file);
  return url;
}
