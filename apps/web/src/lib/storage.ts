import { put, del } from "@vercel/blob";

export async function uploadFile(
  file: File,
  folder: string = "documents"
): Promise<{ url: string; fileName: string; fileSize: number; mimeType: string }> {
  const fileName = `${folder}/${Date.now()}-${file.name}`;

  const blob = await put(fileName, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return {
    url: blob.url,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}

export async function deleteFile(url: string): Promise<void> {
  await del(url);
}
