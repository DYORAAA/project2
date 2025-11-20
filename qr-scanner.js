// qr-scanner.js
// Handles QR camera init and scan callbacks for qr-scanner.html
(function(){
  // simple cekLogin fallback (mirrors behavior in script.js)
  function cekLogin() {
    if (localStorage.getItem('login') !== 'true') {
      window.location.href = 'index.html';
    }
  }

  // expose init function
  let html5QrScannerPage;

  window.initScannerPage = async function() {
    cekLogin();
    html5QrScannerPage = new Html5Qrcode("reader");
    try {
      const devices = await Html5Qrcode.getCameras();
      const sel = document.getElementById('cameraSelect');
      sel.innerHTML = '';
      devices.forEach((d, i) => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.text = d.label || `Camera ${i+1}`;
        sel.appendChild(opt);
      });
      if (devices.length) {
        startQrCamera(devices[0].id);
        sel.value = devices[0].id;
      }
      sel.onchange = () => {
        const id = sel.value;
        switchQrCamera(id);
      };
    } catch (err) {
      startQrCamera({ facingMode: "environment" });
    }
  };

  function startQrCamera(cameraIdOrConfig) {
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    html5QrScannerPage.start(
      cameraIdOrConfig,
      config,
      (decodedText, decodedResult) => {
        if (typeof window.onScanSuccess === 'function') {
          window.onScanSuccess(decodedText);
        } else {
          const el = document.getElementById('hasil_kode');
          if (el) el.innerText = decodedText;
        }
      },
      (error) => {
        // ignore minor errors
      }
    ).catch(e => console.error('Start QR error', e));
  }

  window.switchQrCamera = async function(newId) {
    try { await html5QrScannerPage.stop(); } catch(e){}
    startQrCamera(newId);
  };

  window.stopQrCamera = function() {
    if (html5QrScannerPage) html5QrScannerPage.stop().catch(e => console.warn('Stop error', e));
  };

  window.confirmPinjamFromScanner = function() {
    const kode = document.getElementById('hasil_kode').innerText;
    if (!kode || kode === '-') { alert('Belum ada hasil scan'); return; }
    const peminjam = prompt('Masukkan nama peminjam:');
    if (!peminjam) return;
    if (typeof window.konfirmasiPinjamByKode === 'function') {
      window.konfirmasiPinjamByKode(kode, peminjam);
    } else {
      alert('Fungsi peminjaman tidak tersedia. Kembali ke dashboard.');
    }
  };

  const resultEl = document.getElementById('scan-result');
  const useBtn = document.getElementById('use-btn');
  const stopBtn = document.getElementById('stop-btn');
  const cancelBtn = document.getElementById('cancel-btn');

  let lastText = null;
  const html5QrCode = new Html5Qrcode("reader");

  function onScanSuccess(decodedText, decodedResult) {
    lastText = decodedText;
    resultEl.textContent = decodedText;
    useBtn.disabled = false;
    html5QrCode.stop().then(() => {}).catch(() => {});
  }

  function onScanFailure(error) {
    // no-op
  }

  // Start camera
  Html5Qrcode.getCameras().then(cameras => {
    const cameraId = cameras && cameras.length ? cameras[0].id : null;
    if (!cameraId) {
      resultEl.textContent = 'Kamera tidak ditemukan.';
      return;
    }
    html5QrCode.start(cameraId, { fps: 10, qrbox: { width: 300, height: 300 } }, onScanSuccess, onScanFailure)
      .catch(err => {
        resultEl.textContent = 'Gagal memulai kamera: ' + err;
      });
  }).catch(err => {
    resultEl.textContent = 'Akses kamera gagal: ' + err;
  });

  useBtn.addEventListener('click', () => {
    if (!lastText) return;
    localStorage.setItem('lastScan', lastText);
    window.location.href = 'dashboard.html';
  });

  stopBtn.addEventListener('click', () => {
    html5QrCode.stop().then(() => {
      resultEl.textContent = 'Scanner dihentikan.';
    }).catch(err => resultEl.textContent = 'Gagal menghentikan: ' + err);
  });

  cancelBtn.addEventListener('click', () => {
    try { html5QrCode.stop(); } catch (e) {}
    window.location.href = 'dashboard.html';
  });

  // Pastikan saat keluar, kamera dimatikan
  window.addEventListener('beforeunload', () => {
    try { html5QrCode.stop(); } catch (e) {}
  });

})();
