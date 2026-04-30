const ACCOUNTS = {
  "superadmin": { password: "super@123", role: "super",  name: "Super Admin" },
  "admin-hcm":  { password: "hcm@123",  role: "branch", branch: "HCM", name: "Admin HCM" },
  "admin-dn":   { password: "dn@123",   role: "branch", branch: "DN",  name: "Admin Da Nang" },
  "admin-hn":   { password: "hn@123",   role: "branch", branch: "HN",  name: "Admin Ha Noi" },
  "admin-hue":  { password: "hue@123",  role: "branch", branch: "Hue", name: "Admin Hue" },
};

// If already logged in, go straight to dashboard
if (sessionStorage.getItem("gvt_user")) {
  window.location.href = "admin.html";
}

document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const username = document.getElementById("l-user").value.trim().toLowerCase();
  const password = document.getElementById("l-pass").value;
  const errEl = document.getElementById("l-error");

  const acc = ACCOUNTS[username];
  if (!acc || acc.password !== password) {
    errEl.textContent = "Incorrect username or password.";
    errEl.style.display = "block";
    return;
  }

  sessionStorage.setItem("gvt_user", JSON.stringify({
    username,
    role:   acc.role,
    branch: acc.branch || null,
    name:   acc.name,
  }));

  window.location.href = "admin.html";
});
