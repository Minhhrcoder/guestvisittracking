const params = new URLSearchParams(window.location.search);
const urlLoc = params.get("loc") || "";

const locConfig = {
  HCM: { label: "Ho Chi Minh City", cls: "loc-hcm", color: "#1e40af", bg: "#dbeafe" },
  DN:  { label: "Da Nang",          cls: "loc-dn",  color: "#6b21a8", bg: "#f3e8ff" },
  HN:  { label: "Ha Noi",           cls: "loc-hn",  color: "#166534", bg: "#dcfce7" },
  Hue: { label: "Hue",              cls: "loc-hue", color: "#dc2626", bg: "#fee2e2" },
};

// Pre-select location from QR code URL param if available
if (urlLoc && document.getElementById("g-location")) {
  document.getElementById("g-location").value = urlLoc;
}

// Auto-fill date and time
const now = new Date();
document.getElementById("g-date").value = now.toISOString().split("T")[0];
document.getElementById("g-time").value = now.toTimeString().slice(0, 5);

function toggleOther() {
  const val = document.getElementById("g-purpose").value;
  document.getElementById("other-group").style.display = val === "Other" ? "block" : "none";
}

document.getElementById("form-guest").addEventListener("submit", async function (e) {
  e.preventDefault();
  const tb = document.getElementById("tb-guest");
  tb.textContent = "Submitting..."; tb.className = "thong-bao";

  const location = document.getElementById("g-location").value;
  if (!location) {
    tb.textContent = "Please select an office. / Vui lòng chọn văn phòng.";
    tb.className = "thong-bao loi"; return;
  }

  const purposeRaw = document.getElementById("g-purpose").value;
  const purpose = purposeRaw === "Other"
    ? document.getElementById("g-other").value.trim()
    : purposeRaw;

  if (purposeRaw === "Other" && !purpose) {
    tb.textContent = "Please specify your purpose. / Vui lòng ghi rõ mục đích.";
    tb.className = "thong-bao loi"; return;
  }

  const cfg = locConfig[location] || locConfig["HCM"];
  const dateVal = document.getElementById("g-date").value;
  const timeVal = document.getElementById("g-time").value;
  const [y, m, d] = dateVal.split("-");
  const dateIn = `${d}/${m}/${y}`;

  const all = await dbGet("visitors");
  const stt = all.length + 1;
  const id  = Date.now().toString();

  const visitor = {
    id,
    stt,
    visitorName:   document.getElementById("g-name").value.trim(),
    companyName:   document.getElementById("g-company").value.trim(),
    idNumber:      document.getElementById("g-id").value.trim(),
    purpose,
    meetPerson:    document.getElementById("g-meet").value.trim(),
    location,
    locationLabel: cfg.label,
    visitorCardNo: "",
    dateIn,
    timeIn:  timeVal,
    dateOut: "",
    timeOut: "",
    status:  "in",
    createdAt: new Date().toLocaleString("en-GB"),
  };

  await dbSet("visitors", id, visitor);

  document.getElementById("visitor-no").textContent = "#" + String(stt).padStart(4, "0");
  document.getElementById("card-form").style.display    = "none";
  document.getElementById("card-success").style.display = "block";
});

function dangKyMoi() {
  document.getElementById("form-guest").reset();
  if (urlLoc) document.getElementById("g-location").value = urlLoc;
  const now = new Date();
  document.getElementById("g-date").value = now.toISOString().split("T")[0];
  document.getElementById("g-time").value = now.toTimeString().slice(0, 5);
  document.getElementById("other-group").style.display = "none";
  document.getElementById("tb-guest").textContent = "";
  document.getElementById("card-form").style.display    = "block";
  document.getElementById("card-success").style.display = "none";
}
