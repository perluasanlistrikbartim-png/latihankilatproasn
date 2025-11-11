console.log("✅ Script.js aktif");
const DATA_URL = "./Bank_Soal_ProASN_v2.csv";
let soal = [];
let waktu = 30 * 60; // 30 menit
let timerInt;

// 🔸 Fisher-Yates Shuffle
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 🔸 Memuat CSV
async function loadCSV() {
  console.log("📥 Memuat CSV...");
  const res = await fetch(DATA_URL + "?v=" + Date.now());
  if (!res.ok) throw new Error(`Tidak bisa ambil CSV (${res.status})`);

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
      id: id?.trim() || i + 1,
      kat: kat?.trim(),
      sub: sub?.trim(),
      t: t?.trim().replace(/(^"|"$)/g, ""),
      opsi: [a, b, c, d].map((o) => o?.trim().replace(/(^"|"$)/g, "")),
      kunci: (kunci || "").trim().replace(/"/g, "").toUpperCase(),
    };
  });

  console.log(`✅ ${soal.length} soal dimuat`);
  soal = shuffle(soal).slice(0, 57); // Ambil 57 acak (mode cepat)
}

// 🔸 Render soal
function tampilSoal() {
  const qDiv = document.getElementById("quiz");
  qDiv.innerHTML = soal
    .map(
      (q, i) => `
      <div class="question">
        <p class="category">[${q.kat} – ${q.sub}]</p>
        <p><b>${i + 1}. ${q.t}</b></p>
        <div class="options">
          ${shuffle(q.opsi)
            .map(
              (o) =>
                `<label><input type="radio" name="q${i}" value="${o}"> ${o}</label>`
            )
            .join("")}
        </div>
      </div>`
    )
    .join("");
}

// 🔸 Timer
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
      hitungNilai();
    }
  }, 1000);
}

// 🔸 Hitung nilai
function hitungNilai() {
  const resultDiv = document.getElementById("result");
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.style.display = "none";

  let benar = 0;
  soal.forEach((q, i) => {
    const jawaban = document.querySelector(`input[name="q${i}"]:checked`);
    if (jawaban && jawaban.value.trim().toUpperCase() === q.kunci) benar++;
  });

  const total = soal.length;
  const persen = ((benar / total) * 100).toFixed(1);
  resultDiv.innerHTML = `
    <div class="hasil">
      <h2>✅ Ujian Selesai</h2>
      <p>Benar: ${benar} / ${total}</p>
      <p>Persentase: <b>${persen}%</b></p>
    </div>`;
}

// 🔸 Mulai ujian
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
    quizDiv.innerHTML = `<p style="color:red">❌ Gagal memuat soal: ${err.message}</p>`;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const submitBtn = document.getElementById("submitBtn");
  startBtn.addEventListener("click", mulaiUjian);
  submitBtn.addEventListener("click", hitungNilai);
});
