// Admin API client for administrative functions
const ADMIN_API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class AdminApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('admin_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('admin_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('admin_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Request failed with status ${response.status}`);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Admin Auth
  async login(email: string, password: string) {
    return this.request<{ admin: any; token: string }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentAdmin() {
    return this.request<{ admin: any }>('/admin/me');
  }

  // Admin Stats
  async getAdminStats() {
    return this.request<any>('/admin/stats');
  }

  async getAnalytics(timeRange: string) {
    return this.request<any>(`/admin/analytics?range=${timeRange}`);
  }

  // User Management
  async searchUsers(params: any) {
    const queryString = new URLSearchParams(params).toString();
    console.log('AdminAPI: Searching users with params:', params);
    const url = `/admin/users${queryString ? `?${queryString}` : ''}`;
    console.log('AdminAPI: Request URL:', url);
    return this.request<{ users: any[] }>(url);
  }

  async updateUserStatus(userId: string, updates: any) {
    console.log('AdminAPI: Updating user status:', userId, updates);
    return this.request(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async suspendUser(userId: string) {
    console.log('AdminAPI: Suspending user:', userId);
    return this.request(`/admin/users/${userId}/suspend`, {
      method: 'POST',
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Session Management
  async getAllSessions(status?: string) {
    const params = status ? `?status=${status}` : '';
    console.log('AdminAPI: Getting sessions with status:', status);
    const url = `/admin/sessions${params}`;
    console.log('AdminAPI: Request URL:', url);
    return this.request<{ sessions: any[] }>(url);
  }

  async updateSessionStatus(sessionId: string, status: string) {
    return this.request(`/admin/sessions/${sessionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Content Moderation
  async getReportedContent() {
    return this.request<{ reports: any[] }>('/admin/content/reports');
  }

  async moderateContent(contentId: string, action: 'approve' | 'remove') {
    return this.request(`/admin/content/${contentId}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  // System Configuration
  async getSystemConfig() {
    return this.request<{ config: any }>('/admin/config');
  }

  async updateSystemConfig(config: any) {
    return this.request('/admin/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Platform Management
  async enableMaintenanceMode() {
    return this.request('/admin/maintenance', {
      method: 'POST',
      body: JSON.stringify({ enabled: true }),
    });
  }

  async disableMaintenanceMode() {
    return this.request('/admin/maintenance', {
      method: 'POST',
      body: JSON.stringify({ enabled: false }),
    });
  }

  // Reports and Analytics
  async exportUserData(format: 'csv' | 'json') {
    return this.request(`/admin/export/users?format=${format}`);
  }

  async exportSessionData(format: 'csv' | 'json') {
    return this.request(`/admin/export/sessions?format=${format}`);
  }
}

export const adminApiClient = new AdminApiClient(ADMIN_API_BASE_URL);