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
// LOGIKA BARU: PEMILIH PRODUK (PRODUCT SELECTOR)
// =============================================

// 1. Dapatkan pilihan produk dari localStorage, default-nya 'jagung'
let productView = localStorage.getItem('currentProductView') || 'jagung';
localStorage.setItem('currentProductView', productView); // Pastikan tersimpan

// 2. Set ID produk dan nama dokumen berdasarkan pilihan
const productId = (productView === 'jagung') ? 'jagung-001' : 'durian-002';
const docRef = db.collection("dashboard_data").doc(productView);
const pageTitle = (productView === 'jagung') ? 'Dashboard: Es Krim Jagung' : 'Dashboard: Es Krim Durian';

// Referensi lain
const ordersRef = db.collection("orders");
const usersRef = db.collection("users"); 

// Elemen DOM
const stokValue = document.getElementById('stok-value');
const cabangValue = document.getElementById('cabang-value');
const notifValue = document.getElementById('notif-value');
const ordersTableBody = document.getElementById('orders-table-body');
const logoutButton = document.getElementById('admin-logout-button');
const editNotifButton = document.querySelector('#card-notif .btn-edit-card');

// ELEMEN BARU: Dropdown dan Judul
const productSelect = document.getElementById('product-view-select');
const dashboardTitle = document.getElementById('dashboard-title');

// Set nilai dropdown dan judul halaman
productSelect.value = productView;
dashboardTitle.textContent = pageTitle;

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
let currentStokMasuk = 0;
let currentStokKeluar = 0;
function updateSisaStokDisplay() {
    const sisaStok = currentStokMasuk - currentStokKeluar;
    stokValue.textContent = `${sisaStok} Pcs`;
}

// --- 1. BACA DATA (EDITABLE) DARI FIRESTORE (Dinamis) ---
docRef.onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        currentStokMasuk = data.stokMasuk || 0; 
        notifValue.textContent = data.notifikasi;
        updateSisaStokDisplay();
    } else {
        stokValue.textContent = "0 Pcs";
        notifValue.textContent = "Data produk ini belum dibuat di DB.";
        console.log(`Dokumen '${productView}' tidak ditemukan!`);
    }
});

// --- 2. BACA DATA CABANG (Global, tetap sama) ---
usersRef.where("role", "==", "konsumen").onSnapshot((querySnapshot) => {
    const cabangNames = [];
    querySnapshot.forEach(doc => {
        cabangNames.push(doc.data().namaCabang);
    });
    cabangValue.textContent = (cabangNames.length > 0) ? cabangNames.join(", ") : "Belum ada cabang";
});

// --- 3. BACA DATA PESANAN (Dinamis) ---
ordersRef.onSnapshot((querySnapshot) => {
    let totalKeluar = 0;
    ordersTableBody.innerHTML = ''; 
    let dataDitemukan = false;

    querySnapshot.forEach(doc => {
        const order = doc.data();
        const orderId = doc.id;

        // FILTER DINAMIS: Cek apakah 'productId' yang kita lihat ada di pesanan
        if (order.productIds && order.productIds.includes(productId)) {
            
            const itemDipesan = order.items.find(item => item.id === productId);
            const jumlahPcs = itemDipesan ? itemDipesan.quantity : 0;
            totalKeluar += jumlahPcs;
            
            dataDitemukan = true;
            const tanggal = order.tanggal.toDate().toLocaleDateString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${tanggal}</td>
                <td>${order.namaCabang || order.email}</td>
                <td>${jumlahPcs} Pcs</td>
                <td>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.total)}</td>
                <td>
                    <select class="status-select status-${order.status}" data-id="${orderId}">
                        <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Menunggu Konfirmasi</option>
                        <option value="Active" ${order.status === 'Active' ? 'selected' : ''}>Sudah Dikonfirmasi</option>
                        <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Selesai</option>
                    </select>
                </td>
                <td><button class="btn-delete-order" data-id="${orderId}">Hapus</button></td>
            `;
            ordersTableBody.appendChild(row);
        }
    });

    if (!dataDitemukan) {
        ordersTableBody.innerHTML = `<tr><td colspan="6">Belum ada pesanan ${productView} hari ini.</td></tr>`;
    }

    currentStokKeluar = totalKeluar;
    updateSisaStokDisplay();
});


// --- 4. FUNGSI EDIT (Notifikasi saja) ---
editNotifButton.addEventListener('click', async () => {
    const { value: newNotif } = await Swal.fire({
        title: 'Ubah Notifikasi', input: 'textarea',
        inputValue: notifValue.textContent,
        showCancelButton: true, confirmButtonText: 'Simpan', cancelButtonText: 'Batal'
    });
    if (newNotif) {
        docRef.update({ notifikasi: newNotif }) // 'docRef' sudah dinamis
            .then(() => Swal.fire('Sukses', 'Notifikasi diperbarui', 'success'))
            .catch(e => Swal.fire('Error', e.message, 'error'));
    }
});

// --- 5. FUNGSI UPDATE STATUS & HAPUS (Tetap Sama) ---
ordersTableBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-delete-order')) {
        // ... (kode hapus Anda tetap sama)
    }
});
ordersTableBody.addEventListener('change', (e) => {
    if (e.target.classList.contains('status-select')) {
        // ... (kode ubah status Anda tetap sama)
    }
});

// --- 6. LOGOUT (Tetap Sama) ---
logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
});

// --- 7. EVENT LISTENER BARU UNTUK DROPDOWN ---
productSelect.addEventListener('change', (e) => {
    // Simpan pilihan baru ke localStorage
    localStorage.setItem('currentProductView', e.target.value);
    // Muat ulang halaman agar semua data ter-refresh
    window.location.reload();
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