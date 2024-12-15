document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    const loginFormContainer = document.getElementById("login-form-container");
    const signupFormContainer = document.getElementById("signup-form-container");

    const loginLever = document.getElementById("login-lever");
    const signupLever = document.getElementById("signup-lever");

    // Toggle between login and signup forms
    loginLever.addEventListener("click", () => {
        loginFormContainer.style.display = "block";
        signupFormContainer.style.display = "none";
    });

    signupLever.addEventListener("click", () => {
        loginFormContainer.style.display = "none";
        signupFormContainer.style.display = "block";
    });

    // Default: show login form
    loginFormContainer.style.display = "block";
    signupFormContainer.style.display = "none";

    // 로그인 폼 제출 처리
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("login-username").value.trim();
            const password = document.getElementById("login-password").value.trim();

            if (!username || !password) {
                alert("아이디와 비밀번호를 모두 입력하세요.");
                return;
            }

            try {
                const response = await fetch("http://tetris.junzzang.kro.kr:5002/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem("token", data.accessToken);
                    localStorage.setItem("nickname", data.nickname);
                    alert("로그인 성공!");
                    window.location.href = "index.html"; // 로비 페이지로 이동
                } else {
                    const error = await response.json();
                    alert(`로그인 실~~패: ${error.detail}`);
                }
            } catch (error) {
                console.error("로그인 요청 중 오류 발생:", error);
                alert("로그인 중 오류가 발생했습니다.");
            }
        });
    }

    // 회원가입 폼 제출 처리
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("signup-username").value.trim();
            const email = document.getElementById("signup-email").value.trim();
            const password = document.getElementById("signup-password").value.trim();
            const nickname = document.getElementById("signup-nickname").value.trim(); // 닉네임 가져오기
            if (!username || !email || !password || !nickname) {
                alert("모든 필드를 입력하세요.");
                return;
            }

            try {
                const response = await fetch("http://tetris.junzzang.kro.kr:5002/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, email, password, nickname }), // 닉네임 포함
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem("token", data.access_token);
                    localStorage.setItem("nickname", data.nickname); // 서버에서 받은 닉네임 저장
                    alert("회원가입 성공!");
                    window.location.href = "index.html"; // 로비 페이지로 이동
                } else {
                    const error = await response.json();
                    alert(`회원가입 실패: ${error.detail}`);
                }
            } catch (error) {
                console.error("회원가입 요청 중 오류 발생:", error);
                alert("회원가입 중 오류가 발생했습니다.");
            }
        });
    }
});
