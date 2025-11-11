console.log("✅ Script.js aktif - FIX soal dobel");
const DATA_URL = "Bank_Soal_ProASN.csv";
let soal = [];
let waktu = 30 * 60;
let timerInt;

// 🔹 Fungsi acak array (Fisher-Yates Shuffle)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 🔹 Load CSV dan parsing bersih
async function loadCSV() {
  console.log("📥 Memuat data CSV...");
  const res = await fetch(DATA_URL + "?v=" + Date.now());
  const text = await res.text();

  // Buang baris kosong dan trim
  const rows = text
    .trim()
    .split(/\r?\n/)
    .filter((r) => r.trim().length > 0)
    .slice(1);

  soal = rows.map((r, i) => {
    const [id, kat, sub, t, a, b, c, d, kunci] = r.split(
      /,(?=(?:[^"]*"[^"]*")*[^"]*$)/
    );
    return {
      id: id?.trim() || (i + 1).toString(),
      kat: kat?.trim() || "-",
      sub: sub?.trim() || "-",
      t: t?.trim().replace(/(^"|"$)/g, ""),
      opsi: [a, b, c, d].map((o) => (o ? o.trim().replace(/(^"|"$)/g, "") : "-")),
      kunci: (kunci || "").trim().replace(/"/g, "").toUpperCase(),
    };
  });

  console.log(`✅ ${soal.length} soal berhasil dimuat`);

  // 🔹 Kelompokkan berdasarkan kategori
  const kelompok = {
    "Potensi Psikologis": soal.filter((q) => q.kat.includes("Psikologis")),
    "Kompetensi Manajerial": soal.filter((q) => q.kat.includes("Manajerial")),
    "Kompetensi Sosial Kultural": soal.filter((q) => q.kat.includes("Sosial")),
    "Literasi Digital": soal.filter((q) => q.kat.includes("Digital")),
    "Preferensi Karier": soal.filter((q) => q.kat.includes("Karier")),
  };

  // 🔹 Proporsi per kategori (mode cepat)
  const proporsi = {
    "Potensi Psikologis": 14,
    "Kompetensi Manajerial": 14,
    "Kompetensi Sosial Kultural": 11,
    "Literasi Digital": 9,
    "Preferensi Karier": 9,
  };

  // 🔹 Susun acak proporsional
  soal = [];
  for (let k in proporsi) {
    if (kelompok[k] && kelompok[k].length > 0) {
      const subset = shuffle([...kelompok[k]]).slice(0, proporsi[k]);
      soal.push({ isHeader: true, kat: k });
      soal.push(...subset);
    }
  }

  console.log(`🎯 Soal final: ${soal.length} butir`);
}

// 🔹 Render soal ke halaman
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
                  `<label><input type="radio" name="q${i}" value="${o}"> ${o}</label>`
              )
              .join("")}
          </div>
        </div>`;
    })
    .join("");
}

// 🔹 Timer berjalan
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

// 🔹 Mulai ujian
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
    quizDiv.innerHTML =
      "<p style='color:red'>❌ Tidak dapat memuat soal. Periksa format CSV.</p>";
  }
}

// 🔹 Event listener siap klik
window.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 Siap digunakan!");
  const startBtn = document.getElementById("startBtn");
  if (startBtn) startBtn.addEventListener("click", mulaiUjian);
});
