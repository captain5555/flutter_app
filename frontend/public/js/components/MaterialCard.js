function renderMaterialCard(material, isSelected = false) {
    const thumbnailUrl = material.thumbnail_url || material.file_url || '';
    return `
        <div class="material-card ${isSelected ? 'selected' : ''}" data-id="${material.id}">
            <div class="material-thumbnail-container">
                ${material.file_type?.startsWith('video') ? '<span class="video-indicator">视频</span>' : ''}
                <img class="material-thumbnail" src="${thumbnailUrl}" alt="${material.file_name}" onerror="this.style.display='none'">
            </div>
            <div class="material-info">
                <div class="material-name" title="${material.file_name}">${material.file_name}</div>
                <div class="material-size">${formatFileSize(material.file_size)}</div>
            </div>
        </div>
    `;
}

function renderMaterialsGrid(materials, selectedIds = new Set()) {
    const grid = document.getElementById('materials-grid');
    if (!grid) return;

    if (materials.length === 0) {
        grid.innerHTML = '';
        document.getElementById('empty-state').classList.remove('hidden');
    } else {
        document.getElementById('empty-state').classList.add('hidden');
        grid.innerHTML = materials.map(m =>
            renderMaterialCard(m, selectedIds.has(m.id))
        ).join('');
    }
}
