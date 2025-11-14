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
let productView = localStorage.getItem('currentProductView') || 'jagung';
const productId = (productView === 'jagung') ? 'jagung-001' : 'durian-002';
const docRef = db.collection("dashboard_data").doc(productView);
const ordersRef = db.collection("orders");

// Elemen DOM
const logoutButton = document.getElementById('admin-logout-button');
const ordersTableBody = document.getElementById('orders-table-body');
const productSelect = document.getElementById('product-view-select');
const pageTitle = document.getElementById('page-title');
const tableTitle = document.getElementById('table-title');

// Variabel global untuk menyimpan Kode Produk
let currentKodeProduk = "Memuat...";

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

// --- BACA DATA PRODUK (Untuk ambil Kode & Nama) ---
docRef.onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        currentKodeProduk = data.kodeProduk || "N/A";
        const namaProduk = data.namaProduk || "Produk";
        
        // Update judul halaman
        productSelect.value = productView;
        pageTitle.textContent = `Manajemen Pesanan (${namaProduk})`;
        tableTitle.textContent = `Daftar Pesanan Masuk (${namaProduk})`;
    } else {
        console.log(`Dokumen '${productView}' tidak ditemukan!`);
    }
});

// --- BACA DATA SEMUA PESANAN (LIVE) ---
ordersRef
    .orderBy("tanggal", "desc") 
    .onSnapshot((querySnapshot) => {
        ordersTableBody.innerHTML = ''; // Kosongkan tabel
        let dataDitemukan = false;

        querySnapshot.forEach(doc => {
            const order = doc.data();
            const orderId = doc.id;

            // --- FILTER MANUAL DI SINI ---
            // Cek apakah 'productId' (misal: 'jagung-001') ada di pesanan ini
            if (order.productIds && order.productIds.includes(productId)) {
                
                dataDitemukan = true;
                
                // Ambil data spesifik untuk produk ini
                const itemDipesan = order.items.find(item => item.id === productId);
                const jumlahPcs = itemDipesan ? itemDipesan.quantity : 0;
                
                const nomorPesanan = orderId.substring(0, 8).toUpperCase();
                const namaCabang = order.namaCabang || order.email;
                const tanggal = order.tanggal.toDate().toLocaleDateString('id-ID', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${nomorPesanan}</td>
                    <td>${namaCabang}</td>
                    <td><strong>${currentKodeProduk}</strong></td> <td>${jumlahPcs} Pcs</td>
                    <td>${tanggal}</td>
                    <td>
                        <select class="status-select status-${order.status}" data-id="${orderId}">
                            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Menunggu Konfirmasi</option>
                            <option value="Active" ${order.status === 'Active' ? 'selected' : ''}>Sudah Dikonfirmasi</option>
                            <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Selesai</option>
                        </select>
                    </td>
                `;
                ordersTableBody.appendChild(row);
            }
        });

        if (!dataDitemukan) {
            ordersTableBody.innerHTML = `<tr><td colspan="6">Belum ada pesanan untuk produk ini.</td></tr>`;
        }
    });

// --- FUNGSI UPDATE STATUS PENGIRIMAN ---
ordersTableBody.addEventListener('change', (e) => {
    if (e.target.classList.contains('status-select')) {
        const newStatus = e.target.value;
        const orderId = e.target.getAttribute('data-id');

        db.collection("orders").doc(orderId).update({
            status: newStatus
        })
        .then(() => {
            e.target.className = `status-select status-${newStatus}`;
            Swal.fire({
                title: 'Status Diperbarui!',
                icon: 'success',
                timer: 1000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        })
        .catch(e => Swal.fire('Error', e.message, 'error'));
    }
});

// --- EVENT LISTENER BARU UNTUK DROPDOWN ---
productSelect.addEventListener('change', (e) => {
    localStorage.setItem('currentProductView', e.target.value);
    window.location.reload();
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