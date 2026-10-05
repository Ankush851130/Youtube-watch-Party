/**
 * Utility to extract clean 11-character YouTube Video ID from any YouTube URL, YouTube Music link, or ID string.
 */
export function extractYouTubeId(input) {
  if (!input) return null;
  const trimmed = input.trim();

  // 1. Direct 11-character YouTube ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Comprehensive YouTube & YouTube Music URL regex
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|music\.youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);

  if (match && match[1]) {
    return match[1];
  }

  // 3. Fallback URL parser search params
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const vParam = parsed.searchParams.get('v');
    if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
      return vParam;
    }
  } catch (e) {
    // ignore parsing failure
  }

  return null;
}
