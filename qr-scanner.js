// qr-scanner.js
// Handles QR camera init and scan callbacks for qr-scanner.html

(function() {
    let html5QrScannerPage = null;
    let isScanning = false;

    // Cek login sederhana
    function cekLogin() {
        if (localStorage.getItem('login') !== 'true') {
            // Jika di tes lokal tanpa login, remark baris bawah ini
            // window.location.href = 'index.html'; 
        }
    }

    // Fungsi untuk mencari data barang berdasarkan kode (Simulasi Database)
    function cariBarang(kode) {
        // 1. Coba ambil dari LocalStorage 'barang_inventory' (jika ada)
        const storedData = localStorage.getItem('barang_inventory');
        let barang = null;

        if (storedData) {
            const dataBarang = JSON.parse(storedData);
            barang = dataBarang.find(b => b.kode === kode);
        }

        // 2. Jika tidak ada database, return object dummy atau null
        // Anda harus menyesuaikan bagian ini dengan sumber data asli Anda
        if (!barang) {
            return null; 
        }
        return barang;
    }

    window.initScannerPage = async function() {
        cekLogin();
        
        // Pastikan instance bersih sebelum mulai
        if(html5QrScannerPage) {
            try { await html5QrScannerPage.stop(); } catch(e){}
        }
        
        html5QrScannerPage = new Html5Qrcode("reader");

        try {
            const devices = await Html5Qrcode.getCameras();
            const sel = document.getElementById('cameraSelect');
            sel.innerHTML = '';

            if (devices && devices.length) {
                devices.forEach((d, i) => {
                    const opt = document.createElement('option');
                    opt.value = d.id;
                    opt.text = d.label || `Kamera ${i + 1}`;
                    sel.appendChild(opt);
                });

                // Pilih kamera belakang secara default jika ada
                const backCam = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('belakang'));
                const initialCamId = backCam ? backCam.id : devices[0].id;
                
                sel.value = initialCamId;
                startQrCamera(initialCamId);
            } else {
                // Fallback jika device array kosong tapi izin diberikan
                startQrCamera({ facingMode: "environment" });
            }

            sel.onchange = () => {
                if(isScanning) {
                   stopQrCamera().then(() => {
                       startQrCamera(sel.value);
                   });
                } else {
                    startQrCamera(sel.value);
                }
            };

        } catch (err) {
            console.error("Error akses kamera:", err);
            alert("Gagal mengakses kamera. Pastikan izin diberikan dan menggunakan HTTPS.");
        }
    };

    window.startQrCamera = function(cameraIdOrConfig) {
        isScanning = true;
        
        // Konfigurasi agar responsif di HP
        const config = {
            fps: 10,
            qrbox: function(viewfinderWidth, viewfinderHeight) {
                const minEdgePercentage = 0.70; // 70% dari lebar/tinggi terkecil
                const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
                return {
                    width: qrboxSize,
                    height: qrboxSize
                };
            }
        };

        html5QrScannerPage.start(
            cameraIdOrConfig,
            config,
            (decodedText, decodedResult) => {
                // --- SUKSES SCAN ---
                console.log(`Code scanned = ${decodedText}`, decodedResult);
                
                // 1. Isi Kode
                document.getElementById('hasil_kode').innerText = decodedText;

                // 2. Cari detail barang (Nama, Status, dll)
                const item = cariBarang(decodedText);
                
                if (item) {
                    document.getElementById('hasil_nama').innerText = item.nama || '-';
                    document.getElementById('hasil_status').innerText = item.status || '-';
                    document.getElementById('hasil_jumlah').innerText = item.jumlah || '-';
                } else {
                    document.getElementById('hasil_nama').innerText = 'Tidak Ditemukan';
                    document.getElementById('hasil_status').innerText = '-';
                    document.getElementById('hasil_jumlah').innerText = '-';
                }

                // Opsional: Stop scanning setelah dapat hasil agar hemat baterai
                // window.stopQrCamera(); 
                // alert("Berhasil Scan: " + decodedText);
            },
            (errorMessage) => {
                // Abaikan error scanning frame kosong
            }
        ).catch(err => {
            console.error("Start failed", err);
            isScanning = false;
        });
    };

    window.stopQrCamera = async function() {
        if (html5QrScannerPage && isScanning) {
            try {
                await html5QrScannerPage.stop();
                isScanning = false;
                console.log("Kamera berhenti.");
            } catch (e) {
                console.warn('Stop error', e);
            }
        }
    };

    window.switchQrCamera = function(newId) {
        window.stopQrCamera().then(() => {
            window.startQrCamera(newId);
        });
    };

    window.confirmPinjamFromScanner = function() {
        const kode = document.getElementById('hasil_kode').innerText;
        const namaBarang = document.getElementById('hasil_nama').innerText;

        if (!kode || kode === '-' || namaBarang === 'Tidak Ditemukan') {
            alert('Scan barang yang valid terlebih dahulu!');
            return;
        }

        const peminjam = prompt(`Meminjam ${namaBarang} (${kode}).\nMasukkan nama peminjam:`);
        if (!peminjam) return;

        // Cek apakah fungsi global tersedia (dari script.js lain)
        if (typeof window.konfirmasiPinjamByKode === 'function') {
            window.konfirmasiPinjamByKode(kode, peminjam);
        } else {
            // Fallback jika fungsi global belum ada
            console.log("Fungsi konfirmasiPinjamByKode tidak ditemukan, melakukan log manual.");
            alert(`Simulasi: Peminjaman ${namaBarang} oleh ${peminjam} berhasil dicatat.`);
            // Redirect kembali ke dashboard
            window.location.href = 'dashboard.html';
        }
    };

})();