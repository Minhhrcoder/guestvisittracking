const BASE_URL = window.location.href.replace("qrcodes.html", "guest.html");

const offices = [
  { loc: "HCM", label: "Ho Chi Minh City", color: "#1e40af", bg: "#dbeafe", emoji: "🏙️" },
  { loc: "DN",  label: "Da Nang",          color: "#6b21a8", bg: "#f3e8ff", emoji: "🌊" },
  { loc: "HN",  label: "Ha Noi",           color: "#166534", bg: "#dcfce7", emoji: "🏛️" },
  { loc: "Hue", label: "Hue",              color: "#dc2626", bg: "#fee2e2", emoji: "🌸" },
];

const grid = document.getElementById("qr-grid");

async function renderAll() {
  for (const o of offices) {
    const url = `${BASE_URL}?loc=${o.loc}`;
    const card = document.createElement("div");
    card.className = "qr-card";
    card.innerHTML = `
      <div style="font-size:32px;margin-bottom:6px">${o.emoji}</div>
      <h3 style="color:${o.color}">${o.label}</h3>
      <p>Scan to register your visit</p>
      <img id="qr-img-${o.loc}" style="border-radius:8px;width:200px;height:200px" />
      <p style="font-size:11px;color:#9ca3af;margin-top:10px;word-break:break-all">${url}</p>
      <a href="${url}" target="_blank" style="display:inline-block;margin-top:8px;font-size:12px;color:${o.color}">Open link →</a>
    `;
    grid.appendChild(card);

    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 200,
        color: { dark: o.color, light: "#ffffff" },
      });
      document.getElementById(`qr-img-${o.loc}`).src = dataUrl;
    } catch (err) {
      console.error("QR error for", o.loc, err);
    }
  }
}

renderAll();
