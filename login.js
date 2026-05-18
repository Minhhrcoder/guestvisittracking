const ACCOUNTS = {
  "admin":      { password: "admin@123",   role: "admin",     name: "Admin",      canAccessPO: true  },
  "reception":  { password: "recep@123",   role: "reception", name: "Reception",  canAccessPO: false },
  "purchasing": { password: "po@123",      role: "reception", name: "Purchasing", canAccessPO: true  },
};

if (sessionStorage.getItem("gvt_user")) {
  window.location.href = "admin.html";
}

document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("l-user").value.trim().toLowerCase();
  const password = document.getElementById("l-pass").value;
  const errEl    = document.getElementById("l-error");

  const acc = ACCOUNTS[username];
  if (!acc || acc.password !== password) {
    errEl.textContent = "Incorrect username or password.";
    errEl.style.display = "block";
    return;
  }

  sessionStorage.setItem("gvt_user", JSON.stringify({
    username,
    role: acc.role,
    name: acc.name,
    canAccessPO: acc.canAccessPO || false,
  }));

  window.location.href = "admin.html";
});
