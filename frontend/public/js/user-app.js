// User App Main Entry
const UserApp = {
  async init() {
    State.init();
    this.bindEvents();

    if (State.user && State.token) {
      this.showMainApp();
      await this.loadMaterials();
    }
  },

  bindEvents() {
    // Login
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.onclick = () => this.handleLogin();
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.onclick = () => this.handleLogout();
    }

    // Theme toggle
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.onclick = () => this.toggleTheme();
    }

    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.onclick = () => this.switchFolder(btn.dataset.folder);
    });

    // Mobile menu
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
      menuBtn.onclick = () => this.openSidebar();
    }
    const sidebarClose = document.getElementById('sidebar-close');
    if (sidebarClose) {
      sidebarClose.onclick = () => this.closeSidebar();
    }
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (sidebarOverlay) {
      sidebarOverlay.onclick = () => this.closeSidebar();
    }

    // Upload
    const uploadBtn = document.getElementById('upload-btn');
    const fileInput = document.getElementById('file-input');
    if (uploadBtn && fileInput) {
      uploadBtn.onclick = () => fileInput.click();
      fileInput.onchange = (e) => this.handleUpload(e);
    }

    // Select mode
    const selectModeBtn = document.getElementById('select-mode-btn');
    const cancelSelectBtn = document.getElementById('cancel-select-btn');
    if (selectModeBtn) {
      selectModeBtn.onclick = () => this.toggleSelectMode();
    }
    if (cancelSelectBtn) {
      cancelSelectBtn.onclick = () => this.toggleSelectMode(false);
    }

    // Batch actions
    const batchTrashBtn = document.getElementById('batch-trash-btn');
    const batchCopyBtn = document.getElementById('batch-copy-btn');
    const batchMoveBtn = document.getElementById('batch-move-btn');
    if (batchTrashBtn) {
      batchTrashBtn.onclick = () => this.batchTrash();
    }
    if (batchCopyBtn) {
      batchCopyBtn.onclick = () => this.showBatchCopy();
    }
    if (batchMoveBtn) {
      batchMoveBtn.onclick = () => this.showBatchMove();
    }

    // AI panel
    const aiBtn = document.getElementById('ai-btn');
    if (aiBtn) {
      aiBtn.onclick = () => this.showAIPanel();
    }
  },

  async handleLogin() {
    const userSelect = document.getElementById('user-select');
    if (!userSelect) return;

    const username = userSelect.value;
    try {
      Toast.show('登录中...', 'info');
      const result = await api.loginSimple(username);
      State.setUser(result.user, result.token);
      Toast.show('登录成功');
      this.showMainApp();
      await this.loadMaterials();
    } catch (err) {
      Toast.show(err.message || '登录失败', 'error');
    }
  },

  handleLogout() {
    State.setUser(null, null);
    this.showLogin();
    Toast.show('已退出登录');
  },

  toggleTheme() {
    State.toggleTheme();
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.textContent = State.theme === 'light' ? '🌙 主题' : '☀️ 主题';
    }
  },

  showLogin() {
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (mainApp) mainApp.classList.add('hidden');
  },

  showMainApp() {
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    if (loginScreen) loginScreen.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');

    if (State.user) {
      const userName = document.getElementById('user-name');
      const userRole = document.getElementById('user-role');
      if (userName) userName.textContent = State.user.username;
      if (userRole) userRole.textContent = State.user.role === 'admin' ? '管理员' : '用户';
    }

    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.textContent = State.theme === 'light' ? '🌙 主题' : '☀️ 主题';
    }
  },

  openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('visible');
  },

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
  },

  switchFolder(folderType) {
    State.currentFolder = folderType;
    State.isTrashView = folderType === 'trash';

    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.folder === folderType);
    });

    this.toggleSelectMode(false);
    this.loadMaterials();
    this.closeSidebar();
  },

  async loadMaterials() {
    try {
      let materials;
      if (State.isTrashView) {
        materials = await api.getTrashMaterials(State.user.id);
      } else {
        materials = await api.getUserMaterials(State.user.id, State.currentFolder);
      }
      State.materials = materials || [];
      this.renderMaterials();
    } catch (err) {
      console.error('Load materials error:', err);
      Toast.show(err.message || '加载失败', 'error');
    }
  },

  renderMaterials() {
    const grid = document.getElementById('materials-grid');
    const emptyState = document.getElementById('empty-state');
    if (!grid || !emptyState) return;

    if (State.materials.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    grid.innerHTML = State.materials.map(m => MaterialCard.render(m)).join('');

    // Bind click events
    grid.querySelectorAll('.material-card').forEach(card => {
      card.onclick = (e) => {
        if (State.isSelectMode) {
          e.stopPropagation();
          const id = parseInt(card.dataset.id);
          State.toggleSelection(id);
          card.classList.toggle('selected', State.selectedIds.has(id));
          this.updateSelectedCount();
        } else {
          this.showMaterialDetail(parseInt(card.dataset.id));
        }
      };
    });
  },

  async showMaterialDetail(id) {
    try {
      const material = await api.getMaterial(id);

      Modal.show({
        title: '素材详情',
        content: this.renderMaterialDetail(material),
        onMount: () => this.bindMaterialDetailEvents(material)
      });
    } catch (err) {
      Toast.show(err.message || '加载失败', 'error');
    }
  },

  renderMaterialDetail(material) {
    const isVideo = material.folder_type === 'videos' || material.file_type?.startsWith('video/');
    return `
      <div class="material-detail">
        <div class="material-preview">
          ${isVideo && material.file_url
            ? `<video src="${material.file_url}" controls style="width:100%;max-height:300px;"></video>`
            : material.file_url
              ? `<img src="${material.file_url}" alt="${material.title || material.file_name}" style="width:100%;max-height:300px;object-fit:contain;">`
              : '<div style="width:100%;height:200px;background:var(--sidebar-bg);display:flex;align-items:center;justify-content:center;">预览不可用</div>'
          }
        </div>

        <div class="material-form" style="min-width:280px;">
          <div class="form-group">
            <label>文件名</label>
            <input type="text" id="detail-filename" value="${material.file_name || ''}" disabled>
          </div>

          <div class="form-group">
            <label>标题</label>
            <input type="text" id="detail-title" value="${material.title || ''}" placeholder="输入标题">
          </div>

          <div class="form-group">
            <label>描述</label>
            <textarea id="detail-description" placeholder="输入描述">${material.description || ''}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>使用标签</label>
              <select id="detail-usage-tag">
                <option value="unused" ${material.usage_tag === 'unused' ? 'selected' : ''}>未使用</option>
                <option value="used" ${material.usage_tag === 'used' ? 'selected' : ''}>已使用</option>
              </select>
            </div>

            <div class="form-group">
              <label>爆款标签</label>
              <select id="detail-viral-tag">
                <option value="not_viral" ${material.viral_tag === 'not_viral' ? 'selected' : ''}>非爆款</option>
                <option value="viral" ${material.viral_tag === 'viral' ? 'selected' : ''}>爆款</option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            ${isVideo ? '<button id="download-btn" class="btn secondary">下载视频</button>' : ''}
            <button id="save-btn" class="btn primary">保存</button>
          </div>
        </div>
      </div>
    `;
  },

  bindMaterialDetailEvents(material) {
    // Save
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
      saveBtn.onclick = async () => {
        try {
          await api.updateMaterial(material.id, {
            title: document.getElementById('detail-title')?.value || '',
            description: document.getElementById('detail-description')?.value || '',
            usage_tag: document.getElementById('detail-usage-tag')?.value || 'unused',
            viral_tag: document.getElementById('detail-viral-tag')?.value || 'not_viral'
          });
          Toast.show('保存成功');
          Modal.hide();
          this.loadMaterials();
        } catch (err) {
          Toast.show(err.message || '保存失败', 'error');
        }
      };
    }

    // Download
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
      downloadBtn.onclick = () => api.downloadMaterial(material.id);
    }
  },

  toggleSelectMode(enable) {
    State.isSelectMode = enable !== undefined ? enable : !State.isSelectMode;
    State.clearSelection();

    const selectModeBtn = document.getElementById('select-mode-btn');
    const batchActions = document.getElementById('batch-actions');
    const selectedCount = document.getElementById('selected-count');
    const cancelSelectBtn = document.getElementById('cancel-select-btn');

    if (selectModeBtn) selectModeBtn.classList.toggle('hidden', State.isSelectMode);
    if (batchActions) batchActions.classList.toggle('hidden', !State.isSelectMode);
    if (selectedCount) selectedCount.classList.toggle('hidden', !State.isSelectMode);
    if (cancelSelectBtn) cancelSelectBtn.classList.toggle('hidden', !State.isSelectMode);

    this.renderMaterials();
  },

  updateSelectedCount() {
    const count = State.selectedIds.size;
    const selectedCount = document.getElementById('selected-count');
    if (selectedCount) {
      selectedCount.textContent = count > 0 ? `已选择 ${count} 项` : '';
    }
  },

  async batchTrash() {
    if (State.selectedIds.size === 0) return;

    try {
      const ids = Array.from(State.selectedIds);
      if (State.isTrashView) {
        await api.batchDelete(ids);
        Toast.show('已永久删除');
      } else {
        await api.batchTrash(ids);
        Toast.show('已移到垃圾箱');
      }
      this.toggleSelectMode(false);
      this.loadMaterials();
    } catch (err) {
      Toast.show(err.message || '操作失败', 'error');
    }
  },

  async showBatchCopy() {
    if (State.selectedIds.size === 0) return;
    Toast.show('复制功能开发中', 'info');
  },

  async showBatchMove() {
    if (State.selectedIds.size === 0) return;
    Toast.show('移动功能开发中', 'info');
  },

  showAIPanel() {
    Modal.show({
      title: 'AI助手',
      content: `
        <div class="ai-panel">
          <div class="ai-tabs">
            <button class="ai-tab active" data-tab="translate">翻译</button>
          </div>

          <div class="ai-tab-content" id="tab-translate">
            <div class="form-group">
              <label>输入文本</label>
              <textarea id="ai-translate-input" placeholder="输入要翻译的中文"></textarea>
            </div>
            <button id="ai-translate-generate" class="btn primary">翻译成英文</button>
            <div class="form-group">
              <label>翻译结果</label>
              <textarea id="ai-translate-result" readonly></textarea>
            </div>
          </div>
        </div>
      `,
      onMount: () => this.bindAIPanelEvents()
    });
  },

  bindAIPanelEvents() {
    // Translate
    const translateBtn = document.getElementById('ai-translate-generate');
    if (translateBtn) {
      translateBtn.onclick = async () => {
        try {
          const text = document.getElementById('ai-translate-input')?.value;
          if (!text) {
            Toast.show('请输入要翻译的文本', 'error');
            return;
          }
          const result = await api.translate(text);
          const resultEl = document.getElementById('ai-translate-result');
          if (resultEl && result) {
            resultEl.value = result.translated;
          }
        } catch (err) {
          Toast.show(err.message || '翻译失败', 'error');
        }
      };
    }
  },

  async handleUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      Toast.show(`正在上传 ${files.length} 个文件...`, 'info');

      for (const file of files) {
        await api.uploadMaterial(file, State.currentFolder, undefined);
      }

      Toast.show('上传成功');
      this.loadMaterials();
    } catch (err) {
      Toast.show(err.message || '上传失败', 'error');
    } finally {
      e.target.value = '';
    }
  }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => UserApp.init());
} else {
  UserApp.init();
}
