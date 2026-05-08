const TRACK_BASE = window.location.href.replace("po-request.html", "po-track.html");

document.getElementById("form-po").addEventListener("submit", async function (e) {
  e.preventDefault();
  const tb = document.getElementById("tb-pr");
  tb.textContent = "Submitting...";
  tb.className = "thong-bao";

  const item     = document.getElementById("pr-item").value.trim();
  const name     = document.getElementById("pr-name").value.trim();
  const dept     = document.getElementById("pr-dept").value.trim();
  const priority = document.getElementById("pr-priority").value;
  const dueISO   = document.getElementById("pr-due").value;
  const budget   = document.getElementById("pr-budget").value;
  const note     = document.getElementById("pr-note").value.trim();

  const id  = Date.now().toString();
  const all = await dbGet("purchase_orders");
  const stt = all.length + 1;

  const dueDate = dueISO ? (() => {
    const [y, m, d] = dueISO.split("-");
    return `${d}/${m}/${y}`;
  })() : "";

  await dbSet("purchase_orders", id, {
    id,
    stt,
    poCode:       "",
    item,
    requestor:    `${name} (${dept})`,
    requestDate:  nowDate(),
    status:       "Pending Review",
    priority,
    dueDate,
    issueDate:    "",
    deliveryDate: "",
    budgetType:   budget,
    note,
    submittedBy:  name,
    department:   dept,
    createdAt:    new Date().toLocaleString("en-GB"),
  });

  const trackingLink = `${TRACK_BASE}?id=${id}`;
  document.getElementById("pr-tracking-id").textContent = id;
  document.getElementById("pr-tracking-link").href        = trackingLink;
  document.getElementById("pr-tracking-link").textContent = trackingLink;
  document.getElementById("card-form").style.display    = "none";
  document.getElementById("card-success").style.display = "block";
  tb.textContent = "";
});

function copyLink() {
  const link = document.getElementById("pr-tracking-link").href;
  navigator.clipboard.writeText(link).then(() => alert("Link copied!"));
}

function newRequest() {
  document.getElementById("form-po").reset();
  document.getElementById("tb-pr").textContent      = "";
  document.getElementById("card-form").style.display    = "block";
  document.getElementById("card-success").style.display = "none";
}
