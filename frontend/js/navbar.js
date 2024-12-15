const token = localStorage.getItem("token");
const loginLink = document.getElementById('login-link');
const logoutButton = document.getElementById('logout-button');

function updateNavbar() {
    if (token) {
        logoutButton.style.display = 'inline-block';
        loginLink.style.display = 'none';
    } else {
        logoutButton.style.display = 'none';
        loginLink.style.display = 'inline-block';
    }
}

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem("token");
        localStorage.removeItem("nickname");
        localStorage.removeItem("room_id");
        localStorage.removeItem("host");
        alert("로그아웃 되었습니다.");
        window.location.href = 'index.html';
    });
}

updateNavbar();
