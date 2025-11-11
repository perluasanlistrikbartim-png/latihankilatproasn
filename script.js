console.log("Script.js aktif! Mulai debug...");
// URL file CSV di root repo
const DATA_URL = "Bank_Soal_ProASN.csv";

// variabel utama
let soal = [];
let waktu = 30 * 60; // 30 menit
let timerInt;

// 🔹 Fungsi untuk acak urutan array
function shuffle(arr) {
  return arr
    .map((a) => ({ sort: Math.random(), value: a }))
    .sort((a, b) => a.sort - b.sort)
    .map((a) => a.value);
}

// 🔹 Load CSV & pilih soal proporsional utk Mode Cepat 30 Menit
async function loadCSV() {
  const res = await fetch(DATA_URL + "?v=" + Date.now()); // anti-cache
  const text = await res.text();
  const rows = text.trim().split("\n").slice(1);

  soal = rows.map((r) => {
    const [id, kat, sub, t, a, b, c, d, kunci] = r.split(
      /,(?=(?:[^"]*"[^"]*")*[^"]*$)/
    );
    return {
      id: id?.trim(),
      kat: kat?.trim() || "-",
      sub: sub?.trim() || "-",
      t: t?.trim().replace(/"/g, ""),
      opsi: [a?.trim(), b?.trim(), c?.trim(), d?.trim()],
      kunci: kunci?.trim().replace(/"/g, "").toUpperCase(),
    };
  });

  // 🔹 Kelompokkan per kategori
  const kelompok = {
    "Potensi Psikologis": soal.filter((q) => q.kat === "Potensi Psikologis"),
    "Kompetensi Manajerial": soal.filter((q) => q.kat === "Kompetensi Manajerial"),
    "Kompetensi Sosial Kultural": soal.filter((q) => q.kat === "Kompetensi Sosial Kultural"),
    "Literasi Digital": soal.filter((q) => q.kat === "Literasi Digital"),
    "Preferensi Karier": soal.filter((q) => q.kat === "Preferensi Karier"),
  };

  // 🔹 Proporsi utk mode cepat 30 menit (≈57 soal total)
  const proporsi = {
    "Potensi Psikologis": 14,
    "Kompetensi Manajerial": 14,
    "Kompetensi Sosial Kultural": 11,
    "Literasi Digital": 9,
    "Preferensi Karier": 9,
  };

  // 🔹 Susun soal per kategori, acak di dalamnya
  soal = [];
  for (let k in proporsi) {
    if (kelompok[k] && kelompok[k].length > 0) {
      // Tambahkan header visual kategori
      soal.push({
        isHeader: true,
        kat: k,
      });
      soal.push(...shuffle(kelompok[k]).slice(0, proporsi[k]));
    }
  }
}

// 🔹 Fungsi render soal
function tampilSoal() {
  const qDiv = document.getElementById("quiz");
  qDiv.innerHTML = soal
    .map((q, i) => {
      if (q.isHeader) {
        return `<div class="category-header">${q.kat}</div>`;
      }
      const opsi = shuffle([...q.opsi]);
      return `
        <div class="question">
          <p class="category">[${q.kat} – ${q.sub}]</p>
          <p><b>${i}. ${q.t}</b></p>
          <div class="options">
            ${opsi
              .map(
                (o) =>
                  `<label><input type="radio" name="q${i}" value="${o.trim()}"> ${o.trim()}</label>`
              )
              .join("")}
          </div>
        </div>`;
    })
    .join("");
}
