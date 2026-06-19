// Frontend API Client Bridge - Connects to PHP + MySQL Backend
// Replaces Supabase Client

// Dynamically compute the API base path
// - In production: Uses relative path '/api'
// - In development: Uses VITE_API_URL environment variable if set, otherwise falls back to local Mock Mode
const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : '');

export const isSupabaseConfigured = API_BASE !== '';

// Helper to make API requests with credentials (cookies)
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}/${endpoint}`;
  
  // Set credentials for session cookie support
  options.credentials = 'include';
  
  // Set default headers if sending JSON
  if (options.body && !(options.body instanceof FormData)) {
    options.headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }
  
  return response.json();
}

export const db = {
  // Authentication
  async signIn(email, password) {
    if (!isSupabaseConfigured) return null;
    const res = await apiRequest('auth.php?action=signin', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    return res.user;
  },

  async signUp(email, password, plan) {
    if (!isSupabaseConfigured) return null;
    const res = await apiRequest('auth.php?action=signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, plan })
    });
    return res.user;
  },

  async logout() {
    if (!isSupabaseConfigured) return;
    await apiRequest('auth.php?action=logout', {
      method: 'POST'
    });
  },

  async getSession() {
    if (!isSupabaseConfigured) return null;
    const res = await apiRequest('auth.php?action=session');
    return res.user;
  },

  async updatePlan(newPlan) {
    if (!isSupabaseConfigured) return;
    const res = await apiRequest('auth.php?action=update_plan', {
      method: 'POST',
      body: JSON.stringify({ plan: newPlan })
    });
    return res.success;
  },

  // Tours
  async getTours() {
    if (!isSupabaseConfigured) return [];
    return apiRequest('tours.php');
  },

  async getTourById(tourId) {
    if (!isSupabaseConfigured) return null;
    return apiRequest(`tours.php?id=${tourId}`);
  },

  async saveTour(tour) {
    if (!isSupabaseConfigured) return;
    await apiRequest('tours.php', {
      method: 'POST',
      body: JSON.stringify({
        id: tour.id,
        title: tour.title,
        description: tour.description,
        scenes: tour.scenes
      })
    });
  },

  async deleteTour(tourId) {
    if (!isSupabaseConfigured) return;
    await apiRequest(`tours.php?id=${tourId}`, {
      method: 'DELETE'
    });
  },

  // Upload image to local php server uploads directory
  async uploadSceneImage(file) {
    if (!isSupabaseConfigured) return null;
    
    const formData = new FormData();
    formData.append('file', file);

    const res = await apiRequest('upload.php', {
      method: 'POST',
      body: formData
    });

    return res.url;
  }
};

// Export null supabase client placeholder for compatibility
export const supabase = null;
