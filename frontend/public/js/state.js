const State = {
  user: null,
  token: null,
  currentFolder: 'images',
  materials: [],
  selectedIds: new Set(),
  theme: 'light',
  isTrashView: false,
  isSelectMode: false,
  users: [],

  init() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);

    const savedToken = localStorage.getItem('nasMaterialManager_token');
    const savedUser = localStorage.getItem('nasMaterialManager_user');
    if (savedToken && savedUser) {
      this.token = savedToken;
      this.user = JSON.parse(savedUser);
      api.setToken(savedToken);
    }
  },

  setTheme(theme) {
    this.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  },

  toggleTheme() {
    this.setTheme(this.theme === 'light' ? 'dark' : 'light');
  },

  setUser(user, token) {
    this.user = user;
    this.token = token;
    if (user && token) {
      localStorage.setItem('nasMaterialManager_user', JSON.stringify(user));
      localStorage.setItem('nasMaterialManager_token', token);
      api.setToken(token);
    } else {
      localStorage.removeItem('nasMaterialManager_user');
      localStorage.removeItem('nasMaterialManager_token');
      api.setToken(null);
    }
  },

  clearSelection() {
    this.selectedIds.clear();
  },

  toggleSelection(id) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  },

  selectAll() {
    this.materials.forEach(m => this.selectedIds.add(m.id));
  },

  formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  formatDate(dateStr) {
    return new Date(dateStr).toLocaleString('zh-CN');
  }
};
