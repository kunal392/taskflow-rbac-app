const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const cleanApiUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const response = await fetch(`${cleanApiUrl}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized globally
  if (response.status === 401 && endpoint !== '/auth/login') {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.detail || response.statusText || 'An error occurred');
  }

  return data;
};

// API Methods
export const api = {
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    
    return fetchApi('/auth/login', {
      method: 'POST',
      body: formData,
    });
  },

  register: async (name, email, password) => {
    return fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  getMe: async () => {
    return fetchApi('/auth/me', { method: 'GET' });
  },

  getProjects: async () => {
    return fetchApi('/projects', { method: 'GET' });
  },

  createProject: async (name, description) => {
    return fetchApi('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  },

  getProject: async (id) => {
    return fetchApi(`/projects/${id}`, { method: 'GET' });
  },

  deleteProject: async (id) => {
    return fetchApi(`/projects/${id}`, { method: 'DELETE' });
  },

  getMembers: async (projectId) => {
    return fetchApi(`/projects/${projectId}/members`, { method: 'GET' });
  },

  addMember: async (projectId, userId, role) => {
    return fetchApi(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, role }),
    });
  },

  getTasks: async (projectId) => {
    return fetchApi(`/projects/${projectId}/tasks`, { method: 'GET' });
  },

  createTask: async (projectId, taskData) => {
    return fetchApi(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  updateTaskStatus: async (projectId, taskId, status) => {
    return fetchApi(`/projects/${projectId}/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }
};
