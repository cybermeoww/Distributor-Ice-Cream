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
const auth = firebase.auth();
const db = firebase.firestore();

// =============================================
// LOGIKA BARU: PEMBACA PRODUK (PRODUCT READER)
// =============================================
let productView = localStorage.getItem('currentProductView') || 'jagung';
const productId = (productView === 'jagung') ? 'jagung-001' : 'durian-002';
const docRef = db.collection("dashboard_data").doc(productView);

// Referensi lain
const ordersRef = db.collection("orders");

// Elemen DOM
const logoutButton = document.getElementById('admin-logout-button');
const masukValue = document.getElementById('masuk-value');
const keluarValue = document.getElementById('keluar-value');
const sisaValue = document.getElementById('sisa-value');
const statusValue = document.getElementById('status-value');
const pageTitle = document.querySelector('.main-content .header h2'); // Ambil judul halaman

// Variabel Global
let currentStokMasuk = 0;
let currentStokKeluar = 0;

// --- Keamanan Admin ---
auth.onAuthStateChanged((user) => {
    if (user) {
        if (user.email !== 'admin123@gmail.com') {
            alert("Akses ditolak."); window.location.href = 'index.html'; 
        }
    } else {
        alert("Silakan login sebagai Admin."); window.location.href = 'login.html'; 
    }
});

// --- FUNGSI BARU UNTUK UPDATE SEMUA TAMPILAN ---
function updateStokDisplay() {
    const sisaStok = currentStokMasuk - currentStokKeluar;
    sisaValue.textContent = `${sisaStok} Pcs`;
    keluarValue.textContent = `${currentStokKeluar} Pcs`;

    if (sisaStok > 1000) {
        statusValue.innerHTML = `<span class="status-Active">Aman</span>`;
    } else {
        statusValue.innerHTML = `<span class="status-Pending">Stok Menipis</span>`;
    }
}

// --- BACA DATA STOK KELUAR (DARI ORDERS) (Dinamis) ---
ordersRef.onSnapshot((querySnapshot) => {
    let totalKeluar = 0;
    querySnapshot.forEach(doc => {
        const order = doc.data();
        if (order.productIds && order.productIds.includes(productId)) { 
            const itemDipesan = order.items.find(item => item.id === productId);
            const jumlahPcs = itemDipesan ? itemDipesan.quantity : 0;
            totalKeluar += jumlahPcs;
        }
    });
    currentStokKeluar = totalKeluar;
    updateStokDisplay(); 
});

// --- BACA DATA STOK MASUK (DARI DASHBOARD_DATA) (Dinamis) ---
docRef.onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        currentStokMasuk = data.stokMasuk || 0;
        masukValue.textContent = `${currentStokMasuk} Pcs`;
        
        // Update judul halaman
        pageTitle.textContent = `Manajemen Stok: ${data.namaProduk || 'Error'}`;
        
        updateStokDisplay();
    } else {
        pageTitle.textContent = `Manajemen Stok: Error`;
        console.log(`Dokumen '${productView}' tidak ditemukan!`);
    }
});

// --- FUNGSI EDIT (UPDATE) ---

async function showEditPopup(title, inputValue, inputType = 'number') {
    const { value: newValue } = await Swal.fire({
        title: title,
        input: inputType,
        inputValue: inputValue,
        showCancelButton: true,
        confirmButtonText: 'Simpan',
        cancelButtonText: 'Batal'
    });
    return newValue;
}

// 1. Edit Stok Masuk
document.getElementById('card-masuk').addEventListener('click', async () => {
    const newValue = await showEditPopup('Ubah Stok Masuk (dari Pabrik)', currentStokMasuk);
    if (newValue || newValue === 0) {
        // Saat stok masuk diubah, kita juga update sisaStok (totalStok) di DB
        const sisaStokBaru = parseInt(newValue) - currentStokKeluar;
        
        docRef.update({ 
            stokMasuk: parseInt(newValue),
            totalStok: sisaStokBaru // Kita tetap update totalStok untuk jaga-jaga
        })
            .then(() => Swal.fire('Sukses', 'Stok Masuk diperbarui', 'success'))
            .catch(e => Swal.fire('Error', e.message, 'error'));
    }
});

// --- LOGOUT ---
logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
});

// --- BLOK KODE PROTEKSI MENU (TAMBAHKAN INI DI AKHIR SETIAP FILE JS ADMIN) ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Daftar Password (Bisa Anda ubah di sini)
    const passwords = {
        pesanan: "PESAN123",
        produk: "PROD123",
        stok: "STOK123",
        cabang: "CAB123",
        pengiriman: "KIRIM123"
    };

    // 2. Fungsi Pop-up
    async function showPasswordPopup(menuName, correctPassword, targetUrl) {
        // Cek apakah kita sudah di halaman tujuan
        if (window.location.pathname.endsWith(targetUrl)) {
            return; // Jika sudah, jangan tanya password
        }

        const { value: password } = await Swal.fire({
            title: `Akses Terbatas`,
            text: `Masukkan password untuk membuka ${menuName}:`,
            input: 'password',
            inputPlaceholder: 'Masukkan password...',
            inputAttributes: {
                autocapitalize: 'off',
                autocorrect: 'off'
            },
            showCancelButton: true,
            confirmButtonText: 'Buka',
            cancelButtonText: 'Batal',
            showLoaderOnConfirm: true,
            preConfirm: (pass) => {
                if (pass === correctPassword) {
                    return true;
                } else {
                    Swal.showValidationMessage(`Password salah!`);
                    return false;
                }
            },
            allowOutsideClick: () => !Swal.isLoading()
        });

        if (password) {
            // Jika password benar, arahkan ke halaman
            window.location.href = targetUrl;
        }
    }

    // 3. Pasang Listener ke Semua Tombol Menu yang Dilindungi
    const menuPesanan = document.getElementById('menu-pesanan');
    if (menuPesanan) {
        menuPesanan.addEventListener('click', (e) => {
            e.preventDefault();
            showPasswordPopup('Manajemen Pesanan', passwords.pesanan, 'pesanan.html');
        });
    }

    const menuProduk = document.getElementById('menu-produk');
    if (menuProduk) {
        menuProduk.addEventListener('click', (e) => {
            e.preventDefault();
            showPasswordPopup('Manajemen Produk', passwords.produk, 'produk.html');
        });
    }

    const menuStok = document.getElementById('menu-stok');
    if (menuStok) {
        menuStok.addEventListener('click', (e) => {
            e.preventDefault();
            showPasswordPopup('Manajemen Stok', passwords.stok, 'stok.html');
        });
    }
    
    const menuCabang = document.getElementById('menu-cabang');
    if (menuCabang) {
        menuCabang.addEventListener('click', (e) => {
            e.preventDefault();
            showPasswordPopup('Manajemen Cabang', passwords.cabang, 'cabang.html');
        });
    }
    
    const menuPengiriman = document.getElementById('menu-pengiriman');
    if (menuPengiriman) {
        menuPengiriman.addEventListener('click', (e) => {
            e.preventDefault();
            showPasswordPopup('Manajemen Pengiriman', passwords.pengiriman, 'pengiriman.html');
        });
    }
});
// --- AKHIR BLOK KODE PROTEKSI ---