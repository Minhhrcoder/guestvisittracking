// --- AUTH ---
const gvtUser = JSON.parse(sessionStorage.getItem("gvt_user") || "null");
if (!gvtUser) window.location.href = "login.html";

const canDelete = gvtUser && gvtUser.role === "admin";
document.getElementById("user-label").textContent = "👤 " + (gvtUser ? gvtUser.name : "");

function logout() {
  sessionStorage.removeItem("gvt_user");
  window.location.href = "login.html";
}

// --- STATE ---
let currentId   = null;
let allData     = [];
let allCardLoans = [];
let currentTab  = "visitors";

document.getElementById("f-date").value    = new Date().toISOString().split("T")[0];
document.getElementById("cb-f-date").value = new Date().toISOString().split("T")[0];

// --- TABS ---
function switchTab(tab) {
  currentTab = tab;
  document.getElementById("tab-visitors").style.display    = tab === "visitors" ? "block" : "none";
  document.getElementById("tab-cards").style.display       = tab === "cards"    ? "block" : "none";
  document.getElementById("tab-btn-visitors").classList.toggle("active", tab === "visitors");
  document.getElementById("tab-btn-cards").classList.toggle("active",    tab === "cards");
  if (tab === "visitors") loadVisitors();
  if (tab === "cards")    loadCardLoans();
}

function refreshCurrent() {
  if (currentTab === "visitors") loadVisitors();
  else loadCardLoans();
}

// --- HELPERS ---
function locBadge(loc) {
  const map   = { HCM: "loc-hcm", DN: "loc-dn", HN: "loc-hn", Hue: "loc-hue" };
  const label = { HCM: "HCM", DN: "DN", HN: "HN", Hue: "Hue" };
  return `<span class="${map[loc] || ''}">${label[loc] || loc}</span>`;
}

function toDateVN(d) {
  if (!d) return "";
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y}`;
}

function dongModal(id) {
  document.getElementById(id).classList.remove("active");
  currentId = null;
}

// =====================
// VISITOR LOG
// =====================
async function loadVisitors() {
  const tbody = document.getElementById("visitor-body");
  tbody.innerHTML = `<tr><td colspan="13" class="empty-td">Loading...</td></tr>`;

  allData = await dbGet("visitors");
  allData.sort((a, b) => b.id - a.id);

  const today     = nowDate();
  const thisMonth = today.slice(3);
  document.getElementById("s-today").textContent = allData.filter(v => v.dateIn === today).length;
  document.getElementById("s-in").textContent    = allData.filter(v => v.status === "in"  && v.dateIn === today).length;
  document.getElementById("s-out").textContent   = allData.filter(v => v.status === "out" && v.dateIn === today).length;
  document.getElementById("s-total").textContent = allData.filter(v => v.dateIn && v.dateIn.slice(3) === thisMonth).length;

  const fLoc    = document.getElementById("f-loc").value;
  const fStatus = document.getElementById("f-status").value;
  const fDate   = document.getElementById("f-date").value;
  const fSearch = document.getElementById("f-search").value.toLowerCase();

  let ds = [...allData];
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
        ${canDelete ? `<button class="btn-danger" onclick="xoaKhach('${v.id}')">Delete</button>` : ""}
      </td>
    </tr>
  `).join("");
}

function moModalThe(id) {
  currentId = id;
  const v = allData.find(x => x.id === id);
  document.getElementById("mc-name").value   = v.visitorName;
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
  await dbUpdate("visitors", currentId, { status: "out", timeOut: nowTime(), dateOut: nowDate() });
  dongModal("modal-checkout");
  loadVisitors();
}

async function xoaKhach(id) {
  if (!confirm("Are you sure you want to delete this record?")) return;
  await dbDelete("visitors", id);
  loadVisitors();
}

function resetFilter() {
  document.getElementById("f-loc").value    = "";
  document.getElementById("f-status").value = "";
  document.getElementById("f-date").value   = new Date().toISOString().split("T")[0];
  document.getElementById("f-search").value = "";
  loadVisitors();
}

async function xuatExcel() {
  const ds = allData.length > 0 ? allData : await dbGet("visitors");
  if (ds.length === 0) { alert("No data to export!"); return; }
  const rows = ds.map((v, i) => ({
    "No.": i + 1, "Visitor Name": v.visitorName, "Company": v.companyName,
    "ID / Passport": v.idNumber || "", "Visitor Card": v.visitorCardNo || "",
    "Purpose": v.purpose, "Person to Meet": v.meetPerson || "",
    "Office": v.locationLabel || v.location,
    "Date In": v.dateIn, "Time In": v.timeIn,
    "Date Out": v.dateOut || "", "Time Out": v.timeOut || "",
    "Status": v.status === "in" ? "In Office" : "Checked Out",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Visitors");
  XLSX.writeFile(wb, `guest-visit-${nowDate().replace(/\//g, "-")}.xlsx`);
}

// =====================
// CARD BORROWING
// =====================
async function loadCardLoans() {
  const tbody = document.getElementById("card-loan-body");
  tbody.innerHTML = `<tr><td colspan="10" class="empty-td">Loading...</td></tr>`;

  allCardLoans = await dbGet("card_loans");
  allCardLoans.sort((a, b) => b.id - a.id);

  const today     = nowDate();
  const thisMonth = today.slice(3);
  document.getElementById("cb-borrowed").textContent = allCardLoans.filter(v => v.status === "borrowed").length;
  document.getElementById("cb-returned").textContent = allCardLoans.filter(v => v.status === "returned" && v.returnDate === today).length;
  document.getElementById("cb-total").textContent    = allCardLoans.filter(v => v.borrowDate && v.borrowDate.slice(3) === thisMonth).length;

  const fStatus = document.getElementById("cb-f-status").value;
  const fDate   = document.getElementById("cb-f-date").value;
  const fSearch = document.getElementById("cb-f-search").value.toLowerCase();

  let ds = [...allCardLoans];
  if (fStatus) ds = ds.filter(v => v.status === fStatus);
  if (fDate)   ds = ds.filter(v => v.borrowDate === toDateVN(fDate));
  if (fSearch) ds = ds.filter(v => v.employeeName.toLowerCase().includes(fSearch));

  if (ds.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="empty-td">No records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = ds.map((v, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${v.employeeName}</strong></td>
      <td>${v.company || "—"}</td>
      <td>${v.cardType}</td>
      <td>${v.reason || "—"}</td>
      <td>${v.borrowDate}</td>
      <td>${v.borrowTime}</td>
      <td>${v.returnDate || "—"}</td>
      <td>${v.returnTime || "—"}</td>
      <td><span class="badge badge-${v.status === 'borrowed' ? 'in' : 'out'}">${v.status === "borrowed" ? "Borrowed" : "Returned"}</span></td>
      <td>
        ${v.status === "borrowed" ? `<button class="btn-success" onclick="moModalTra('${v.id}')">Return</button>` : ""}
        ${canDelete ? `<button class="btn-danger" onclick="xoaMuon('${v.id}')">Delete</button>` : ""}
      </td>
    </tr>
  `).join("");
}

function moModalMuonThe() {
  document.getElementById("mb-name").value    = "";
  document.getElementById("mb-company").value = "";
  document.getElementById("mb-type").value    = "";
  document.getElementById("mb-reason").value  = "";
  document.getElementById("mb-date").value   = new Date().toISOString().split("T")[0];
  document.getElementById("mb-time").value   = new Date().toTimeString().slice(0, 5);
  document.getElementById("modal-borrow").classList.add("active");
}

async function luuMuonThe() {
  const name    = document.getElementById("mb-name").value.trim();
  const company = document.getElementById("mb-company").value;
  const type    = document.getElementById("mb-type").value.trim();
  const reason  = document.getElementById("mb-reason").value.trim();
  const dateVal = document.getElementById("mb-date").value;
  const timeVal = document.getElementById("mb-time").value;

  if (!name || !company || !type || !dateVal || !timeVal) {
    alert("Please fill in all required fields!"); return;
  }

  const id = Date.now().toString();
  await dbSet("card_loans", id, {
    id,
    employeeName: name,
    company:      company,
    cardType:     type,
    reason,
    borrowDate:   toDateVN(dateVal),
    borrowTime:   timeVal,
    returnDate:   "",
    returnTime:   "",
    status:       "borrowed",
    createdAt:    new Date().toLocaleString("en-GB"),
  });

  dongModal("modal-borrow");
  loadCardLoans();
}

function moModalTra(id) {
  currentId = id;
  const v = allCardLoans.find(x => x.id === id);
  document.getElementById("mr-name").textContent = v.employeeName + " — " + v.cardType;
  document.getElementById("mr-time").textContent = nowTime() + " — " + nowDate();
  document.getElementById("modal-return").classList.add("active");
}

async function xacNhanTra() {
  await dbUpdate("card_loans", currentId, { status: "returned", returnDate: nowDate(), returnTime: nowTime() });
  dongModal("modal-return");
  loadCardLoans();
}

async function xoaMuon(id) {
  if (!confirm("Are you sure you want to delete this record?")) return;
  await dbDelete("card_loans", id);
  loadCardLoans();
}

function resetCardFilter() {
  document.getElementById("cb-f-status").value = "";
  document.getElementById("cb-f-date").value   = new Date().toISOString().split("T")[0];
  document.getElementById("cb-f-search").value = "";
  loadCardLoans();
}

// --- INIT ---
loadVisitors();
setInterval(() => {
  if (currentTab === "visitors") loadVisitors();
  else loadCardLoans();
}, 60000);
