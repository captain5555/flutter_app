function showModal(content, options = {}) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
        <div class="modal-content">
            ${options.title ? `
                <div class="modal-header">
                    <h3>${options.title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
            ` : ''}
            <div class="modal-body">${content}</div>
            ${options.footer !== false ? `
                <div class="modal-footer">
                    ${options.footer || `
                        <button class="modal-cancel secondary">取消</button>
                        <button class="modal-confirm">确定</button>
                    `}
                </div>
            ` : ''}
        </div>
    `;

    container.classList.remove('hidden');

    return new Promise((resolve) => {
        const closeBtn = container.querySelector('.modal-close');
        const cancelBtn = container.querySelector('.modal-cancel');
        const confirmBtn = container.querySelector('.modal-confirm');

        const close = (result) => {
            container.classList.add('hidden');
            resolve(result);
        };

        if (closeBtn) closeBtn.onclick = () => close(false);
        if (cancelBtn) cancelBtn.onclick = () => close(false);
        if (confirmBtn) confirmBtn.onclick = () => close(true);
        container.onclick = (e) => {
            if (e.target === container) close(false);
        };
    });
}

function hideModal() {
    document.getElementById('modal-container').classList.add('hidden');
}
