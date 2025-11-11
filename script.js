console.log("✅ Script.js aktif - Final FIX Soal dan Skor");

const DATA_URL = "./Bank_Soal_ProASN.csv";
let soal = [];
let waktu = 30 * 60; // 30 menit
let timerInt = null;

// ✅ Pastikan CSS terbaru selalu dimuat
document.addEventListener("DOMContentLoaded", () => {
  const link = document.querySelector('link[href*="style.css"]');
  if (link) link.href = "style.css?v=" + Date.now();
});

// 🔹 Fungsi acak array (Fisher-Yates)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function loadCSV() {
  console.log("📥 Memuat CSV...");
  const res = await fetch(DATA_URL + "?v=" + Date.now());

  if (!res.ok) {
    console.error("❌ Tidak bisa mengambil CSV:", res.status, res.statusText);
    throw new Error(`Tidak dapat memuat file CSV (${res.status})`);
  }

  const text = await res.text();
  if (!text || text.trim().length === 0) {
    throw new Error("File CSV kosong atau tidak bisa dibaca");
  }

  const rows = text
    .trim()
    .split(/\r?\n/)
    .filter((r) => r.trim().length > 0)
    .slice(1);
  ...
}

  soal = rows.map((r, i) => {
    const cols = r.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    if (cols.length < 9) return null; // skip rusak
    const [id, kat, sub, t, a, b, c, d, kunci] = cols;
    return {
      id: id?.trim() || (i + 1).toString(),
      kat: kat?.trim() || "-",
      sub: sub?.trim() || "-",
      t: t?.trim().replace(/(^"|"$)/g, ""),
      opsi: [a, b, c, d].map((o) => o?.trim().replace(/(^"|"$)/g, "")),
      kunci: (kunci || "").trim().replace(/"/g, "").toUpperCase(),
    };
  }).filter(Boolean);

  console.log(`✅ ${soal.length} soal berhasil dimuat`);

  if (soal.length === 0) {
    throw new Error("❌ Tidak ada soal valid dalam CSV!");
  }

  // 🔹 Kelompokkan berdasarkan kategori
  const kelompok = {
    "Potensi Psikologis": soal.filter((q) => q.kat.includes("Psikologis")),
    "Kompetensi Manajerial": soal.filter((q) => q.kat.includes("Manajerial")),
    "Kompetensi Sosial Kultural": soal.filter((q) => q.kat.includes("Sosial")),
    "Literasi Digital": soal.filter((q) => q.kat.includes("Digital")),
    "Preferensi Karier": soal.filter((q) => q.kat.includes("Karier")),
  };

  // 🔹 Proporsi per kategori
  const proporsi = {
    "Potensi Psikologis": 14,
    "Kompetensi Manajerial": 14,
    "Kompetensi Sosial Kultural": 11,
    "Literasi Digital": 9,
    "Preferensi Karier": 9,
  };

  // 🔹 Susun acak proporsional
  let soalFinal = [];
  for (let k in proporsi) {
    if (kelompok[k]?.length) {
      soalFinal.push({ isHeader: true, kat: k });
      soalFinal.push(...shuffle(kelompok[k]).slice(0, proporsi[k]));
    }
  }

  soal = soalFinal;
  console.log(`🎯 Total tampil: ${soal.length} butir (termasuk header kategori)`);
}

// 🔹 Render soal
function tampilSoal() {
  const qDiv = document.getElementById("quiz");
  qDiv.innerHTML = soal
    .map((q, i) => {
      if (q.isHeader) {
        return `<div class="category-header">${q.kat}</div>`;
      }
      const opsi = shuffle([...q.opsi]);
      return `
        <div class="question" data-kunci="${q.kunci}">
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

// 🔹 Timer
function mulaiTimer() {
  const timerDiv = document.getElementById("timer");
  clearInterval(timerInt);
  waktu = 30 * 60;
  timerInt = setInterval(() => {
    const m = Math.floor(waktu / 60);
    const s = waktu % 60;
    timerDiv.textContent = `Waktu tersisa: ${m}:${s < 10 ? "0" : ""}${s}`;
    waktu--;
    if (waktu < 0) {
      clearInterval(timerInt);
      hitungSkor();
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
    console.error(err);
    quizDiv.innerHTML =
      "<p style='color:red'>❌ Gagal memuat soal. Coba muat ulang halaman.</p>";
  }
}

// 🔹 Hitung Skor
function hitungSkor() {
  clearInterval(timerInt);
  let benar = 0;
  let total = 0;
  const resultDiv = document.getElementById("result");

  document.querySelectorAll(".question").forEach((div, i) => {
    const key = div.dataset.kunci;
    if (!key) return; // skip header
    total++;
    const ans = document.querySelector(`input[name="q${i}"]:checked`);
    const selected = ans ? ans.value.trim().toUpperCase() : "";
    const correct = key.trim().toUpperCase();
    if (selected === correct) {
      benar++;
      div.classList.add("benar");
    } else {
      div.classList.add("salah");
    }
  });

  const skor = benar * 4;
  const max = total * 4;
  const persen = total > 0 ? ((skor / max) * 100).toFixed(1) : 0;

  resultDiv.innerHTML = `
    <div class="hasil-akhir">
      <h2>✅ Ujian Selesai</h2>
      <p>Nilai Anda: <b>${skor}</b> dari maksimum ${max} poin</p>
      <p>Persentase benar: <b>${persen}%</b></p>
    </div>
  `;

  document.getElementById("submitBtn").style.display = "none";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// 🔹 Event handler
window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const submitBtn = document.getElementById("submitBtn");
  if (startBtn) startBtn.addEventListener("click", mulaiUjian);
  if (submitBtn) submitBtn.addEventListener("click", hitungSkor);
});
