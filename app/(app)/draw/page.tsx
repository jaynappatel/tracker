'use client';

import { useEffect, useRef, useState } from 'react';
import {
  GalleryImage,
  deleteGalleryImage,
  listGalleryImages,
  uploadGalleryImage,
} from '@/lib/gallery';

const COLORS = ['#4A3B47', '#D98BA0', '#E3A868', '#8FB88A', '#B9A8D9', '#7FA8C9', '#F0C95C'];
const ERASER = '#FFFFFF';
const CANVAS_W = 900;
const CANVAS_H = 675;
const MAX_UNDO = 25;

export default function DrawPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const undoStack = useRef<ImageData[]>([]);
  const [color, setColor] = useState(COLORS[0]);
  const [erasing, setErasing] = useState(false);
  const [brush, setBrush] = useState(6);
  const [canUndo, setCanUndo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [galleryError, setGalleryError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
    listGalleryImages().then(setImages).catch(() => setGalleryError(true));
  }, []);

  function ctx() {
    return canvasRef.current!.getContext('2d')!;
  }

  // pointer position in canvas pixel coordinates (canvas is display-scaled)
  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    canvasRef.current!.setPointerCapture(e.pointerId);
    const c = ctx();
    undoStack.current.push(c.getImageData(0, 0, CANVAS_W, CANVAS_H));
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();
    setCanUndo(true);
    drawing.current = true;
    const { x, y } = pos(e);
    c.strokeStyle = erasing ? ERASER : color;
    c.lineWidth = erasing ? brush * 3 : brush;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 0.01, y + 0.01); // a tap still leaves a dot
    c.stroke();
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const { x, y } = pos(e);
    const c = ctx();
    c.lineTo(x, y);
    c.stroke();
  }

  function onUp() {
    drawing.current = false;
  }

  function undo() {
    const snapshot = undoStack.current.pop();
    if (snapshot) ctx().putImageData(snapshot, 0, 0);
    setCanUndo(undoStack.current.length > 0);
  }

  function clearCanvas() {
    const c = ctx();
    undoStack.current.push(c.getImageData(0, 0, CANVAS_W, CANVAS_H));
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();
    setCanUndo(true);
    c.fillStyle = '#FFFFFF';
    c.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  async function saveDrawing() {
    const canvas = canvasRef.current;
    if (!canvas || saving) return;
    setSaving(true);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (blob) {
      const img = await uploadGalleryImage(blob, 'drawing');
      if (img) setImages([img, ...images]);
      else setGalleryError(true);
    }
    setSaving(false);
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || saving) return;
    setSaving(true);
    const img = await uploadGalleryImage(file, 'photo');
    if (img) setImages([img, ...images]);
    else setGalleryError(true);
    setSaving(false);
  }

  async function removeImage(name: string) {
    await deleteGalleryImage(name);
    setImages(images.filter((i) => i.name !== name));
  }

  return (
    <>
      <div className="card">
        <h3>Draw something</h3>
        <div className="sub">Stickers, avatars, doodles — saved ones show up in the gallery below and can be used as your avatar or background.</div>
        <div className="draw-toolbar">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`color-dot ${!erasing && color === c ? 'active' : ''}`}
              style={{ background: c }}
              aria-label={`color ${c}`}
              onClick={() => { setColor(c); setErasing(false); }}
            />
          ))}
          <button className={`btn btn-ghost btn-sm ${erasing ? 'active' : ''}`} style={erasing ? { borderColor: 'var(--lavender)', background: 'var(--lavender-soft)' } : undefined} onClick={() => setErasing(!erasing)}>
            Eraser {erasing ? 'on' : ''}
          </button>
          <span className="brush-size">
            size
            <input type="range" min={2} max={24} value={brush} onChange={(e) => setBrush(Number(e.target.value))} />
          </span>
          <button className="btn btn-ghost btn-sm" onClick={undo} disabled={!canUndo}>Undo</button>
          <button className="btn btn-ghost btn-sm" onClick={clearCanvas}>Clear</button>
        </div>
        <canvas
          ref={canvasRef}
          className="sketchpad"
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        />
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn btn-teal" onClick={saveDrawing} disabled={saving}>
            {saving ? 'Saving…' : 'Save to gallery'}
          </button>
          <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
            Upload a photo instead
            <input type="file" accept="image/*" onChange={uploadPhoto} style={{ display: 'none' }} />
          </label>
        </div>
        {galleryError && (
          <div className="error-note">
            Couldn&apos;t reach the gallery bucket — make sure the public &quot;gallery&quot; bucket exists in Supabase Storage (see README).
          </div>
        )}
      </div>

      <div className="card">
        <h3>Gallery</h3>
        <div className="sub">Everything you&apos;ve saved. Pick your avatar from these on the Health page, or use them as a rotating background via Goals.</div>
        {images.length === 0
          ? <div className="empty-note">Nothing saved yet — draw something!</div>
          : (
            <div className="gallery-grid">
              {images.map((img) => (
                <div className="gallery-item" key={img.name} style={{ cursor: 'default' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.name} loading="lazy" />
                  <button className="gal-del" aria-label="delete image" onClick={() => removeImage(img.name)}>×</button>
                </div>
              ))}
            </div>
          )}
      </div>
    </>
  );
}
