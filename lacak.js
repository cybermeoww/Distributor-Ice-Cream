// --- TEMPELKAN firebaseConfig ANDA DI SINI ---
const firebaseConfig = {
  apiKey: "AIzaSyAEfBl_A3leDp8Kb73lI5Y51Sq_OYjLGsU",
  authDomain: "distributoreskrimsaya.firebaseapp.com",
  projectId: "distributoreskrimsaya",
  storageBucket: "distributoreskrimsaya.firebasestorage.app",
  messagingSenderId: "437181740843",
  appId: "1:437181740843:web:41890cdedddc45b903776e",
  measurementId: "G-3YJY51SZ90"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth(); 

// Elemen DOM
const statusArea = document.getElementById('status-area');
const statusTitle = document.getElementById('status-title');
const statusInfo = document.getElementById('status-info');
const statusCoords = document.getElementById('status-coords');
const logoutButton = document.getElementById('sopir-logout-button');

let docRef = null; // Untuk menyimpan referensi dokumen pengiriman yang sedang dilacak
let watchId = null; // Untuk menyimpan ID pelacakan GPS

// --- LOGIKA UTAMA: Cek Status Login Sopir ---
auth.onAuthStateChanged((user) => {
    if (user) {
        // Pengguna sudah login, cari tugas untuk ID sopir ini
        findMyDelivery(user.uid);
    } else {
        // Pengguna tidak login, arahkan ke halaman login
        window.location.href = 'login.html';
    }
});

// 1. Cari pengiriman yang ditugaskan ke Sopir yang sedang login
function findMyDelivery(sopirId) {
    statusArea.style.display = 'block';
    statusTitle.textContent = "MENCARI TUGAS...";
    statusInfo.textContent = "Mencari pengiriman aktif untuk Anda...";
    
    db.collection("pengiriman")
        .where("sopirId", "==", sopirId) // <-- KUNCI: Mencari berdasarkan ID Sopir
        .where("status", "==", "Pending") // Cari yang statusnya "Menunggu Dikirim"
        .limit(1) // Ambil 1 saja (Satu sopir hanya punya satu tugas pending)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                statusTitle.textContent = "TUGAS SELESAI";
                statusInfo.textContent = "Tidak ada pengiriman aktif yang ditugaskan untuk Anda saat ini.";
            } else {
                // Tugas ditemukan!
                const doc = querySnapshot.docs[0];
                docRef = doc.ref; // Simpan referensi dokumen pengiriman
                
                statusTitle.textContent = "MELACAK AKTIF";
                statusInfo.textContent = `Mengirim lokasi untuk rute: ${doc.data().rute}`;
                
                // Mulai pelacakan GPS dan update status di DB
                startWatching();
            }
        })
        .catch(err => {
            statusTitle.textContent = "Error DB";
            statusInfo.textContent = "Gagal mencari tugas dari database. Cek koneksi Anda.";
        });
}


// 2. Fungsi untuk memulai pelacakan GPS (Geolocation API)
function startWatching() {
    if (!navigator.geolocation) {
        statusTitle.textContent = "Error";
        statusInfo.textContent = "Browser Anda tidak mendukung pelacakan lokasi.";
        return;
    }

    if (location.protocol !== 'https:') {
        statusTitle.textContent = "Error";
        statusInfo.textContent = "Pelacakan GPS hanya berfungsi di halaman HTTPS (aman). Deployment wajib di Netlify/Vercel/GitHub Pages.";
        return;
    }
    
    // Matikan pelacakan lama jika ada
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
    }

    watchId = navigator.geolocation.watchPosition(
        (position) => {
            // Berhasil dapat lokasi
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Kirim lokasi ke Firestore (hanya jika ada tugas aktif)
            if (docRef) {
                docRef.update({
                    latitude: lat,
                    longitude: lng,
                    status: "Active", // Otomatis ubah status saat GPS mulai
                    lastUpdate: new Date()
                })
                .then(() => {
                    statusCoords.textContent = `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;
                })
                .catch(err => statusCoords.textContent = "Gagal update lokasi ke database.");
            }
        },
        (error) => {
            // Gagal dapat lokasi
            statusTitle.textContent = "Error GPS";
            statusInfo.textContent = "Gagal mendapatkan lokasi Anda. Pastikan GPS dan izin lokasi aktif.";
            statusCoords.textContent = `Error Code: ${error.code}`;
        },
        {
            enableHighAccuracy: true, 
            timeout: 10000,           
            maximumAge: 0             
        }
    );
}

// 3. Fungsi Logout
logoutButton.addEventListener('click', () => {
    Swal.fire({
        title: 'Konfirmasi Keluar',
        text: "Anda yakin ingin logout? Pelacakan akan dihentikan.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, Logout'
    }).then((result) => {
        if (result.isConfirmed) {
            // Hentikan pelacakan GPS
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
            }
            // Logout dari Firebase Auth
            auth.signOut().then(() => {
                window.location.href = 'login.html';
            });
        }
    });
});