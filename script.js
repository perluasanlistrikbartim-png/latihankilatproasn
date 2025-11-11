console.log("✅ Script.js aktif - Mode Cepat 30 menit");
const DATA_URL = "Bank_Soal_ProASN.csv";
let soal = [];
let waktu = 30 * 60; // 30 menit
let timerInt;

function shuffle(arr) {
  return arr.map(a => ({ sort: Math.random(), value: a }))
    .sort((a, b) => a.sort - b.sort)
    .map(a => a.value);
}

async function loadCSV() {
  console.log("📥 Mengambil CSV dari:", DATA_URL);
  const res = await fetch(DATA_URL + "?v=" + Date.now());
  const text = await res.text();
  const rows = text.trim().split("\n").slice(1);
  soal = rows.map(r => {
    const [id, kat, sub, t, a, b, c, d, kunci] = r.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    return {
      id: id?.trim(),
      kat: kat?.trim() || "-",
      sub: sub?.trim() || "-",
      t: t?.trim().replace(/"/g, ""),
      opsi: [a?.trim(), b?.trim(), c?.trim(), d?.trim()],
      kunci: kunci?.trim().replace(/"/g, "").toUpperCase(),
    };
  });
  const kelompok = {
    "Potensi Psikologis": soal.filter(q => q.kat === "Potensi Psikologis"),
    "Kompetensi Manajerial": soal.filter(q => q.kat === "Kompetensi Manajerial"),
    "Kompetensi Sosial Kultural": soal.filter(q => q.kat === "Kompetensi Sosial Kultural"),
    "Literasi Digital": soal.filter(q => q.kat === "Literasi Digital"),
    "Preferensi Karier": soal.filter(q => q.kat === "Preferensi Karier"),
  };
  const proporsi = { "Potensi Psikologis": 14, "Kompetensi Manajerial": 14, "Kompetensi Sosial Kultural": 11, "Literasi Digital": 9, "Preferensi Karier": 9 };
  soal = [];
  for (let k in proporsi) {
    if (kelompok[k] && kelompok[k].length > 0) {
      soal.push({ isHeader: true, kat: k });
      soal.push(...shuffle(kelompok[k]).slice(0, proporsi[k]));
    }
  }
  console.log("✅ Soal dimuat:", soal.length, "butir");
}

function tampilSoal() {
  const qDiv = document.getElementById("quiz");
  qDiv.innerHTML = soal.map((q, i) => {
    if (q.isHeader) return `<div class="category-header">${q.kat}</div>`;
    const opsi = shuffle([...q.opsi]);
    return `
      <div class="question">
        <p class="category">[${q.kat} – ${q.sub}]</p>
        <p><b>${i}. ${q.t}</b></p>
        <div class="options">
          ${opsi.map(o => `<label><input type="radio" name="q${i}" value="${o.trim()}"> ${o.trim()}</label>`).join("")}
        </div>
      </div>`;
  }).join("");
}

function mulaiTimer() {
  const timerDiv = document.getElementById("timer");
  clearInterval(timerInt);
  timerInt = setInterval(() => {
    const m = Math.floor(waktu / 60);
    const s = waktu % 60;
    timerDiv.textContent = `Waktu tersisa: ${m}:${s < 10 ? "0" : ""}${s}`;
    waktu--;
    if (waktu < 0) {
      clearInterval(timerInt);
      document.getElementById("submitBtn").click();
    }
  }, 1000);
}

async function mulaiUjian() {
  const startBtn = document.getElementById("startBtn");
  const submitBtn = document.getElementById("submitBtn");
  const quizDiv = document.getElementById("quiz");
  startBtn.style.display = "none";
  quizDiv.innerHTML = "<p>⏳ Memuat soal...</p>";
  try {
    await loadCSV();
    tampilSoal();
    submitBtn.style.display = "inline-block";
    mulaiTimer();
  } catch (err) {
    console.error("❌ Gagal memuat soal:", err);
    quizDiv.innerHTML = "<p style='color:red'>❌ Tidak dapat memuat soal. Periksa format CSV.</p>";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  if (startBtn) startBtn.addEventListener("click", mulaiUjian);
});
