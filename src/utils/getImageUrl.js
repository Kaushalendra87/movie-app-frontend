const getImageUrl = (input) => {
  if (!input) return null;

  // If an object is passed (e.g. { url: '...' } or ImageField-like), try common keys
  if (typeof input === 'object' && input !== null) {
    if (input.url) return getImageUrl(input.url);
    if (input.path) return getImageUrl(input.path);
    if (input.poster) return getImageUrl(input.poster);
    return null;
  }

  const str = String(input).trim();
  if (!str) return null;

  // Protocol-relative URLs (e.g. //res.cloudinary.com/...) — keep the protocol
  if (str.startsWith('//')) {
    return `${window.location.protocol}${str}`;
  }

  // Absolute URLs (http/https) — use directly
  if (str.startsWith('http://') || str.startsWith('https://')) {
    return str;
  }

  // Some APIs may return Cloudinary paths without scheme (rare) — detect by hostname
  // If string already contains a Cloudinary hostname, use it directly
  if (str.includes('res.cloudinary.com') || str.includes('cloudinary')) {
    if (str.startsWith('//')) return `${window.location.protocol}${str}`;
    if (str.startsWith('/')) return `https:${str}`;
    if (str.startsWith('http://') || str.startsWith('https://')) return str;
    return `https://${str}`;
  }

  // Detect Cloudinary-style paths returned by the backend (e.g. '/image/upload/...' or absolute backend URL + '/image/upload/...')
  const cloudinaryPathPattern = /(^|\/)image\/upload\//i;
  const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
  // If a full URL was provided but points to backend and contains Cloudinary path, extract the path
  try {
    if (str.startsWith('http://') || str.startsWith('https://')) {
      const u = new URL(str);
      if (cloudinaryPathPattern.test(u.pathname) && cloudName) {
        return `https://res.cloudinary.com/${cloudName}${u.pathname}${u.search || ''}`;
      }
    }
  } catch (e) {
    // ignore malformed URL
  }

  // If backend returned a bare Cloudinary path like '/image/upload/..' or 'image/upload/..', convert using cloud name
  if (cloudinaryPathPattern.test(str) && cloudName) {
    const path = str.startsWith('/') ? str : `/${str}`;
    return `https://res.cloudinary.com/${cloudName}${path}`;
  }

  // Fallback: treat as a backend-relative path. Normalize backend base URL to avoid double-slashes.
  let backendBaseUrl = (import.meta.env.VITE_BACKEND_BASE_API || 'http://127.0.0.1:8000').trim();
  backendBaseUrl = backendBaseUrl.replace(/\/+$/, '');
  return `${backendBaseUrl}${str.startsWith('/') ? str : `/${str}`}`;
};

export default getImageUrl;
