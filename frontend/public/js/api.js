class API {
    constructor() {
        this.baseUrl = '/api';
        this.token = localStorage.getItem('nasMaterialManager_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('nasMaterialManager_token', token);
        } else {
            localStorage.removeItem('nasMaterialManager_token');
        }
    }

    getToken() {
        return this.token || localStorage.getItem('nasMaterialManager_token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const token = this.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Request failed');
            }

            return data.data;
        } catch (err) {
            console.error('API Error:', err);
            throw err;
        }
    }

    // Auth
    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async logout() {
        return this.request('/auth/logout', { method: 'POST' });
    }

    async refreshToken(token) {
        return this.request('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
    }

    async getMe() {
        return this.request('/auth/me');
    }

    // Users
    async getUsers() {
        return this.request('/users');
    }

    async getUser(id) {
        return this.request(`/users/${id}`);
    }

    async createUser(data) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateUser(id, data) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteUser(id) {
        return this.request(`/users/${id}`, {
            method: 'DELETE'
        });
    }

    // Materials
    async getUserMaterials(userId, folderType) {
        return this.request(`/materials/user/${userId}/folder/${folderType}`);
    }

    async getTrashMaterials(userId) {
        return this.request(`/materials/user/${userId}/trash`);
    }

    async getMaterial(id) {
        return this.request(`/materials/${id}`);
    }

    async uploadMaterial(file, folderType, targetUserId, onProgress) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderType', folderType);
        if (targetUserId) {
            formData.append('targetUserId', targetUserId);
        }

        const token = this.getToken();
        const response = await fetch(`${this.baseUrl}/materials/upload`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Upload failed');
        }
        return data.data;
    }

    async updateMaterial(id, data) {
        return this.request(`/materials/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteMaterial(id) {
        return this.request(`/materials/${id}`, {
            method: 'DELETE'
        });
    }

    async batchTrash(ids) {
        return this.request('/materials/batch/trash', {
            method: 'POST',
            body: JSON.stringify({ ids })
        });
    }

    async batchRestore(ids) {
        return this.request('/materials/batch/restore', {
            method: 'POST',
            body: JSON.stringify({ ids })
        });
    }

    async batchDelete(ids) {
        return this.request('/materials/batch', {
            method: 'DELETE',
            body: JSON.stringify({ ids })
        });
    }

    async batchCopy(ids, targetUserId) {
        return this.request('/materials/batch/copy', {
            method: 'POST',
            body: JSON.stringify({ ids, targetUserId })
        });
    }

    async batchMove(ids, targetUserId, targetFolder) {
        return this.request('/materials/batch/move', {
            method: 'POST',
            body: JSON.stringify({ ids, targetUserId, targetFolder })
        });
    }

    downloadMaterial(id) {
        const token = this.getToken();
        window.location.href = `${this.baseUrl}/materials/${id}/download?token=${encodeURIComponent(token)}`;
    }

    // AI
    async getAISettings() {
        return this.request('/ai/settings');
    }

    async saveAISettings(settings) {
        return this.request('/ai/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    async generateTitle(image, currentTitle) {
        return this.request('/ai/generate-title', {
            method: 'POST',
            body: JSON.stringify({ image, current_title: currentTitle })
        });
    }

    async generateDescription(image, currentDescription) {
        return this.request('/ai/generate-description', {
            method: 'POST',
            body: JSON.stringify({ image, current_description: currentDescription })
        });
    }

    async translate(text) {
        return this.request('/ai/translate', {
            method: 'POST',
            body: JSON.stringify({ text })
        });
    }

    // Auth - simplified login
    async loginSimple(username) {
        return this.request('/auth/login-simple', {
            method: 'POST',
            body: JSON.stringify({ username })
        });
    }

    // Folders
    async getUserFolders(userId) {
        return this.request(`/folders/user/${userId}`);
    }

    async createFolder(data) {
        return this.request('/folders', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateFolder(id, name) {
        return this.request(`/folders/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name })
        });
    }

    async deleteFolder(id) {
        return this.request(`/folders/${id}`, {
            method: 'DELETE'
        });
    }

    // Admin
    async getStats() {
        return this.request('/admin/stats');
    }

    async getAllMaterials(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return this.request(`/admin/materials${params ? '?' + params : ''}`);
    }

    async getLogs(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return this.request(`/admin/logs${params ? '?' + params : ''}`);
    }

    async createBackup() {
        return this.request('/admin/backup', { method: 'POST' });
    }

    async getBackups() {
        return this.request('/admin/backups');
    }

    async deleteBackup(id) {
        return this.request(`/admin/backups/${id}`, { method: 'DELETE' });
    }
}

const api = new API();
