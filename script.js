// 🔹 URL data CSV (lokal di root repo)
const DATA_URL = "Bank_Soal_ProASN.csv";

let soal = [];
let waktu = 90 * 60; // 90 menit
let timerInt;

// 🔹 Fungsi acak array (Fisher–Yates)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 🔹 Load CSV
async function loadCSV() {
  const res = await fetch(DATA_URL);
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

  // Acak dan ambil maksimal 200
  soal = shuffle(soal).slice(0, 200);
}

// 🔹 Render soal
function tampilSoal() {
  const qDiv = document.getElementById("quiz");
  qDiv.innerHTML = soal
    .map((q, i) => {
      const opsi = shuffle([...q.opsi]);
      return `
        <div class="question">
          <p class="category">[${q.kat} – ${q.sub}]</p>
          <p><b>${i + 1}. ${q.t}</b></p>
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

// 🔹 Timer
function mulaiTimer() {
  const t = document.getElementById("timer");
  timerInt = setInterval(() => {
    let m = Math.floor(waktu / 60),
      s = waktu % 60;
    t.textContent = `Waktu tersisa: ${m}:${s < 10 ? "0" + s : s}`;
    waktu--;
    if (waktu < 0) {
      clearInterval(timerInt);
      selesai();
    }
  }, 1000);
}

// 🔹 Mulai ujian
document.getElementById("startBtn").addEventListener("click", async () => {
  document.getElementById("result").innerHTML = "";
  document.getElementById("startBtn").style.display = "none";

  const qDiv = document.getElementById("quiz");
  qDiv.innerHTML = "<p><i>Memuat soal, harap tunggu sebentar...</i></p>";

  await loadCSV();
  tampilSoal();
  mulaiTimer();
  document.getElementById("submitBtn").style.display = "block";
});

// 🔹 Submit ujian
document.getElementById("submitBtn").addEventListener("click", selesai);

// 🔹 Evaluasi hasil
function selesai() {
  clearInterval(timerInt);
  let benar = 0,
    salah = 0,
    hasil = [];

  soal.forEach((q, i) => {
    const pilih = document.querySelector(`input[name="q${i}"]:checked`);
    if (!pilih) salah++;
    else if (cekBenar(q, pilih.value)) benar++;
    else {
      salah++;
      hasil.push({
        n: i + 1,
        soal: q.t,
        kunci: q.kunci,
        jawab: pilih.value,
      });
    }
  });

  const skor = Math.round((benar / soal.length) * 100);
  let html = `<h3>📊 Skor Anda: ${skor}%</h3><p>✅ Benar: ${benar} | ❌ Salah: ${salah}</p>`;

  if (hasil.length) {
    html += "<h4>Soal yang Salah:</h4><ol>";
    hasil.forEach((s) => {
      html += `<li>${s.soal}<br><small><b>Kunci:</b> ${s.kunci} | <b>Jawaban Anda:</b> ${s.jawab}</small></li>`;
    });
    html += "</ol>";
  } else {
    html += "<p>🎉 Semua jawaban benar — luar biasa!</p>";
  }

  document.getElementById("result").innerHTML = html;
  document.getElementById("quiz").innerHTML = "";
  document.getElementById("submitBtn").style.display = "none";
}

// 🔹 Validasi jawaban (bebas huruf besar kecil)
function cekBenar(q, jawaban) {
  const benar = q.kunci.trim().toUpperCase();
  const opsi = ["A", "B", "C", "D"];
  if (opsi.includes(benar)) {
    const index = opsi.indexOf(benar);
    return jawaban.trim().toUpperCase() === q.opsi[index].trim().toUpperCase();
  }
  return jawaban.trim().toUpperCase() === benar;
}
