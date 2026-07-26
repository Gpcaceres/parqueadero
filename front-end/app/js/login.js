import { AuthApi } from "./api.js";
import { saveSession, redirectIfAuthenticated } from "./session.js";

redirectIfAuthenticated();

const params = new URLSearchParams(window.location.search);
if (params.get("expired") === "1") {
  const banner = document.getElementById("bannerExpirado");
  banner.classList.remove("hidden");
}

document.getElementById("formLogin").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById("loginError");
  errorBox.classList.add("hidden");

  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const respuesta = await AuthApi.login(username, password);
    saveSession(respuesta);
    window.location.href = "index.html";
  } catch (err) {
    errorBox.textContent =
      err.status === 401 ? "Usuario o contraseña incorrectos" : err.message;
    errorBox.classList.remove("hidden");
  }
});
