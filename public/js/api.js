// API 客户端封装
const Api = {
  baseUrl: '/api',

  getToken() {
    return localStorage.getItem('dajia_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('dajia_token', token);
    } else {
      localStorage.removeItem('dajia_token');
    }
  },

  getCurrentRoomId() {
    return localStorage.getItem('dajia_room_id') || '1';
  },

  setCurrentRoomId(roomId) {
    localStorage.setItem('dajia_room_id', String(roomId));
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const res = await fetch(url, { ...options, headers });
      const contentType = res.headers.get('content-type') || '';
      let data = null;

      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch (jsonErr) {
          console.error('Failed to parse JSON response:', jsonErr);
        }
      } else {
        const text = await res.text();
        if (!res.ok) {
          // 如果后端或反向代理（如 Nginx/Docker）返回了 HTML 错误页面（500/502/504 等）
          throw new Error(res.status >= 500 ? '后端服务异常（500），请在飞牛Docker中点击【重启容器】加载最新后端代码' : (text || `请求失败 (${res.status})`));
        }
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }

      if (!res.ok) {
        throw new Error((data && data.error) || '请求失败，请稍后重试');
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // 认证
  login(username, password) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ username, phone: username, password })
    });
  },

  register(username, password, nickname) {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify({ username, phone: username, password, nickname })
    });
  },

  getMe() {
    return this.request('/me');
  },

  updateProfile(nickname) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ nickname })
    });
  },

  // 活动 (房间)
  getRooms() {
    return this.request('/rooms');
  },

  createRoom(title) {
    return this.request('/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ title })
    });
  },

  updateRoomTitle(roomId, title) {
    return this.request(`/rooms/${roomId}/title`, {
      method: 'PUT',
      body: JSON.stringify({ title })
    });
  },

  updateRoomNickname(roomId, nickname) {
    return this.request(`/rooms/${roomId}/members/nickname`, {
      method: 'PUT',
      body: JSON.stringify({ nickname })
    });
  },

  removeMember(roomId, userId) {
    return this.request(`/rooms/${roomId}/members/${userId}`, {
      method: 'DELETE'
    });
  },

  joinRoom(code) {
    return this.request('/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  },

  archiveRoom(roomId) {
    return this.request(`/rooms/${roomId}/archive`, {
      method: 'POST'
    });
  },

  unarchiveRoom(roomId) {
    return this.request(`/rooms/${roomId}/unarchive`, {
      method: 'POST'
    });
  },

  previewRoom(code, id) {
    const params = new URLSearchParams();
    if (code) params.set('code', code);
    if (id) params.set('id', id);
    return this.request(`/rooms/preview?${params.toString()}`);
  },

  // 协同看板
  getBoard(roomId) {
    return this.request(`/rooms/${roomId}/board`);
  },

  // 物资操作
  addItem(roomId, name, quantity = 1) {
    return this.request('/items', {
      method: 'POST',
      body: JSON.stringify({ roomId, name, quantity })
    });
  },

  batchAddItems(roomId, items) {
    return this.request('/items', {
      method: 'POST',
      body: JSON.stringify({ roomId, items })
    });
  },

  updateItem(itemId, name, quantity) {
    return this.request(`/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, quantity })
    });
  },

  deleteItem(itemId) {
    return this.request(`/items/${itemId}`, {
      method: 'DELETE'
    });
  },

  toggleCheckItem(itemId, isChecked) {
    return this.request(`/items/${itemId}/check`, {
      method: 'PATCH',
      body: JSON.stringify({ isChecked })
    });
  },

  // 露营推荐模板
  getTemplates() {
    return this.request('/templates');
  },

  // 系统与网络信息
  getSystemInfo() {
    return this.request('/system/info');
  },

  // 获取 SSE 实时数据流 URL
  getStreamUrl(roomId) {
    const token = this.getToken();
    return `${this.baseUrl}/rooms/${roomId}/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  }
};
