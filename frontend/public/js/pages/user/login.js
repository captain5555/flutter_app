function setupLoginPage() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const result = await api.login(username, password);
            api.setToken(result.token);
            setState({
                isLoggedIn: true,
                currentUser: result.user
            });
            showMainApp();
            showToast('登录成功', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };
}

function showLoginPage() {
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    updateUserInfo();
    loadMaterials();
}

function updateUserInfo() {
    const el = document.getElementById('user-info');
    if (el && state.currentUser) {
        el.textContent = state.currentUser.username;
    }
}
