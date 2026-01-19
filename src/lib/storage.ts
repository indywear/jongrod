import { supabaseAdmin } from "./supabase"

export type StorageBucket = "car-images" | "documents" | "avatars" | "banners"

export async function uploadFile(
  bucket: StorageBucket,
  path: string,
  file: Buffer | Blob,
  contentType: string
): Promise<{ url: string | null; error: string | null }> {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: false,
    })

  if (error) {
    console.error(`Upload error (${bucket}/${path}):`, error)
    return { url: null, error: error.message }
  }

  const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)

  return { url: urlData.publicUrl, error: null }
}

export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([path])

  if (error) {
    console.error(`Delete error (${bucket}/${path}):`, error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadCarImage(
  partnerId: string,
  carId: string,
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string | null; error: string | null }> {
  const path = `${partnerId}/${carId}/${Date.now()}_${fileName}`
  return uploadFile("car-images", path, file, contentType)
}

export async function uploadDocument(
  userId: string,
  type: string,
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string | null; error: string | null }> {
  const path = `${userId}/${type}_${Date.now()}_${fileName}`
  return uploadFile("documents", path, file, contentType)
}

export async function uploadAvatar(
  userId: string,
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string | null; error: string | null }> {
  const path = `${userId}/avatar_${Date.now()}_${fileName}`
  return uploadFile("avatars", path, file, contentType)
}

export async function uploadBanner(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string | null; error: string | null }> {
  const path = `${Date.now()}_${fileName}`
  return uploadFile("banners", path, file, contentType)
}
