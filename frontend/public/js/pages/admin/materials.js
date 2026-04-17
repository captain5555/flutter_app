// Admin materials page state
const AdminMaterialsState = {
    selectedUserId: null,
    selectedFolder: 'images'
};

async function loadAdminMaterials() {
    try {
        const filterUser = document.getElementById('filter-user')?.value;
        AdminMaterialsState.selectedUserId = filterUser ? parseInt(filterUser) : null;
        const materials = await api.getAllMaterials(filterUser ? { userId: filterUser } : {});
        renderAdminMaterialsGrid(materials);
    } catch (err) {
        showToast('加载素材列表失败', 'error');
    }
}

function renderAdminMaterialsGrid(materials) {
    const grid = document.getElementById('admin-materials-grid');
    if (!grid) return;

    if (materials.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>暂无素材</p></div>';
    } else {
        grid.innerHTML = materials.map(m => MaterialCard.render(m)).join('');
    }
}

async function handleAdminUpload(files) {
    if (!files || files.length === 0) return;

    const targetUserId = AdminMaterialsState.selectedUserId;
    const folderType = AdminMaterialsState.selectedFolder;

    if (!targetUserId) {
        showToast('请先选择要上传到哪个用户', 'error');
        return;
    }

    try {
        showToast(`正在上传 ${files.length} 个文件...`, 'info');

        for (const file of files) {
            await api.uploadMaterial(file, folderType, targetUserId);
        }

        showToast('上传成功');
        await loadAdminMaterials();
    } catch (err) {
        showToast(err.message || '上传失败', 'error');
    }
}

async function setupAdminMaterialsPage() {
    // Load users for filter
    try {
        const users = await api.getUsers();
        const select = document.getElementById('filter-user');
        if (select) {
            select.innerHTML = '<option value="">所有用户</option>' +
                users.map(u => `<option value="${u.id}">${u.username}</option>`).join('');
            select.onchange = loadAdminMaterials;
        }
    } catch (err) {
        console.error('Failed to load users for filter:', err);
    }

    // Setup folder select
    const folderSelect = document.getElementById('upload-folder-select');
    if (folderSelect) {
        folderSelect.onchange = (e) => {
            AdminMaterialsState.selectedFolder = e.target.value;
        };
    }

    // Setup upload button
    const uploadBtn = document.getElementById('admin-upload-btn');
    const fileInput = document.getElementById('admin-file-input');
    if (uploadBtn && fileInput) {
        uploadBtn.onclick = () => fileInput.click();
        fileInput.onchange = async (e) => {
            await handleAdminUpload(e.target.files);
            e.target.value = '';
        };
    }
}
