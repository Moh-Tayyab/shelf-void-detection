export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface BoundingBox {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'occupied' | 'vacant';
  confidence: number;
  class?: string;
  label?: string;
}

export interface DetectionStats {
  detectionCount: number;
  processingTime: number;
  occupiedPct: number;
  vacantPct: number;
  slotsDetected: number;
  occupiedBoxes: number;
  vacantBoxes: number;
}

export interface DetectionResponse {
  detections: BoundingBox[];
  stats: DetectionStats;
  image: { width: number; height: number };
}

export async function detectImage(
  file: File,
  opts: { confidence: number; overlap: number },
): Promise<DetectionResponse> {
  const form = new FormData();
  form.append('file', file);
  form.append('confidence', String(opts.confidence));
  form.append('overlap', String(opts.overlap));

  const res = await fetch(`${API_URL}/api/detect`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Detection failed (${res.status}): ${detail}`);
  }

  const data: DetectionResponse = await res.json();

  data.detections = data.detections.map((d, i) => ({
    ...d,
    id: d.id ?? i + 1,
    label: d.class || d.label,
  }));

  return data;
}

export async function checkHealth(): Promise<{ status: string; device: string }> {
  const res = await fetch(`${API_URL}/api/health`);
  if (!res.ok) throw new Error(`Health check failed (${res.status})`);
  return res.json();
}
