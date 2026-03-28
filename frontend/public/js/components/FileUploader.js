async function handleFileUpload(files, folderType) {
    const results = [];

    for (const file of files) {
        try {
            showToast(`正在上传: ${file.name}`, 'info');
            const result = await api.uploadMaterial(file, folderType);
            results.push(result);
            showToast(`上传成功: ${file.name}`, 'success');
        } catch (err) {
            showToast(`上传失败: ${file.name} - ${err.message}`, 'error');
        }
    }

    return results;
}

function setupFileUploader() {
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-upload');

    if (uploadBtn && fileInput) {
        uploadBtn.onclick = () => fileInput.click();
        fileInput.onchange = async (e) => {
            if (e.target.files.length > 0) {
                await handleFileUpload(e.target.files, state.currentFolder);
                await loadMaterials();
                e.target.value = '';
            }
        };
    }
}
