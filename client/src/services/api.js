const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem("accessToken");

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      if (response.status === 401) {
        // Try refreshing the token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.request(endpoint, options); // Retry original
        } else {
          this.logout();
          return;
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "API request failed");
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("accessToken", data.access_token);
        localStorage.setItem("refreshToken", data.refresh_token);
        return true;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }
    return false;
  }

  logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  }

  // ---------------- AUTH ----------------
  login(credentials) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  register(userData) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  getCurrentUser() {
    return this.request("/auth/me");
  }

  // ---------------- FLOWS ----------------
  createFlow(flowData) {
    return this.request("/flows", {
      method: "POST",
      body: JSON.stringify(flowData),
    });
  }

  getFlows() {
    return this.request("/flows");
  }

  getFlow(id) {
    return this.request(`/flows/${id}`);
  }

  parseFlow(id) {
    return this.request(`/flows/${id}/parse`, { method: "POST" });
  }

  getBrutalityScore(id) {
    return this.request(`/flows/${id}/score`);
  }

  getRoleBasedFixes(id, role) {
    return this.request(`/flows/${id}/fixes?role=${role}`);
  }

  // ---------------- REPORTS ----------------
  generateCEOReport(reportData) {
    return this.request("/reports/ceo", {
      method: "POST",
      body: JSON.stringify(reportData),
    });
  }

  getReports() {
    return this.request("/reports");
  }

  getReport(id) {
    return this.request(`/reports/${id}`);
  }

  // ---------------- AGENTOPS ----------------
  createPipeline(pipelineData) {
    return this.request("/agentops/pipelines", {
      method: "POST",
      body: JSON.stringify(pipelineData),
    });
  }

  getPipelines() {
    return this.request("/agentops/pipelines");
  }

  getPipelineStatus(id) {
    return this.request(`/agentops/pipelines/${id}/status`);
  }
}

export const apiService = new ApiService();
