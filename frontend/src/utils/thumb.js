export function getThumbnailPath(path) {
  console.log('path', path)
  if (!path) return path;
  const parts = path.split('.');
  if (parts.length < 2) return path; // на случай отсутствия расширения
  parts[parts.length - 2] += '_thumb';
  return parts.join('.');
}
