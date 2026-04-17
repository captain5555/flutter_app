// API Adapter: Convert V3 API format to V2 format
const API_BASE = '/api';

// Store the current token for API requests
let currentToken = null;

function setToken(token) {
    currentToken = token;
}

// Convert V3 response to V2 format
function adaptResponse(response) {
    if (response.success) {
        return response.data;
    } else {
        return { error: response.error || 'Unknown error' };
    }
}

// Make API request with V3 format, return V2 format
async function apiRequest(url, options = {}) {
    try {
        const headers = { 'Content-Type': 'application/json', ...options.headers };

        // Add Authorization header if token exists
        if (currentToken) {
            headers['Authorization'] = `Bearer ${currentToken}`;
        }

        const response = await fetch(url, {
            headers,
            ...options
        });
        const data = await response.json();
        return adaptResponse(data);
    } catch (err) {
        console.error('API Error:', err);
        return { error: err.message };
    }
}

// Login - V2 style
async function loginV2(username) {
    const data = await apiRequest(`${API_BASE}/auth/login-simple`, {
        method: 'POST',
        body: JSON.stringify({ username })
    });

    if (!data.error) {
        setToken(data.token);
        // Return V2 format user object
        return {
            id: data.user.id.toString(),
            name: data.user.username,
            role: data.user.role
        };
    }
    return data;
}

// Get users - V2 style
async function getUsersV2(currentUserId, currentUserRole) {
    const users = await apiRequest(`${API_BASE}/users`);
    if (users.error) return users;

    // Convert V3 users to V2 format
    return users.map(u => ({
        id: u.id.toString(),
        name: u.username,
        role: u.role
    }));
}

// Get materials - V2 style
async function getMaterialsV2(userId, folderType, isTrashView, currentUserRole) {
    let url;
    if (isTrashView) {
        url = `${API_BASE}/materials/user/${userId}/trash`;
        if (currentUserRole === 'admin') {
            url += '?all=true';
        }
    } else {
        url = `${API_BASE}/materials/user/${userId}/folder/${folderType}`;
    }

    const materials = await apiRequest(url);
    if (materials.error) return materials;

    // Convert V3 materials to V2 format
    return materials.map(m => ({
        id: m.id.toString(),
        user_id: m.user_id.toString(),
        filename: m.file_name,
        title: m.title,
        description: m.description,
        usage_tag: m.usage_tag,
        viral_tag: m.viral_tag,
        folder_type: m.folder_type,
        file_size: m.file_size,
        oss_key: m.file_path ? `/uploads/${m.file_path}` : null,
        deleted_at: m.deleted_at,
        file_url: m.file_url,
        thumbnail_url: m.thumbnail_url
    }));
}

// Update material - V2 style
async function updateMaterialV2(id, updates, currentUserId) {
    return await apiRequest(`${API_BASE}/materials/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            title: updates.title,
            description: updates.description,
            usage_tag: updates.usage_tag,
            viral_tag: updates.viral_tag
        })
    });
}

// Batch trash - V2 style
async function batchTrashV2(ids, currentUserId) {
    return await apiRequest(`${API_BASE}/materials/batch/trash`, {
        method: 'POST',
        body: JSON.stringify({ ids: ids.map(id => parseInt(id)) })
    });
}

// Batch restore - V2 style
async function batchRestoreV2(ids, currentUserId) {
    return await apiRequest(`${API_BASE}/materials/batch/restore`, {
        method: 'POST',
        body: JSON.stringify({ ids: ids.map(id => parseInt(id)) })
    });
}

// Batch permanent delete - V2 style
async function batchPermanentDeleteV2(ids, currentUserId) {
    return await apiRequest(`${API_BASE}/materials/batch`, {
        method: 'DELETE',
        body: JSON.stringify({ ids: ids.map(id => parseInt(id)) })
    });
}

// Batch copy - V2 style
async function batchCopyV2(ids, targetUserId, currentUserId) {
    return await apiRequest(`${API_BASE}/materials/batch/copy`, {
        method: 'POST',
        body: JSON.stringify({
            ids: ids.map(id => parseInt(id)),
            targetUserId: parseInt(targetUserId)
        })
    });
}

// Batch move - V2 style
async function batchMoveV2(ids, targetUserId, currentUserId) {
    return await apiRequest(`${API_BASE}/materials/batch/move`, {
        method: 'POST',
        body: JSON.stringify({
            ids: ids.map(id => parseInt(id)),
            targetUserId: parseInt(targetUserId)
        })
    });
}

// Create user - V2 style
async function createUserV2(name, currentUserId) {
    return await apiRequest(`${API_BASE}/users`, {
        method: 'POST',
        body: JSON.stringify({ username: name, password: '' })
    });
}

// Delete user - V2 style
async function deleteUserV2(userId, currentUserId) {
    return await apiRequest(`${API_BASE}/users/${userId}`, {
        method: 'DELETE'
    });
}

// Get AI settings - V2 style
async function getAISettingsV2() {
    const settings = await apiRequest(`${API_BASE}/ai/settings`);
    if (settings.error) return settings;
    return settings;
}

// Save AI settings - V2 style
async function saveAISettingsV2(settings, currentUserId) {
    return await apiRequest(`${API_BASE}/ai/settings`, {
        method: 'PUT',
        body: JSON.stringify(settings)
    });
}

// AI generate title - V2 style
async function generateTitleV2(image, currentUserId, currentTitle) {
    const result = await apiRequest(`${API_BASE}/ai/generate-title`, {
        method: 'POST',
        body: JSON.stringify({ image, current_title: currentTitle })
    });
    if (result.error) return result;
    return { title: result.title };
}

// AI generate description - V2 style
async function generateDescriptionV2(image, currentUserId, currentDescription) {
    const result = await apiRequest(`${API_BASE}/ai/generate-description`, {
        method: 'POST',
        body: JSON.stringify({ image, current_description: currentDescription })
    });
    if (result.error) return result;
    return { description: result.description };
}

// AI translate - V2 style
async function translateV2(text, currentUserId) {
    const result = await apiRequest(`${API_BASE}/ai/translate`, {
        method: 'POST',
        body: JSON.stringify({ text })
    });
    if (result.error) return result;
    return { translated: result.translated };
}
