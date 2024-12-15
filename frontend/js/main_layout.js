// /home/ubuntu/Project/Tetris/frontend/js/main_layout.js
document.addEventListener("DOMContentLoaded", async () => {
    // navbar.html 로딩
    const navbarContainer = document.getElementById('navbar-container');
    const navbarResponse = await fetch('navbar.html');
    const navbarHTML = await navbarResponse.text();
    navbarContainer.innerHTML = navbarHTML;

    // lobby.html 로딩
    const mainContainer = document.getElementById('main-container');
    const lobbyResponse = await fetch('lobby.html');
    const lobbyHTML = await lobbyResponse.text();
    mainContainer.innerHTML = lobbyHTML;

    // navbar.js 로직 실행
    await import('./navbar.js');

    // lobby.js 로직 실행
    await import('./lobby.js');
});
