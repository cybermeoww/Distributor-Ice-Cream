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
const auth = firebase.auth();
const db = firebase.firestore();

// Elemen DOM
const logoutButton = document.getElementById('admin-logout-button');

// --- Keamanan Admin ---
auth.onAuthStateChanged((user) => {
    if (user) {
        if (user.email !== 'admin123@gmail.com' && user.email !== 'superadmin@gmail.com') {
            alert("Akses ditolak.");
            window.location.href = 'index.html'; 
        }
    } else {
        alert("Silakan login sebagai Admin.");
        window.location.href = 'login.html'; 
    }
});

// --- LOGOUT ---
logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
});

// --- BLOK KODE PROTEKSI MENU (BARU - DENGAN REVEAL PASSWORD) ---
// (Anda akan menempelkan kode dari Langkah 6 di sini)
// --- BLOK KODE PROTEKSI MENU (FINAL - DENGAN DASHBOARD) ---
document.addEventListener('DOMContentLoaded', () => {
    // Tunggu firebase auth siap
    firebase.auth().onAuthStateChanged(user => {
        if (!user) return; // Jika tidak ada user, hentikan
        
        const currentUserEmail = user.email;

        // 1. Fungsi Pop-up (Dengan Ikon Mata)
        async function showPasswordPopup(menuTitle, menuFieldName, targetUrl) {
            // Cek apakah sudah di halaman tujuan
            if (window.location.pathname.endsWith(targetUrl)) {
                return; 
            }
            
            // --- LOGIKA BYPASS SUPER ADMIN ---
            if (currentUserEmail === 'superadmin@gmail.com') {
                window.location.href = targetUrl; // Langsung pindah
                return; 
            }

            // Ambil password dari Firestore
            let correctPassword;
            try {
                const doc = await db.collection("dashboard_data").doc("menu_passwords").get();
                if (!doc.exists) {
                    Swal.fire('Error', 'Dokumen password tidak ditemukan!', 'error');
                    return;
                }
                correctPassword = doc.data()[menuFieldName];
            } catch (e) {
                Swal.fire('Error DB', e.message, 'error');
                return;
            }

            // Tampilkan pop-up
            const { value: password } = await Swal.fire({
                title: `Akses Terbatas`,
                text: `Masukkan password untuk membuka ${menuTitle}:`,
                html: `
                    <div style="position: relative;">
                        <input type="password" id="swal-password-input" class="swal2-input" placeholder="Masukkan password..." style="padding-right: 45px;">
                        <span id="swal-toggle-password" style="position: absolute; right: 25px; top: 50%; transform: translateY(-50%); cursor: pointer; z-index: 10; color: #555;">
                            <i class="fas fa-eye" id="swal-eye-icon"></i>
                        </span>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Buka',
                cancelButtonText: 'Batal',
                allowOutsideClick: false,
                didOpen: () => {
                    const passwordInput = document.getElementById('swal-password-input');
                    const toggleButton = document.getElementById('swal-toggle-password');
                    const eyeIcon = document.getElementById('swal-eye-icon');
                    toggleButton.addEventListener('click', () => {
                        if (passwordInput.type === 'password') {
                            passwordInput.type = 'text';
                            eyeIcon.classList.remove('fa-eye');
                            eyeIcon.classList.add('fa-eye-slash');
                        } else {
                            passwordInput.type = 'password';
                            eyeIcon.classList.remove('fa-eye-slash');
                            eyeIcon.classList.add('fa-eye');
                        }
                    });
                    passwordInput.focus();
                },
                preConfirm: () => {
                    const pass = document.getElementById('swal-password-input').value;
                    if (pass === correctPassword) {
                        return true;
                    } else {
                        Swal.showValidationMessage(`Password salah!`);
                        return false;
                    }
                }
            });

            if (password) {
                window.location.href = targetUrl;
            }
        }

        // 3. Pasang Listener ke Semua 6 Tombol Menu yang Dilindungi
        
        // --- TAMBAHKAN LISTENER DASHBOARD INI ---
        const menuDashboard = document.getElementById('menu-dashboard');
        if (menuDashboard) {
            menuDashboard.addEventListener('click', (e) => {
                e.preventDefault();
                showPasswordPopup('Dashboard', 'dashboard', 'admin-dashboard.html');
            });
        }
        
        const menuPesanan = document.getElementById('menu-pesanan');
        if (menuPesanan) {
            menuPesanan.addEventListener('click', (e) => {
                e.preventDefault();
                showPasswordPopup('Manajemen Pesanan', 'pesanan', 'pesanan.html');
            });
        }

        const menuProduk = document.getElementById('menu-produk');
        if (menuProduk) {
            menuProduk.addEventListener('click', (e) => {
                e.preventDefault();
                showPasswordPopup('Manajemen Produk', 'produk', 'produk.html');
            });
        }

        const menuStok = document.getElementById('menu-stok');
        if (menuStok) {
            menuStok.addEventListener('click', (e) => {
                e.preventDefault();
                showPasswordPopup('Manajemen Stok', 'stok', 'stok.html');
            });
        }
        
        const menuCabang = document.getElementById('menu-cabang');
        if (menuCabang) {
            menuCabang.addEventListener('click', (e) => {
                e.preventDefault();
                showPasswordPopup('Manajemen Cabang', 'cabang', 'cabang.html');
            });
        }
        
        const menuPengiriman = document.getElementById('menu-pengiriman');
        if (menuPengiriman) {
            menuPengiriman.addEventListener('click', (e) => {
                e.preventDefault();
                showPasswordPopup('Manajemen Pengiriman', 'pengiriman', 'pengiriman.html');
            });
        }
    }); // Tutup onAuthStateChanged
});
// --- AKHIR BLOK KODE PROTEKSI ---