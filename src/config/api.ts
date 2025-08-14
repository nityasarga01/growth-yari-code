// API configuration and client setup
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

console.log('API Base URL:', API_BASE_URL);

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
    console.log('ApiClient initialized with baseURL:', baseURL);
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
    console.log('Token set successfully');
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
    console.log('Token cleared');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('Making request to:', url);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
      console.log('Request with auth token');
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('Response data:', result);

      if (!response.ok) {
        const errorMessage = result.error || result.message || `Request failed with status ${response.status}`;
        console.error('Request failed:', errorMessage);
        throw new Error(errorMessage);
      }

      return result;
    } catch (error) {
      console.error('API request failed:', error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Network error: Unable to connect to server. Please check if the backend is running.',
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    console.log('Attempting login for:', email);
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(userData: {
    name: string;
    email: string;
    password: string;
    profession: string;
    industry: string;
    experience: string;
    skills: string[];
    objectives: string[];
    location: string;
    field: string;
    mentorshipGoals: string[];
    availabilityStatus: string;
  }) {
    console.log('Attempting signup for:', userData.email);
    return this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  // User endpoints
  async getUser(id: string) {
    return this.request<{ user: any }>(`/users/${id}`);
  }

  async getUserStats(id: string) {
    return this.request<{ stats: any }>(`/users/${id}/stats`);
  }

  async updateProfile(data: any) {
    return this.request<{ user: any }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async searchUsers(params: any) {
    const queryString = new URLSearchParams(params).toString();
    return this.request<{ users: any[] }>(`/users?${queryString}`);
  }

  // Posts endpoints
  async getFeed(page = 1, limit = 10) {
    return this.request<{ posts: any[] }>(`/posts/feed?page=${page}&limit=${limit}`);
  }

  async createPost(postData: any) {
    // Ensure we're sending the correct field names to match backend expectations
    const backendPostData = {
      type: postData.type,
      content: postData.content,
      caption: postData.caption,
      media_url: postData.mediaUrl, // Convert to snake_case for backend
      thumbnail: postData.thumbnail,
      tags: postData.tags || []
    };
    
    console.log('Creating post with data:', backendPostData);
    
    return this.request<{ post: any }>('/posts', {
      method: 'POST',
      body: JSON.stringify(backendPostData),
    });
  }

  async likePost(postId: string) {
    return this.request<{ liked: boolean }>(`/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async addComment(postId: string, content: string) {
    return this.request<{ comment: any }>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getPostComments(postId: string, page = 1, limit = 20) {
    return this.request<{ comments: any[] }>(`/posts/${postId}/comments?page=${page}&limit=${limit}`);
  }

  // Sessions endpoints
  async getSessions(type?: string) {
    const params = type ? `?type=${type}` : '';
    return this.request<{ sessions: any[] }>(`/sessions${params}`);
  }

  async bookSession(sessionData: any) {
    return this.request<{ session: any }>('/sessions/book', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async updateSessionStatus(sessionId: string, status: string) {
    return this.request<{ session: any }>(`/sessions/${sessionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Connections endpoints
  async getConnections() {
    console.log('ApiClient: Getting connections...');
    return this.request<{ connections: any[] }>('/connections');
  }

  async sendConnectionRequest(userId: string, message: string) {
    return this.request<{ request: any }>('/connections/request', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, message }),
    });
  }

  async getConnectionRequests(type = 'received') {
    return this.request<{ requests: any[] }>(`/connections/requests?type=${type}`);
  }

  async respondToConnectionRequest(requestId: string, action: 'accept' | 'decline') {
    return this.request<{ status: string }>(`/connections/requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    });
  }

  // YariConnect endpoints
  async getYariConnectProfessionals(filters: any) {
    const queryString = new URLSearchParams(
      Object.entries(filters).reduce((acc, [key, value]) => {
        if (value && value !== 'all') {
          acc[key] = value;
        }
        return acc;
      }, {} as any)
    ).toString();
    return this.request<{ professionals: any[] }>(`/yari-connect/professionals${queryString ? `?${queryString}` : ''}`);
  }

  async startYariConnectSession(participantId: string) {
    return this.request<{ session: any }>('/yari-connect/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ participant_id: participantId }),
    });
  }

  async getYariConnectSessions() {
    return this.request<{ sessions: any[] }>('/yari-connect/sessions');
  }

  async getYariConnectStats() {
    return this.request<{ stats: any }>('/yari-connect/stats');
  }

  async endYariConnectSession(sessionId: string) {
    return this.request<{ duration: number }>(`/yari-connect/sessions/${sessionId}/end`, {
      method: 'PATCH',
    });
  }

  // Search endpoints
  async search(query: string, type = 'all') {
    return this.request<{ results: any }>(`/search?q=${encodeURIComponent(query)}&type=${type}`);
  }

  // Notifications endpoints
  async getNotifications() {
    console.log('Getting notifications');
    return this.request<{ notifications: any[] }>('/notifications');
  }

  async markNotificationAsRead(notificationId: string) {
    console.log('Marking notification as read:', notificationId);
    return this.request('/notifications/' + notificationId + '/read', {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead() {
    console.log('Marking all notifications as read');
    return this.request('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  async deleteNotification(notificationId: string) {
    console.log('Deleting notification:', notificationId);
    return this.request('/notifications/' + notificationId, {
      method: 'DELETE',
    });
  }

  async getUnreadNotificationsCount() {
    console.log('Getting unread notifications count');
    return this.request<{ unread_count: number }>('/notifications/unread-count');
  }

  // Chat endpoints
  async sendChatMessage(recipientId: string, message: string, sessionId?: string) {
    console.log('Sending chat message to:', recipientId);
    return this.request<{ message: any }>('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ recipient_id: recipientId, message, session_id: sessionId }),
    });
  }

  async getChatMessages(recipientId: string, page = 1, limit = 50) {
    console.log('Getting chat messages with:', recipientId);
    return this.request<{ messages: any[] }>(`/chat/messages/${recipientId}?page=${page}&limit=${limit}`);
  }

  async markChatMessagesAsRead(senderId: string) {
    return this.request(`/chat/messages/${senderId}/read`, {
      method: 'PATCH',
    });
  }

  async getChatConversations() {
    return this.request<{ conversations: any[] }>('/chat/conversations');
  }

  // Calendar endpoints
  async getCalendarEvents(startDate?: string, endDate?: string) {
    console.log('Getting calendar events for date range:', startDate, 'to', endDate);
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    return this.request<{ events: any[] }>(`/calendar/events?${params.toString()}`);
  }

  async getExpertAvailability(expertId: string, date?: string) {
    console.log('Getting expert availability for:', expertId, 'on', date);
    const params = date ? `?date=${date}` : '';
    return this.request<{ slots: any[] }>(`/calendar/availability/${expertId}${params}`);
  }

  async createAvailability(availabilityData: any) {
    console.log('Creating availability:', availabilityData);
    return this.request('/calendar/availability', {
      method: 'POST',
      body: JSON.stringify(availabilityData),
    });
  }

  // Availability management endpoints
  async getAvailabilitySettings(userId: string) {
    console.log('API: Getting availability settings for user:', userId);
    return this.request<{ settings: any }>(`/availability/settings/${userId}`);
  }

  async updateAvailabilitySettings(settings: any) {
    console.log('API: Updating availability settings:', settings);
    return this.request<{ settings: any }>('/availability/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getExpertAvailabilitySlots(expertId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    console.log('API: Getting availability slots for expert:', expertId, 'with params:', params.toString());
    console.log('API: Full URL:', `/availability/slots/${expertId}?${params.toString()}`);
    return this.request<{ slots: any[] }>(`/availability/slots/${expertId}?${params.toString()}`);
  }

  async createAvailabilitySlot(slotData: any) {
    console.log('API: Creating availability slot:', slotData);
    return this.request<{ slot: any }>('/availability/slots', {
      method: 'POST',
      body: JSON.stringify(slotData),
    });
  }

  async updateAvailabilitySlot(slotId: string, slotData: any) {
    return this.request<{ slot: any }>(`/availability/slots/${slotId}`, {
      method: 'PUT',
      body: JSON.stringify(slotData),
    });
  }

  async deleteAvailabilitySlot(slotId: string) {
    return this.request(`/availability/slots/${slotId}`, {
      method: 'DELETE',
    });
  }

  // Upload endpoints
  async uploadFile(file: File) {
    console.log('ApiClient: Uploading file:', file.name, file.type, file.size);
    
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    } else {
      console.error('No auth token available for upload');
      return { success: false, error: 'Authentication required' };
    }

    try {
      console.log('Making upload request to:', `${this.baseURL}/upload/single`);
      const response = await fetch(`${this.baseURL}/upload/single`, {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('Upload response status:', response.status);
      const result = await response.json();
      console.log('Upload response data:', result);
      
      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.request<{ stats: any }>('/dashboard/stats');
  }

  async getRecentActivity() {
    return this.request<{ activities: any[] }>('/dashboard/activity');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);