import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL || "";

const api = axios.create({ baseURL: BASE });

const TOKEN_KEY = "apnafastag.token";

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const authApi = {
  requestOtp: (phone) => api.post("/api/auth/request-otp", { phone }),
  verifyOtp: (phone, otp) => api.post("/api/auth/verify-otp", { phone, otp }),
  me: () => api.get("/api/users/me"),
};

export const sathiApi = {
  list: () => api.get("/api/sathis"),
  get: (slug) => api.get(`/api/sathis/${slug}`),
  submitReview: (slug, data) => api.post(`/api/sathis/${slug}/review`, data),
};

export const helpApi = {
  list: (params) => api.get("/api/help", { params }),
  get:  (slug)   => api.get(`/api/help/${slug}`),
};

export const plazaApi = {
  list: () => api.get("/api/plazas"),
  byState: (slug) => api.get("/api/plazas", { params: { state: slug } }),
  get: (slug) => api.get(`/api/plazas/${slug}`),
};

export const stateApi = {
  list: () => api.get("/api/states"),
  get: (slug) => api.get(`/api/states/${slug}`),
};

export const jobApi = {
  create: (data) => api.post("/api/jobs", data),
  myJobs: () => api.get("/api/jobs/me"),
  get: (id) => api.get(`/api/jobs/${id}`),
  byRef: (ref) => api.get(`/api/jobs/ref/${ref}`),
  updateStatus: (id, status) => api.patch(`/api/jobs/${id}/status`, { status }),
  submitReview: (id, data) => api.post(`/api/jobs/${id}/review`, data),
};

export const sathiDashApi = {
  check: () => api.get("/api/sathi-dashboard/check"),
  claim: (sathi_slug) => api.post("/api/sathi-dashboard/claim", { sathi_slug }),
  profile: () => api.get("/api/sathi-dashboard/profile"),
  jobs: () => api.get("/api/sathi-dashboard/jobs"),
  acceptJob: (id) => api.patch(`/api/sathi-dashboard/jobs/${id}/accept`),
  startJob: (id) => api.patch(`/api/sathi-dashboard/jobs/${id}/start`),
  resolveJob: (id) => api.patch(`/api/sathi-dashboard/jobs/${id}/resolve`),
  cancelJob: (id) => api.patch(`/api/sathi-dashboard/jobs/${id}/cancel`),
  setAvailability: (is_available) => api.patch("/api/sathi-dashboard/availability", { is_available }),
  earnings: () => api.get("/api/sathi-dashboard/earnings"),
  updateProfile: (data) => api.patch("/api/sathi-dashboard/profile", data),
  updateCenter: (data) => api.patch("/api/sathi-dashboard/center", data),
  uploadAvatar: (file) => { const fd = new FormData(); fd.append("file", file); return api.post("/api/sathi-dashboard/upload-avatar", fd); },
  uploadGallery: (file) => { const fd = new FormData(); fd.append("file", file); return api.post("/api/sathi-dashboard/upload-gallery", fd); },
  deleteGallery: (url) => api.delete("/api/sathi-dashboard/gallery", { data: { url } }),
  stats: () => api.get("/api/sathi-dashboard/stats"),
};

export const toolsApi = {
  fastagStatus: (vehicle) => api.get("/api/tools/fastag-status", { params: { vehicle } }),
};

export const paymentsApi = {
  initiateBooking: (data) => api.post("/api/payments/initiate-booking", data),
  verify: (order_id) => api.get(`/api/payments/verify/${order_id}`),
  validatePromo: (code, issue) => api.get("/api/payments/validate-promo", { params: { code, issue } }),
};

export const applicationApi = {
  submit: (data) => api.post("/api/sathi-applications", data),
  check: (phone) => api.get(`/api/sathi-applications/check/${phone}`),
};

const ADMIN_KEY = "apnafastag.admin";
export const getAdminSecret = () => localStorage.getItem(ADMIN_KEY);
export const setAdminSecret = (s) => localStorage.setItem(ADMIN_KEY, s);
export const clearAdminSecret = () => localStorage.removeItem(ADMIN_KEY);

const adminHeaders = () => ({ "x-admin-secret": getAdminSecret() || "" });

export const adminApi = {
  seed: () => api.post("/api/admin/seed", {}, { headers: adminHeaders() }),
  login: (secret) => api.post("/api/admin/login", { secret }),
  stats: () => api.get("/api/admin/stats", { headers: adminHeaders() }),
  applications: (params) => api.get("/api/admin/applications", { params: { ...params }, headers: adminHeaders() }),
  updateApplication: (ref, status, note) => api.patch(`/api/admin/applications/${ref}/status`, { status, note }, { headers: adminHeaders() }),
  jobs: (status) => api.get("/api/admin/jobs", { params: status ? { status } : {}, headers: adminHeaders() }),
  sathis: () => api.get("/api/admin/sathis", { headers: adminHeaders() }),
  toggleVerified: (slug, verified) => api.patch(`/api/admin/sathis/${slug}/verified`, { verified }, { headers: adminHeaders() }),
  backfillCoords: () => api.post("/api/admin/sathis/backfill-coords", {}, { headers: adminHeaders() }),
  promoCodes: () => api.get("/api/admin/promo-codes", { headers: adminHeaders() }),
  createPromoCode: (data) => api.post("/api/admin/promo-codes", data, { headers: adminHeaders() }),
  togglePromoCode: (code) => api.patch(`/api/admin/promo-codes/${code}/toggle`, {}, { headers: adminHeaders() }),
  deletePromoCode: (code) => api.delete(`/api/admin/promo-codes/${code}`, { headers: adminHeaders() }),
  settlements: () => api.get("/api/admin/settlements", { headers: adminHeaders() }),
  // Plaza management
  plazas: (params) => api.get("/api/admin/plazas", { params, headers: adminHeaders() }),
  plazaStats: () => api.get("/api/admin/plazas/stats", { headers: adminHeaders() }),
  createPlaza: (data) => api.post("/api/admin/plazas", data, { headers: adminHeaders() }),
  updatePlaza: (slug, data) => api.patch(`/api/admin/plazas/${slug}`, data, { headers: adminHeaders() }),
  deletePlaza: (slug) => api.delete(`/api/admin/plazas/${slug}`, { headers: adminHeaders() }),
  importPlazas: (list) => api.post("/api/admin/plazas/import", list, { headers: adminHeaders() }),
  // Content / Articles
  articles:      (params) => api.get("/api/admin/articles", { params, headers: adminHeaders() }),
  createArticle: (data)   => api.post("/api/admin/articles", data, { headers: adminHeaders() }),
  updateArticle: (slug, d)=> api.patch(`/api/admin/articles/${slug}`, d, { headers: adminHeaders() }),
  deleteArticle: (slug)   => api.delete(`/api/admin/articles/${slug}`, { headers: adminHeaders() }),
  seedArticles:  ()       => api.post("/api/admin/seed-articles", {}, { headers: adminHeaders() }),
};

export default api;
