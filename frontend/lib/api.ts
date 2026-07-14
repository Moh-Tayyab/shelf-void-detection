export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type ModelKey = 'occupancy' | 'partial' | 'arrangement';
export const MODEL_KEYS: ModelKey[] = ['occupancy', 'partial', 'arrangement'];
export type BoxType = 'occupied' | 'vacant' | 'partial' | 'misarranged';
export type ModelStatus = 'idle' | 'loading' | 'done' | 'error' | 'unavailable';

export interface BoundingBox {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: BoxType;
  confidence: number;
  class?: string;
  label?: string;
}

export interface DetectionStats {
  detectionCount: number;
  processingTime: number;
  occupiedPct?: number;
  vacantPct?: number;
  slotsDetected?: number;
  occupiedBoxes?: number;
  vacantBoxes?: number;
}

export interface ModelResult {
  model: ModelKey;
  available: boolean;
  detections: BoundingBox[];
  stats: DetectionStats;
  image: { width: number; height: number };
  error?: string;
}

export type BatchResult = Record<ModelKey, ModelResult>;

export async function detectImageAll(
  file: File,
  opts: { confidence: number; overlap: number },
): Promise<BatchResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('confidence', String(opts.confidence));
  form.append('overlap', String(opts.overlap));

  const url = `${API_URL}/api/detect/all`;
  const res = await fetch(url, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Batch detection failed (${res.status}): ${detail}`);
  }

  const data: BatchResult = await res.json();

  for (const key of MODEL_KEYS) {
    if (data[key]?.detections) {
      data[key].detections = data[key].detections.map((d, i) => ({
        ...d,
        id: d.id ?? i + 1,
        label: d.class || d.label,
      }));
    }
  }

  return data;
}

export async function detectImage(
  file: File,
  opts: { confidence: number; overlap: number },
  model: ModelKey = 'occupancy',
): Promise<ModelResult> {
  const form = new FormData();
  form.append('file', file);
  form.append('confidence', String(opts.confidence));
  form.append('overlap', String(opts.overlap));

  const url = `${API_URL}/api/detect?model=${model}`;
  const res = await fetch(url, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Detection failed (${res.status}): ${detail}`);
  }

  const data: ModelResult = await res.json();

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

export interface ModelInfoEntry {
  available: boolean;
  classes: Record<string, string>;
  weight: string | null;
}

export interface ModelInfo {
  models: Record<ModelKey, ModelInfoEntry>;
  device: string;
}

export async function getModelInfo(): Promise<ModelInfo> {
  const res = await fetch(`${API_URL}/api/model/info`);
  if (!res.ok) throw new Error(`Model info failed (${res.status})`);
  return res.json();
}

export function deriveModelLabel(modelKey: ModelKey, modelInfo: ModelInfo): string {
  const entry = modelInfo.models[modelKey];
  if (!entry?.available) return `${modelKey} (offline)`;
  const name = entry.weight?.split('/').pop()?.replace(/\.pt$/i, '') || modelKey;
  return name;
}
