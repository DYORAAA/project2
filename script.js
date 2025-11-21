/* script.js */

/* ---------- AUTH ---------- */
function cekLogin() {
  if (localStorage.getItem('login') !== 'true') {
    window.location.href = 'index.html';
  }
}
function logout() {
  localStorage.removeItem('login');
  window.location.href = 'index.html';
}

/* ---------- DATA STORAGE (localStorage) ---------- */
const LS_KEY = 'inventarisTKJ';
let data = JSON.parse(localStorage.getItem(LS_KEY)) || [];

// simpan ke localStorage
function simpanLocal() {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

/* ---------- UTIL: convert file -> base64 ---------- */
function toBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------- UTIL: buat QR (gambar dari layanan qrserver) ---------- */
function buatQR(kode) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(kode)}`;
}

/* ---------- TAMPILKAN DATA ---------- */
function tampilkanData() {
  const tbody = document.getElementById('tabel-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  data.forEach((item, index) => {
    tbody.innerHTML += `
      <tr>
        <td style="display:flex;flex-direction:column;align-items:center;gap:6px">
          <img src="${item.foto || ''}" alt="-" />
          <img src="${item.qr || buatQR(item.kode)}" style="width:70px;" />
        </td>
        <td>${item.nisn || ''}</td>
        <td>${item.nama}</td>
        <td>${item.kode}</td>
        <td>${item.jumlah}</td>
        <td>${item.status}</td>
        <td>
          <button class="aksi-btn edit" onclick="editData(${index})">Edit</button>
          <button class="aksi-btn hapus" onclick="hapusData(${index})">Hapus</button>
          <button class="aksi-btn notif" onclick="triggerNotifPinjam(${index})">Notif Pinjam</button>
          <button class="aksi-btn notif" onclick="triggerNotifRusak(${index})">Notif Rusak</button>
          ${item.status === 'Dipinjam' ? `<button class="aksi-btn" onclick="kembalikanData(${index})">Kembalikan</button>` : ''}
        </td>
      </tr>
    `;
  });

  hitungStatistik();
}

/* ---------- HITUNG STATISTIK ---------- */
function hitungStatistik() {
  document.getElementById('total').innerText = data.length;
  document.getElementById('baik').innerText = data.filter(i => i.status === 'Baik').length;
  document.getElementById('rusak').innerText = data.filter(i => i.status === 'Rusak').length;
  document.getElementById('pinjam').innerText = data.filter(i => i.status === 'Dipinjam').length;
}

/* ---------- RESET FORM ---------- */
function resetForm() {
  const form = document.getElementById('form');
  form.reset();
  // hapus atribut editIndex jika ada
  form.removeAttribute('data-edit-index');
}

/* ---------- TAMBAH / SIMPAN DATA (FORM) ---------- */
document.getElementById('form')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const nisn = document.getElementById('nisn').value.trim();
  const nama = document.getElementById('nama').value.trim();
  const kode = document.getElementById('kode').value.trim();
  const jumlah = Number(document.getElementById('jumlah').value);
  const status = document.getElementById('status').value;
  const fotoInput = document.getElementById('foto').files[0];

  if (!nama || !kode) {
    alert('Nama dan Kode wajib diisi');
    return;
  }

  // convert foto
  let fotoBase64 = '';
  try {
    fotoBase64 = await toBase64(fotoInput);
  } catch (err) {
    console.warn('Error convert foto:', err);
    fotoBase64 = '';
  }

  const barang = {
    nisn: nisn || '',
    nama,
    kode,
    jumlah,
    status,
    foto: fotoBase64,
    qr: buatQR(kode)
  };

  // cek edit mode
  const form = document.getElementById('form');
  const editIndex = form.getAttribute('data-edit-index');

    if (editIndex !== null) {
    const idx = Number(editIndex);
    const prev = data[idx];
    data[idx] = barang;
    form.removeAttribute('data-edit-index');
    // versi sebelum perubahan: tidak mencatat riwayat otomatis di sini
  } else {
    // push baru
    data.push(barang);
    // versi sebelum perubahan: tidak mencatat riwayat otomatis di sini
  }

  simpanLocal();
  resetForm();
  tampilkanData();
});

/* ---------- HAPUS ---------- */
function hapusData(index) {
  if (!confirm('Hapus item ini?')) return;
  const item = data[index];
  data.splice(index, 1);
  // versi sebelum perubahan: tidak mencatat riwayat otomatis di sini
  simpanLocal();
  tampilkanData();
}

/* ---------- EDIT ---------- */
function editData(index) {
  const item = data[index];
  document.getElementById('nisn').value = item.nisn || '';
  document.getElementById('nama').value = item.nama;
  document.getElementById('kode').value = item.kode;
  document.getElementById('jumlah').value = item.jumlah;
  document.getElementById('status').value = item.status;
  // simpan index edit di form attribute
  document.getElementById('form').setAttribute('data-edit-index', index);
}

/* ---------- TRIGGER NOTIF (memanggil notif.js) ---------- */
function triggerNotifPinjam(index) {
  const item = data[index];
  const peminjam = prompt(`Masukkan nama peminjam untuk "${item.nama}"`);
  if (!peminjam) return;
  // ubah status
  item.status = 'Dipinjam';
  simpanLocal();
  tampilkanData();
  if (typeof window.notifPinjam === 'function') {
    window.notifPinjam(item.nama, peminjam, item.kode);
  } else {
    alert('Fungsi notifikasi tidak tersedia.');
  }

  // versi sebelum perubahan: tidak mencatat riwayat peminjaman otomatis
}

function triggerNotifRusak(index) {
  const item = data[index];
  const keterangan = prompt(`Deskripsikan kerusakan untuk "${item.nama}"`);
  if (!keterangan) return;
  // ubah status
  item.status = 'Rusak';
  simpanLocal();
  tampilkanData();
  if (typeof window.notifRusak === 'function') {
    window.notifRusak(item.nama, keterangan, item.kode);
  } else {
    alert('Fungsi notifikasi tidak tersedia.');
  }

  // versi sebelum perubahan: tidak mencatat riwayat kerusakan otomatis
}

// kembalikan barang yang sedang dipinjam
function kembalikanData(index) {
  if (!confirm('Kembalikan barang ini?')) return;
  const item = data[index];
  // ubah status menjadi Baik saat dikembalikan
  const prevPeminjam = null;
  item.status = 'Baik';
  simpanLocal();
  tampilkanData();

  // kirim notifikasi kembali (opsional jika tersedia)
  if (typeof window.notifKembali === 'function') {
    window.notifKembali(item.nama, item.kode);
  }

  // versi sebelum perubahan: tidak mencatat riwayat pengembalian otomatis
}

/* ---------- KONFIRMASI PINJAM BERDASARKAN KODE (untuk scanner) ---------- */
window.konfirmasiPinjamByKode = function(kode, peminjam) {
  const idx = data.findIndex(d => d.kode === kode);
  if (idx === -1) {
    alert('Barang dengan kode tersebut tidak ditemukan.');
    return;
  }
  data[idx].status = 'Dipinjam';
  simpanLocal();
  tampilkanData();
  if (typeof window.notifPinjam === 'function') {
    window.notifPinjam(data[idx].nama, peminjam, data[idx].kode);
  }
  // versi sebelum perubahan: tidak mencatat riwayat dari scanner
};

/* ---------- ON SCAN SUCCESS (dipanggil oleh qr-scanner.html) ---------- */
window.onScanSuccess = function(decodedText) {
  // tampilkan hasil di halaman scanner (qr-scanner.html) jika ada
  try {
    const barang = data.find(b => b.kode === decodedText);
    const elKode = document.getElementById('hasil_kode');
    const elNama = document.getElementById('hasil_nama');
    const elStatus = document.getElementById('hasil_status');
    const elJumlah = document.getElementById('hasil_jumlah');
    if (elKode) elKode.innerText = decodedText;
    if (!barang) {
      if (elNama) elNama.innerText = 'Tidak ditemukan';
      if (elStatus) elStatus.innerText = '-';
      if (elJumlah) elJumlah.innerText = '-';
    } else {
      if (elNama) elNama.innerText = barang.nama;
      if (elStatus) elStatus.innerText = barang.status;
      if (elJumlah) elJumlah.innerText = barang.jumlah;
    }
  } catch (e) {
    console.error('onScanSuccess error', e);
  }
};

/* ---------- inisialisasi awal ---------- */
tampilkanData();
