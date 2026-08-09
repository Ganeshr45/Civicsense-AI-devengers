const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function authHeaders() {
  const token = localStorage.getItem("civicsense_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  if (!res.ok) {
    let detail = "Request failed";
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch (_) {
      /* ignore parse errors */
    }
    throw new Error(detail);
  }
  return res.json();
}

export const api = {
  requestOtp: (phone, name) =>
    fetch(`${BASE_URL}/api/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name }),
    }).then(handle),

  verifyOtp: (phone, code) =>
    fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    }).then(handle),

  me: () => fetch(`${BASE_URL}/api/auth/me`, { headers: authHeaders() }).then(handle),

  createReport: (formData) =>
    fetch(`${BASE_URL}/api/reports`, {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    }).then(handle),

  listReports: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/api/reports${qs ? `?${qs}` : ""}`, { headers: authHeaders() }).then(handle);
  },

  getReport: (id) => fetch(`${BASE_URL}/api/reports/${id}`, { headers: authHeaders() }).then(handle),

  updateStatus: (id, status, note) =>
    fetch(`${BASE_URL}/api/reports/${id}/status`, {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    }).then(handle),

  dashboardStats: () => fetch(`${BASE_URL}/api/dashboard/stats`, { headers: authHeaders() }).then(handle),

  imageUrl: (path) => (path ? `${BASE_URL}${path}` : null),
};
