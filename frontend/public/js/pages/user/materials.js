async function loadMaterials() {
    if (!state.currentUser) return;

    try {
        let materials;
        if (state.isTrashView) {
            materials = await api.getTrashMaterials(state.currentUser.id);
        } else {
            materials = await api.getUserMaterials(state.currentUser.id, state.currentFolder);
        }
        setState({ materials });
        renderMaterialsGrid(materials, state.selectedMaterialIds);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function setupNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        tab.onclick = async () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const folder = tab.dataset.folder;
            setState({
                currentFolder: folder,
                isTrashView: folder === 'trash',
                selectedMaterialIds: new Set(),
                isSelectMode: false
            });

            updateToolbar();
            await loadMaterials();
        };
    });
}

function setupSelectMode() {
    const selectBtn = document.getElementById('select-mode-btn');
    const cancelBtn = document.getElementById('cancel-select-btn');
    const trashBtn = document.getElementById('batch-trash-btn');

    if (selectBtn) {
        selectBtn.onclick = () => {
            setState({ isSelectMode: true, selectedMaterialIds: new Set() });
            updateToolbar();
        };
    }

    if (cancelBtn) {
        cancelBtn.onclick = () => {
            setState({ isSelectMode: false, selectedMaterialIds: new Set() });
            updateToolbar();
            renderMaterialsGrid(state.materials, state.selectedMaterialIds);
        };
    }

    if (trashBtn) {
        trashBtn.onclick = async () => {
            if (state.selectedMaterialIds.size === 0) return;

            const confirmed = await showModal(
                `<p>确定要删除选中的 ${state.selectedMaterialIds.size} 个素材吗？</p>`,
                { title: '确认删除' }
            );

            if (confirmed) {
                try {
                    if (state.isTrashView) {
                        await api.batchDelete([...state.selectedMaterialIds]);
                    } else {
                        await api.batchTrash([...state.selectedMaterialIds]);
                    }
                    showToast('操作成功', 'success');
                    setState({ isSelectMode: false, selectedMaterialIds: new Set() });
                    updateToolbar();
                    await loadMaterials();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            }
        };
    }

    // Grid click for selection
    document.getElementById('materials-grid').onclick = (e) => {
        const card = e.target.closest('.material-card');
        if (!card) return;

        const id = parseInt(card.dataset.id);

        if (state.isSelectMode) {
            if (state.selectedMaterialIds.has(id)) {
                state.selectedMaterialIds.delete(id);
            } else {
                state.selectedMaterialIds.add(id);
            }
            renderMaterialsGrid(state.materials, state.selectedMaterialIds);
        } else {
            // Single view mode
            showMaterialDetail(id);
        }
    };
}

function updateToolbar() {
    const selectBtn = document.getElementById('select-mode-btn');
    const batchActions = document.getElementById('batch-actions');

    if (state.isSelectMode) {
        selectBtn?.classList.add('hidden');
        batchActions?.classList.remove('hidden');
    } else {
        selectBtn?.classList.remove('hidden');
        batchActions?.classList.add('hidden');
    }
}

async function showMaterialDetail(id) {
    const material = state.materials.find(m => m.id === id);
    if (!material) return;

    const content = `
        <div style="text-align: center;">
            ${material.file_url ? `<img src="${material.file_url}" style="max-width: 100%; max-height: 400px;">` : ''}
            <p><strong>${material.file_name}</strong></p>
            <p>${formatFileSize(material.file_size)}</p>
            <p>${formatDate(material.created_at)}</p>
        </div>
    `;

    await showModal(content, { title: '素材详情' });
}
