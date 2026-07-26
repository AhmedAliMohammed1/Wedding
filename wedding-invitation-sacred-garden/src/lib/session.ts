export const sessionKeys = {
  opened: 'sacred-garden-opened',
  musicWanted: 'sacred-garden-music-wanted'
} as const;

export function readSessionBoolean(key: string, fallback = false) {
  try {
    const value = window.sessionStorage.getItem(key);
    return value === null ? fallback : value === 'true';
  } catch {
    return fallback;
  }
}

export function writeSessionBoolean(key: string, value: boolean) {
  try {
    window.sessionStorage.setItem(key, String(value));
  } catch {
    // The invitation still works if storage is unavailable.
  }
}
