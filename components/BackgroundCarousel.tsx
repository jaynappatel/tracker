'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SINGLE_USER_ID } from '@/lib/singleUser';
import { GalleryImage, listGalleryImages } from '@/lib/gallery';

// Off by default; only renders when profile.bg_carousel is on AND the
// gallery has at least one image. Sits at z-index -1 (above the pastel
// blobs at -2, below all content) at ~16% opacity with a slight blur, so
// text and inputs stay fully readable. The Goals page dispatches
// 'profile-updated' after saving so the toggle applies without a reload.

const INTERVAL_MS = 90_000; // slow — a change every minute and a half

export default function BackgroundCarousel() {
  const [enabled, setEnabled] = useState(false);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let active = true;
    async function refresh() {
      const { data } = await supabase
        .from('profile')
        .select('bg_carousel')
        .eq('user_id', SINGLE_USER_ID)
        .maybeSingle();
      if (!active) return;
      const on = !!(data as any)?.bg_carousel;
      setEnabled(on);
      if (on) {
        const imgs = await listGalleryImages();
        if (active) setImages(imgs);
      }
    }
    refresh();
    window.addEventListener('profile-updated', refresh);
    return () => {
      active = false;
      window.removeEventListener('profile-updated', refresh);
    };
  }, []);

  useEffect(() => {
    if (!enabled || images.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), INTERVAL_MS);
    return () => clearInterval(t);
  }, [enabled, images.length]);

  if (!enabled || images.length === 0) return null;

  return (
    <div className="bg-carousel" aria-hidden="true">
      {images.map((img, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={img.name} src={img.url} alt="" className={i === idx % images.length ? 'visible' : ''} />
      ))}
    </div>
  );
}
