const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export async function analyzeCsv(file, label) {
  const formData = new FormData();
  formData.append("file", file);

  const url = new URL(`${API_BASE}/analyze`);
  if (label && label.trim().length > 0) url.searchParams.set("label", label.trim());

  const res = await fetch(url.toString(), {
    method: "POST",
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.detail || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}
