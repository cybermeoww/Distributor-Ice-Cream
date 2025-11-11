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
const kodeValue = document.getElementById('kode-value');
const namaValue = document.getElementById('nama-value');
const hargaValue = document.getElementById('harga-value');
const satuanValue = document.getElementById('satuan-value');
const stokValue = document.getElementById('stok-value');
const statusValue = document.getElementById('status-value');
const pageTitle = document.querySelector('.main-content .header h2'); // Ambil judul halaman

// Variabel Global
let currentStokMasuk = 0;
let currentStokKeluar = 0;

// --- Keamanan Admin ---
auth.onAuthStateChanged((user) => {
    if (user) {
        if (user.email !== 'admin123@gmail.com' && user.email !== 'superadmin@gmail.com') {
            alert("Akses ditolak."); window.location.href = 'index.html'; 
        }
    } else {
        alert("Silakan login sebagai Admin."); window.location.href = 'login.html'; 
    }
});

// --- Fungsi Global (tetap sama) ---
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(number);
}
function updateSisaStokDisplay() {
    const sisaStok = currentStokMasuk - currentStokKeluar;
    stokValue.textContent = `${sisaStok} Pcs`;
    statusValue.textContent = (sisaStok > 1000) ? "Aman" : "Stok Menipis";
}

// --- BACA DATA STOK KELUAR (DARI ORDERS) (Dinamis) ---
ordersRef.onSnapshot((querySnapshot) => {
    let totalKeluar = 0;
    querySnapshot.forEach(doc => {
        const order = doc.data();
        // Filter dinamis
        if (order.productIds && order.productIds.includes(productId)) { 
            const itemDipesan = order.items.find(item => item.id === productId);
            const jumlahPcs = itemDipesan ? itemDipesan.quantity : 0;
            totalKeluar += jumlahPcs;
        }
    });
    currentStokKeluar = totalKeluar;
    updateSisaStokDisplay(); 
});

// --- BACA DATA PRODUK (LIVE) (Dinamis) ---
docRef.onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        currentStokMasuk = data.stokMasuk || 0;
        
        kodeValue.textContent = data.kodeProduk || "N/A";
        namaValue.textContent = data.namaProduk || "N/A";
        hargaValue.textContent = formatRupiah(data.harga || 0);
        satuanValue.textContent = data.satuan || "N/A";
        
        // Update judul halaman
        pageTitle.textContent = `Manajemen Produk: ${data.namaProduk || 'Error'}`;
        
        updateSisaStokDisplay();
    } else {
        pageTitle.textContent = `Manajemen Produk: Error`;
        console.log(`Dokumen '${productView}' tidak ditemukan!`);
    }
});

// --- FUNGSI EDIT (UPDATE) ---

async function showEditPopup(title, inputValue, inputType = 'text') {
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

// 1. Edit Kode Produk
document.getElementById('card-kode').addEventListener('click', async () => {
    const newValue = await showEditPopup('Ubah Kode Produk', kodeValue.textContent);
    if (newValue) {
        docRef.update({ kodeProduk: newValue })
            .then(() => Swal.fire('Sukses', 'Kode Produk diperbarui', 'success'))
            .catch(e => Swal.fire('Error', e.message, 'error'));
    }
});

// 2. Edit Nama Produk
document.getElementById('card-nama').addEventListener('click', async () => {
    const newValue = await showEditPopup('Ubah Nama Produk', namaValue.textContent);
    if (newValue) {
        docRef.update({ namaProduk: newValue })
            .then(() => Swal.fire('Sukses', 'Nama Produk diperbarui', 'success'))
            .catch(e => Swal.fire('Error', e.message, 'error'));
    }
});

// 3. Edit Harga
document.getElementById('card-harga').addEventListener('click', async () => {
    const currentPrice = parseInt(hargaValue.textContent.replace(/[^0-9]/g, '')) || 0;
    const newValue = await showEditPopup('Ubah Harga (angka saja)', currentPrice, 'number');
    if (newValue || newValue === 0) {
        docRef.update({ harga: parseInt(newValue) })
            .then(() => Swal.fire('Sukses', 'Harga diperbarui', 'success'))
            .catch(e => Swal.fire('Error', e.message, 'error'));
    }
});

// 4. Edit Satuan
document.getElementById('card-satuan').addEventListener('click', async () => {
    const newValue = await showEditPopup('Ubah Satuan', satuanValue.textContent);
    if (newValue) {
        docRef.update({ satuan: newValue })
            .then(() => Swal.fire('Sukses', 'Satuan diperbarui', 'success'))
            .catch(e => Swal.fire('Error', e.message, 'error'));
    }
});

// 5. HAPUS FUNGSI EDIT STOK
// document.getElementById('card-stok').addEventListener(...) Dihapus

// 6. Edit Status
document.getElementById('card-status').addEventListener('click', async () => {
    const newValue = await showEditPopup('Ubah Status', statusValue.textContent);
    if (newValue) {
        docRef.update({ status: newValue })
            .then(() => Swal.fire('Sukses', 'Status diperbarui', 'success'))
            .catch(e => Swal.file('Error', e.message, 'error'));
    }
});

// --- LOGOUT ---
logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
});
// --- BLOK KODE PROTEKSI MENU (BARU - BACA DARI DB) ---
document.addEventListener('DOMContentLoaded', () => {
    // Tunggu firebase auth siap
    firebase.auth().onAuthStateChanged(user => {
        if (!user) return; // Jika tidak ada user, hentikan
        
        const currentUserEmail = user.email;

        // 1. Fungsi Pop-up (Async dan Baca DB)
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
                input: 'password',
                inputPlaceholder: 'Masukkan password...',
                showCancelButton: true,
                confirmButtonText: 'Buka',
                cancelButtonText: 'Batal',
                preConfirm: (pass) => {
                    if (pass === correctPassword) {
                        return true;
                    } else {
                        Swal.showValidationMessage(`Password salah!`);
                        return false;
                    }
                },
                allowOutsideClick: false
            });

            if (password) {
                window.location.href = targetUrl;
            }
        }

        // 3. Pasang Listener ke Semua Tombol Menu yang Dilindungi
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