const DB_URL = "https://quanlythexe-default-rtdb.asia-southeast1.firebasedatabase.app/guesttracking";

async function dbGet(path) {
  const res = await fetch(`${DB_URL}/${path}.json`);
  const data = await res.json();
  if (!data) return [];
  return Object.entries(data).map(([id, val]) => ({ ...val, id }));
}

async function dbSet(path, id, value) {
  await fetch(`${DB_URL}/${path}/${id}.json`, {
    method: "PUT",
    body: JSON.stringify(value),
  });
}

async function dbUpdate(path, id, value) {
  await fetch(`${DB_URL}/${path}/${id}.json`, {
    method: "PATCH",
    body: JSON.stringify(value),
  });
}

async function dbDelete(path, id) {
  await fetch(`${DB_URL}/${path}/${id}.json`, { method: "DELETE" });
}

function nowDate() {
  const d = new Date();
  const day   = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}
function nowTime() {
  return new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}
function nowFull() {
  return new Date().toLocaleString("vi-VN");
}
