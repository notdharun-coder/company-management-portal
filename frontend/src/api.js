import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

let accessToken = null;
let unauthorizedHandler = null;

export function setAuthToken(token) {
  accessToken = token || null;
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && accessToken && unauthorizedHandler) {
      accessToken = null;
      unauthorizedHandler();
    }
    return Promise.reject(error);
  },
);

export async function fetchCompanies({ page, limit, search, industry }) {
  const response = await api.get("/companies", {
    params: {
      page,
      limit,
      search: search || undefined,
      industry: industry || undefined,
    },
  });
  return response.data;
}

export async function fetchCompanyStats() {
  const response = await api.get("/companies/stats");
  return response.data;
}

export async function saveCompanies(companies) {
  const response = await api.post("/companies/bulk", companies);
  return response.data;
}

export async function updateCompany(id, company) {
  const response = await api.put(`/companies/${id}`, company);
  return response.data;
}

export async function deleteCompany(id) {
  await api.delete(`/companies/${id}`);
}

export async function signUp(user) {
  const response = await api.post("/auth/signup", user);
  return response.data;
}

export async function signIn(credentials) {
  const response = await api.post("/auth/login", credentials);
  return response.data;
}
