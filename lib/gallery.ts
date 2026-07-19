import { supabase } from './supabaseClient';

// All drawings and uploaded photos live in one PUBLIC Supabase Storage
// bucket (chosen explicitly — the whole app is open-access). Anyone with an
// image URL can view it. The gallery is just the bucket listing; avatar and
// background settings reference images by file name (profile.avatar_path).

export const GALLERY_BUCKET = 'gallery';

export interface GalleryImage {
  name: string;
  url: string;
  createdAt: string;
}

export function galleryUrl(name: string): string {
  return supabase.storage.from(GALLERY_BUCKET).getPublicUrl(name).data.publicUrl;
}

export async function listGalleryImages(): Promise<GalleryImage[]> {
  const { data, error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
  if (error || !data) return [];
  return data
    .filter((f) => f.name && !f.name.startsWith('.'))
    .map((f) => ({ name: f.name, url: galleryUrl(f.name), createdAt: f.created_at ?? '' }));
}

export async function uploadGalleryImage(blob: Blob, kind: 'drawing' | 'photo'): Promise<GalleryImage | null> {
  const ext = blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/webp' ? 'webp' : 'png';
  const name = `${kind}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(GALLERY_BUCKET)
    .upload(name, blob, { contentType: blob.type || 'image/png' });
  if (error) return null;
  return { name, url: galleryUrl(name), createdAt: new Date().toISOString() };
}

export async function deleteGalleryImage(name: string): Promise<void> {
  await supabase.storage.from(GALLERY_BUCKET).remove([name]);
}
