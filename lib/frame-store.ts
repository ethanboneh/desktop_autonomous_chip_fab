/**
 * In-memory store for the latest captured WebRTC frame.
 * Used by the capture API to hold frames between browser capture and Python scoring.
 */

let latestFrame: string | null = null;
let capturedAt: number | null = null;

export function setLatestFrame(base64: string): void {
  latestFrame = base64;
  capturedAt = Date.now();
}

export function getLatestFrame(): { frame: string; capturedAt: number } | null {
  if (!latestFrame || !capturedAt) return null;
  return { frame: latestFrame, capturedAt };
}

export function clearFrame(): void {
  latestFrame = null;
  capturedAt = null;
}
