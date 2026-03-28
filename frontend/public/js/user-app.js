document.addEventListener('DOMContentLoaded', async () => {
    // Initialize
    setupLoginPage();
    setupNavigation();
    setupSelectMode();
    setupFileUploader();

    // Check saved token
    const token = api.getToken();
    if (token) {
        try {
            const user = await api.getMe();
            setState({
                isLoggedIn: true,
                currentUser: user
            });
            showMainApp();
        } catch (err) {
            api.setToken(null);
        }
    } else {
        showLoginPage();
    }

    // Logout button
    document.getElementById('logout-btn').onclick = async () => {
        try {
            await api.logout();
        } catch (err) {
            // Ignore logout errors
        }
        api.setToken(null);
        setState({
            isLoggedIn: false,
            currentUser: null,
            materials: []
        });
        showLoginPage();
        showToast('已退出登录', 'info');
    };
});
