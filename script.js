console.log("✅ Script.js aktif - Final HOTS ProASN");

// 🔹 Baca CSV utama (ubah sesuai nama file bank soal)
const DATA_URL = "Bank_Soal_ProASN_v2.csv";

// 🔹 Pastikan CSS terbaru dimuat (anti-cache)
document.addEventListener("DOMContentLoaded", () => {
  const link = document.querySelector('link[href*="style.css"]');
  if (link) link.href = "style.css?v=" + Date.now();
});

let soal = [];
let waktu = 30 * 60; // 30 menit
let timerInt = null;

// 🔹 Fungsi acak array (Fisher-Yates)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 🔹 Load dan parsing CSV
async function loadCSV() {
  console.log("📥 Memuat CSV:", DATA_URL);
  const res = await fetch(DATA_URL + "?v=" + Date.now());
  const text = await res.text();

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

  // 🔹 Acak dan pilih proporsional (mode cepat)
  const kelompok = {
    "Potensi Psikologis": soal.filter((q) => q.kat.includes("Psikologis")),
    "Kompetensi Manajerial": soal.filter((q) => q.kat.includes("Manajerial")),
    "Kompetensi Sosial Kultural": soal.filter((q) => q.kat.includes("Sosial")),
    "Literasi Digital": soal.filter((q) => q.kat.includes("Digital")),
    "Preferensi Karier": soal.filter((q) => q.kat.includes("Karier")),
  };

  const proporsi = {
    "Potensi Psikologis": 14,
    "Kompetensi Manajerial": 14,
    "Kompetensi Sosial Kultural": 11,
    "Literasi Digital": 9,
    "Preferensi Karier": 9,
  };

  soal = [];
  for (let k in proporsi) {
    if (kelompok[k] && kelompok[k].length > 0) {
      soal.push({ isHeader: true, kat: k });
      soal.push(...shuffle(kelompok[k]).slice(0, proporsi[k]));
    }
  }

  console.log(`🎯 Soal final: ${soal.length} butir`);
}

// 🔹 Render soal ke HTML
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

// 🔹 Timer 30 menit
function mulaiTimer() {
  const timerDiv = document.getElementById("timer");
  clearInterval(timerInt);
  waktu = 30 * 60; // reset
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
    console.error("❌ Gagal memuat soal:", err);
    quizDiv.innerHTML =
      "<p style='color:red'>❌ Tidak dapat memuat soal. Periksa format CSV.</p>";
  }
}

// 🔹 Hitung skor akhir
function hitungSkor() {
  clearInterval(timerInt);
  let skor = 0;
  let total = 0;
  const resultDiv = document.getElementById("result");
  const soalDivs = document.querySelectorAll(".question");

  soal.forEach((q, i) => {
    if (q.isHeader) return;
    total++;
    const ans = document.querySelector(`input[name="q${i}"]:checked`);
    const benar = q.kunci.trim().toUpperCase();
    if (ans && ans.value.trim().toUpperCase() === benar) {
      skor += 4; // poin benar
      soalDivs[i].classList.add("benar");
    } else {
      soalDivs[i].classList.add("salah");
    }
  });

  resultDiv.innerHTML = `
    <h2>✅ Ujian Selesai</h2>
    <p>Nilai Anda: <b>${skor}</b> dari maksimum ${total * 4} poin</p>
    <p>Persentase benar: ${(skor / (total * 4) * 100).toFixed(1)}%</p>
  `;
  document.getElementById("submitBtn").style.display = "none";
}

// 🔹 Event siap pakai
window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const submitBtn = document.getElementById("submitBtn");

  if (startBtn) startBtn.addEventListener("click", mulaiUjian);
  if (submitBtn) submitBtn.addEventListener("click", hitungSkor);
});
