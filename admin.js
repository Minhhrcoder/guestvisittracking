// --- AUTH CHECK ---
const gvtUser = JSON.parse(sessionStorage.getItem("gvt_user") || "null");
if (!gvtUser) {
  window.location.href = "login.html";
}

const isBranch = gvtUser && gvtUser.role === "branch";
const myBranch = isBranch ? gvtUser.branch : null;

// Show user info in header
document.getElementById("user-label").textContent = "👤 " + (gvtUser ? gvtUser.name : "");

// If branch admin: lock and hide office filter
if (isBranch) {
  const locSelect = document.getElementById("f-loc");
  locSelect.value = myBranch;
  locSelect.style.display = "none";
}

function logout() {
  sessionStorage.removeItem("gvt_user");
  window.location.href = "login.html";
}

// ------------------

let currentId = null;
let allData = [];

document.getElementById("f-date").value = new Date().toISOString().split("T")[0];

function locBadge(loc) {
  const map = { HCM: "loc-hcm", DN: "loc-dn", HN: "loc-hn", Hue: "loc-hue" };
  const label = { HCM: "HCM", DN: "DN", HN: "HN", Hue: "Hue" };
  return `<span class="${map[loc] || ''}">${label[loc] || loc}</span>`;
}

function toDateVN(dateInput) {
  if (!dateInput) return "";
  const [y, m, d] = dateInput.split("-");
  return `${d}/${m}/${y}`;
}

async function loadVisitors() {
  const tbody = document.getElementById("visitor-body");
  tbody.innerHTML = `<tr><td colspan="13" class="empty-td">Loading...</td></tr>`;

  allData = await dbGet("visitors");
  allData.sort((a, b) => b.id - a.id);

  // Stats: branch admin only counts their own office
  const scopedData = isBranch ? allData.filter(v => v.location === myBranch) : allData;
  const today = nowDate();
  const thisMonth = today.slice(3);
  document.getElementById("s-today").textContent = scopedData.filter(v => v.dateIn === today).length;
  document.getElementById("s-in").textContent    = scopedData.filter(v => v.status === "in"  && v.dateIn === today).length;
  document.getElementById("s-out").textContent   = scopedData.filter(v => v.status === "out" && v.dateIn === today).length;
  document.getElementById("s-total").textContent = scopedData.filter(v => v.dateIn && v.dateIn.slice(3) === thisMonth).length;

  const fLoc    = document.getElementById("f-loc").value;
  const fStatus = document.getElementById("f-status").value;
  const fDate   = document.getElementById("f-date").value;
  const fSearch = document.getElementById("f-search").value.toLowerCase();

  let ds = isBranch ? allData.filter(v => v.location === myBranch) : allData;
  if (fLoc)    ds = ds.filter(v => v.location === fLoc);
  if (fStatus) ds = ds.filter(v => v.status === fStatus);
  if (fDate)   ds = ds.filter(v => v.dateIn === toDateVN(fDate));
  if (fSearch) ds = ds.filter(v =>
    v.visitorName.toLowerCase().includes(fSearch) ||
    v.companyName.toLowerCase().includes(fSearch)
  );

  if (ds.length === 0) {
    tbody.innerHTML = `<tr><td colspan="13" class="empty-td">No visitors found.</td></tr>`;
    return;
  }

  tbody.innerHTML = ds.map((v, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${v.visitorName}</strong></td>
      <td>${v.companyName}</td>
      <td>${v.idNumber || "—"}</td>
      <td>${v.visitorCardNo ? `<strong>${v.visitorCardNo}</strong>` : `<button class="btn-warning" onclick="moModalThe('${v.id}')">+ Assign Card</button>`}</td>
      <td>${v.purpose}</td>
      <td>${v.meetPerson || "—"}</td>
      <td>${locBadge(v.location)}</td>
      <td>${v.dateIn || "—"}</td>
      <td>${v.timeIn || "—"}</td>
      <td>${v.timeOut ? v.timeOut + "<br><small style='color:#6b7280'>" + v.dateOut + "</small>" : "—"}</td>
      <td><span class="badge badge-${v.status}">${v.status === "in" ? "In Office" : "Checked Out"}</span></td>
      <td>
        ${v.status === "in" ? `<button class="btn-success" onclick="moCheckout('${v.id}')">Check-out</button>` : ""}
        <button class="btn-danger" onclick="xoaKhach('${v.id}')">Delete</button>
      </td>
    </tr>
  `).join("");
}

function moModalThe(id) {
  currentId = id;
  const v = allData.find(x => x.id === id);
  document.getElementById("mc-name").value = v.visitorName;
  document.getElementById("mc-cardno").value = v.visitorCardNo || "";
  document.getElementById("modal-card").classList.add("active");
}

async function luuThe() {
  const cardNo = document.getElementById("mc-cardno").value.trim();
  if (!cardNo) { alert("Please enter a card number!"); return; }
  await dbUpdate("visitors", currentId, { visitorCardNo: cardNo });
  dongModal("modal-card");
  loadVisitors();
}

function moCheckout(id) {
  currentId = id;
  const v = allData.find(x => x.id === id);
  document.getElementById("mc-checkout-name").textContent = v.visitorName + " (" + v.companyName + ")";
  document.getElementById("mc-time-out").textContent = nowTime() + " — " + nowDate();
  document.getElementById("modal-checkout").classList.add("active");
}

async function xacNhanCheckout() {
  await dbUpdate("visitors", currentId, {
    status:  "out",
    timeOut: nowTime(),
    dateOut: nowDate(),
  });
  dongModal("modal-checkout");
  loadVisitors();
}

async function xoaKhach(id) {
  if (!confirm("Are you sure you want to delete this record?")) return;
  await dbDelete("visitors", id);
  loadVisitors();
}

function dongModal(id) {
  document.getElementById(id).classList.remove("active");
  currentId = null;
}

function resetFilter() {
  if (!isBranch) document.getElementById("f-loc").value = "";
  document.getElementById("f-status").value = "";
  document.getElementById("f-date").value   = new Date().toISOString().split("T")[0];
  document.getElementById("f-search").value = "";
  loadVisitors();
}

async function xuatExcel() {
  const base = allData.length > 0 ? allData : await dbGet("visitors");
  const ds = isBranch ? base.filter(v => v.location === myBranch) : base;
  if (ds.length === 0) { alert("No data to export!"); return; }
  const rows = ds.map((v, i) => ({
    "No.":            i + 1,
    "Visitor Name":   v.visitorName,
    "Company":        v.companyName,
    "ID / Passport":  v.idNumber || "",
    "Visitor Card":   v.visitorCardNo || "",
    "Purpose":        v.purpose,
    "Person to Meet": v.meetPerson || "",
    "Office":         v.locationLabel || v.location,
    "Date In":        v.dateIn,
    "Time In":        v.timeIn,
    "Date Out":       v.dateOut || "",
    "Time Out":       v.timeOut || "",
    "Status":         v.status === "in" ? "In Office" : "Checked Out",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Visitors");
  XLSX.writeFile(wb, `guest-visit-${nowDate().replace(/\//g, "-")}.xlsx`);
}

loadVisitors();
setInterval(loadVisitors, 60000);
