/** Load a data URL into an image element for canvas drawing. */
export function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export const CAPTURE_REQUEST_TIMEOUT_MS = 10000;

/** Request a visible-tab screenshot from the background service worker. */
export async function requestCapture(timeoutMs = CAPTURE_REQUEST_TIMEOUT_MS): Promise<string> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('captureVisibleTab timed out'));
    }, timeoutMs);
  });
  const resp = (await Promise.race([
    chrome.runtime.sendMessage({ type: 'pd-capture' }),
    timeout,
  ]).finally(() => {
    if (timeoutId !== null) clearTimeout(timeoutId);
  })) as { dataUrl?: string; error?: string } | undefined;
  if (!resp?.dataUrl) {
    throw new Error(resp?.error ?? 'captureVisibleTab returned no dataUrl');
  }
  return resp.dataUrl;
}
