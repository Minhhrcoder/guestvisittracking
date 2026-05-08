const STATUS_STEPS = [
  "Pending Review",
  "Initial Review by Procurement",
  "Request for Quotations (RFQ)",
  "Internal Approvals (Dept Head / Finance / BOD)",
  "Purchase Order Issued",
  "Delivery & Inspection",
  "Completed",
];

const PRIORITY_COLOR = {
  Urgent: "#dc2626", High: "#d97706", Medium: "#2563eb", Low: "#6b7280"
};

// Auto-load from URL param
const params = new URLSearchParams(window.location.search);
const urlId  = params.get("id");
if (urlId) {
  document.getElementById("track-input").value = urlId;
  trackRequest();
}

async function trackRequest() {
  const id     = document.getElementById("track-input").value.trim();
  const result = document.getElementById("track-result");
  if (!id) { result.innerHTML = `<p style="color:#dc2626;text-align:center">Please enter a tracking ID.</p>`; return; }

  result.innerHTML = `<p style="text-align:center;color:#6b7280">Loading...</p>`;

  const all = await dbGet("purchase_orders");
  const po  = all.find(x => x.id === id);

  if (!po) {
    result.innerHTML = `<div class="track-card" style="text-align:center">
      <p style="font-size:32px">🔍</p>
      <p style="color:#dc2626;font-weight:600">Request not found.</p>
      <p style="font-size:13px;color:#6b7280">Please check your tracking ID and try again.</p>
    </div>`;
    return;
  }

  const isCancelled = po.status === "Cancelled";
  const currentIdx  = isCancelled ? -1 : STATUS_STEPS.indexOf(po.status);
  const priColor    = PRIORITY_COLOR[po.priority] || "#6b7280";

  const timelineHTML = isCancelled
    ? `<div class="tl-step"><div class="tl-dot" style="background:#dc2626;color:white">✕</div><span class="tl-label" style="color:#dc2626;font-weight:600">Request Cancelled</span></div>`
    : STATUS_STEPS.map((step, i) => {
        const state = i < currentIdx ? "done" : i === currentIdx ? "current" : "pending";
        const icon  = state === "done" ? "✓" : state === "current" ? "●" : "○";
        return `<div class="tl-step">
          <div class="tl-dot ${state}">${icon}</div>
          <span class="tl-label ${state}">${step}</span>
        </div>`;
      }).join("");

  result.innerHTML = `
    <div class="track-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
        <div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px">Purchase Request #${po.stt || "—"}</div>
          <div style="font-size:18px;font-weight:700;color:#111827">${po.item}</div>
        </div>
        <span style="padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;background:${priColor}20;color:${priColor}">${po.priority || "—"}</span>
      </div>

      <div class="track-field"><span class="track-label">Submitted by</span><span class="track-value">${po.requestor || "—"}</span></div>
      <div class="track-field"><span class="track-label">Company</span><span class="track-value">${po.company || "—"}</span></div>
      <div class="track-field"><span class="track-label">Quantity</span><span class="track-value">${po.quantity || "—"}</span></div>
      <div class="track-field"><span class="track-label">Request Date</span><span class="track-value">${po.requestDate || "—"}</span></div>
      <div class="track-field"><span class="track-label">Date Needed By</span><span class="track-value">${po.dueDate || "—"}</span></div>
      <div class="track-field"><span class="track-label">Budget Type</span><span class="track-value">${po.budgetType || "—"}</span></div>
      ${po.productLink ? `<div class="track-field"><span class="track-label">Product Link</span><span class="track-value"><a href="${po.productLink}" target="_blank" style="color:#1a56db">View →</a></span></div>` : ""}
      ${po.poCode ? `<div class="track-field"><span class="track-label">PO Code</span><span class="track-value">${po.poCode}</span></div>` : ""}
      ${po.issueDate ? `<div class="track-field"><span class="track-label">PO Issuance Date</span><span class="track-value">${po.issueDate}</span></div>` : ""}
      ${po.deliveryDate ? `<div class="track-field"><span class="track-label">Delivery & Inspection</span><span class="track-value">${po.deliveryDate}</span></div>` : ""}
      ${po.note ? `<div class="track-field"><span class="track-label">Note</span><span class="track-value">${po.note}</span></div>` : ""}

      <div class="timeline">
        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:12px">Progress</div>
        ${timelineHTML}
      </div>
    </div>`;
}
