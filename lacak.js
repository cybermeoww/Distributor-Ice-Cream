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
// ----------------------------------------------

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Elemen DOM
const lacakForm = document.getElementById('lacak-form');
const kodeLacakInput = document.getElementById('kode-lacak');
const statusArea = document.getElementById('status-area');
const statusTitle = document.getElementById('status-title');
const statusInfo = document.getElementById('status-info');
const statusCoords = document.getElementById('status-coords');

let docRef = null; // Untuk menyimpan referensi dokumen pengiriman

// Saat Sopir menekan "Mulai Melacak"
lacakForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const kode = kodeLacakInput.value.trim().toUpperCase();

    // Cari di koleksi 'pengiriman' yang punya kode ini
    db.collection("pengiriman").where("kodeLacak", "==", kode).get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                Swal.fire('Error', 'Kode Lacak tidak ditemukan.', 'error');
            } else {
                // Kode ditemukan!
                const doc = querySnapshot.docs[0];
                docRef = doc.ref; // Simpan referensi dokumen
                
                // Tampilkan status
                lacakForm.style.display = 'none';
                statusArea.style.display = 'block';
                statusInfo.textContent = `Melacak pengiriman untuk: ${doc.data().sopir}`;
                
                // Mulai pelacakan GPS
                startWatching();
            }
        })
        .catch(err => Swal.fire('Error', err.message, 'error'));
});

// Fungsi untuk memulai pelacakan GPS
function startWatching() {
    if (!navigator.geolocation) {
        statusTitle.textContent = "Error";
        statusInfo.textContent = "Browser Anda tidak mendukung pelacakan lokasi.";
        return;
    }

    // WAJIB HTTPS
    if (location.protocol !== 'https:') {
        statusTitle.textContent = "Error";
        statusInfo.textContent = "Pelacakan GPS hanya berfungsi di halaman HTTPS (aman).";
        return;
    }

    navigator.geolocation.watchPosition(
        (position) => {
            // Berhasil dapat lokasi
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Kirim lokasi ke Firestore
            if (docRef) {
                docRef.update({
                    latitude: lat,
                    longitude: lng,
                    lastUpdate: new Date()
                })
                .then(() => {
                    statusCoords.textContent = `Coords: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                })
                .catch(err => statusCoords.textContent = "Gagal update ke DB.");
            }
        },
        (error) => {
            // Gagal dapat lokasi
            statusTitle.textContent = "Error GPS";
            statusInfo.textContent = "Gagal mendapatkan lokasi Anda. Pastikan GPS dan izin lokasi aktif.";
        },
        {
            enableHighAccuracy: true, // GPS Akurasi tinggi
            timeout: 10000,           // Batas waktu 10 detik
            maximumAge: 0             // Jangan pakai cache lokasi
        }
    );
}