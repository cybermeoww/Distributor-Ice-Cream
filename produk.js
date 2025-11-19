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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// LOGIKA PRODUK READER & SELECTOR
let productView = localStorage.getItem('currentProductView') || 'jagung';
const productId = (productView === 'jagung') ? 'jagung-001' : 'durian-002';
const docRef = db.collection("dashboard_data").doc(productView);
const ordersRef = db.collection("orders");

// DOM
const logoutButton = document.getElementById('admin-logout-button');
const kodeValue = document.getElementById('kode-value');
const namaValue = document.getElementById('nama-value');
const hargaValue = document.getElementById('harga-value');
const satuanValue = document.getElementById('satuan-value');
const stokValue = document.getElementById('stok-value');
const statusValue = document.getElementById('status-value');
// DOM BARU
const productSelect = document.getElementById('product-view-select');
const pageTitle = document.getElementById('page-title');

// Set Nilai Awal Dropdown
if (productSelect) productSelect.value = productView;

let currentStokMasuk = 0;
let currentStokKeluar = 0;

// Fungsi Format & Update
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
}
function updateSisaStokDisplay() {
    const sisaStok = currentStokMasuk - currentStokKeluar;
    stokValue.textContent = `${sisaStok} Pcs`;
}

// --- BACA DATA (Sama seperti sebelumnya) ---
ordersRef.onSnapshot((querySnapshot) => {
    let totalKeluar = 0;
    querySnapshot.forEach(doc => {
        const order = doc.data();
        if (order.productIds && order.productIds.includes(productId)) {
            // HANYA HITUNG YANG COMPLETED (SELESAI) UNTUK PENGURANGAN STOK GUDANG UTAMA
            if (order.status === 'Completed') {
                const itemDipesan = order.items.find(item => item.id === productId);
                totalKeluar += (itemDipesan ? itemDipesan.quantity : 0);
            }
        }
    });
    currentStokKeluar = totalKeluar;
    updateSisaStokDisplay(); 
});

docRef.onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        currentStokMasuk = data.stokMasuk || 0;
        kodeValue.textContent = data.kodeProduk || "N/A";
        namaValue.textContent = data.namaProduk || "N/A";
        hargaValue.textContent = formatRupiah(data.harga || 0);
        satuanValue.textContent = data.satuan || "N/A";
        statusValue.textContent = data.status || "N/A";
        
        // Update Judul Halaman
        if (pageTitle) pageTitle.textContent = `Manajemen Produk: ${data.namaProduk}`;
        
        updateSisaStokDisplay();
    }
});

// --- EVENT LISTENER DROPDOWN ---
productSelect.addEventListener('change', (e) => {
    localStorage.setItem('currentProductView', e.target.value);
    window.location.reload(); // Refresh untuk ganti data
});

// --- FUNGSI EDIT (Standard) ---
async function showEditPopup(title, inputValue, inputType = 'text') {
    const { value: newValue } = await Swal.fire({
        title: title, input: inputType, inputValue: inputValue,
        showCancelButton: true, confirmButtonText: 'Simpan', cancelButtonText: 'Batal'
    });
    return newValue;
}
document.getElementById('card-kode').addEventListener('click', async () => {
    const newValue = await showEditPopup('Ubah Kode', kodeValue.textContent);
    if (newValue) docRef.update({ kodeProduk: newValue });
});
document.getElementById('card-nama').addEventListener('click', async () => {
    const newValue = await showEditPopup('Ubah Nama', namaValue.textContent);
    if (newValue) docRef.update({ namaProduk: newValue });
});
document.getElementById('card-harga').addEventListener('click', async () => {
    const currentPrice = parseInt(hargaValue.textContent.replace(/[^0-9]/g, '')) || 0;
    const newValue = await showEditPopup('Ubah Harga', currentPrice, 'number');
    if (newValue) docRef.update({ harga: parseInt(newValue) });
});
document.getElementById('card-satuan').addEventListener('click', async () => {
    const newValue = await showEditPopup('Ubah Satuan', satuanValue.textContent);
    if (newValue) docRef.update({ satuan: newValue });
});
document.getElementById('card-status').addEventListener('click', async () => {
    const newValue = await showEditPopup('Ubah Status', statusValue.textContent);
    if (newValue) docRef.update({ status: newValue });
});


// --- LOGOUT ---
logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
});
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