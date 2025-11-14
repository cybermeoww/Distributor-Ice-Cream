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

// Referensi
const docRolesRef = db.collection("dashboard_data").doc("user_roles");
const docPasswordsRef = db.collection("dashboard_data").doc("menu_passwords"); 
const usersRef = db.collection("users");

// Elemen DOM
const logoutButton = document.getElementById('admin-logout-button');
const cabangSelect = document.getElementById('cabang-select');
const rolesTableBody = document.getElementById('roles-table-body');
const adminValue1 = document.getElementById('admin-value-1');
const adminValue2 = document.getElementById('admin-value-2');
const adminValue3 = document.getElementById('admin-value-3');
const adminValue4 = document.getElementById('admin-value-4');
const adminValue5 = document.getElementById('admin-value-5');
const gudangValue = document.getElementById('gudang-value');
const kurirValue = document.getElementById('kurir-value');
const cabangValue = document.getElementById('cabang-value');

// DOM Tabel Password
const passwordManagerSection = document.getElementById('password-manager');
const passwordTable = document.getElementById('password-table');
const passDashboardValue = document.getElementById('pass-dashboard-value');
const passPesananValue = document.getElementById('pass-pesanan-value');
const passProdukValue = document.getElementById('pass-produk-value');
const passStokValue = document.getElementById('pass-stok-value');
const passCabangValue = document.getElementById('pass-cabang-value');
const passPengirimanValue = document.getElementById('pass-pengiriman-value');

// Variabel Global
let allBranchesData = []; 

// --- Keamanan Admin (DIPERBARUI) ---
auth.onAuthStateChanged((user) => {
    if (user) {
        if (user.email !== 'admin123@gmail.com' && user.email !== 'superadmin@gmail.com') {
            alert("Akses ditolak."); window.location.href = 'index.html'; 
        }

        // --- LOGIKA SUPER ADMIN vs ADMIN BIASA ---
        if (user.email === 'superadmin@gmail.com') {
            // Super Admin bisa melihat dan mengedit semuanya
            passwordManagerSection.style.display = 'block'; 
            loadMenuPasswords(); 
            rolesTableBody.addEventListener('click', handleRoleEdit);
            passwordTable.addEventListener('click', handlePasswordReset);

        } else if (user.email === 'admin123@gmail.com') {
            
            // --- INI PERUBAHANNYA: Sembunyikan seluruh kolom "Aksi" ---
            const rolesAksiHeader = document.getElementById('roles-aksi-header');
            if (rolesAksiHeader) {
                rolesAksiHeader.style.display = 'none';
            }
            
            const rolesAksiCells = document.querySelectorAll('.roles-aksi-cell');
            rolesAksiCells.forEach(cell => {
                cell.style.display = 'none';
            });
            // -----------------------------------------------------
        }

    } else {
        alert("Silakan login sebagai Admin."); window.location.href = 'login.html'; 
    }
});

// --- FUNGSI BACA 1: BACA ROLE (ADMIN, GUDANG, KURIR) ---
docRolesRef.onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        adminValue1.textContent = data.adminName || "N/A";
        adminValue2.textContent = data.adminName2 || "N/A";
        adminValue3.textContent = data.adminName3 || "N/A";
        adminValue4.textContent = data.adminName4 || "N/A";
        adminValue5.textContent = data.adminName5 || "N/A";
        gudangValue.textContent = data.gudangName || "N/A";
        kurirValue.textContent = data.kurirName || "N/A";
    } else {
        // ... (error handling)
    }
});

// --- FUNGSI BACA 2: MENGISI DROPDOWN CABANG ---
function populateDropdown() {
    usersRef.where("role", "==", "konsumen")
    .onSnapshot((querySnapshot) => {
        allBranchesData = []; 
        cabangSelect.innerHTML = ''; 
        if (querySnapshot.empty) {
            cabangSelect.innerHTML = '<option>Belum ada cabang terdaftar</option>';
            return;
        }
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const id = doc.id; 
            allBranchesData.push({ id, ...data });
            const option = document.createElement('option');
            option.value = id;
            option.textContent = data.namaCabang; 
            cabangSelect.appendChild(option);
        });
        if (allBranchesData.length > 0) {
            displayCabangData(allBranchesData[0].id);
        }
    });
}

// --- FUNGSI BACA 3: MEMUAT PASSWORD MENU (DIPERBARUI) ---
function loadMenuPasswords() {
    docPasswordsRef.onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            passDashboardValue.textContent = "••••••••";
            passPesananValue.textContent = "••••••••";
            passProdukValue.textContent = "••••••••";
            passStokValue.textContent = "••••••••";
            passCabangValue.textContent = "••••••••";
            passPengirimanValue.textContent = "••••••••";
        } else {
            Swal.fire('Error Kritis', 'Dokumen "menu_passwords" tidak ditemukan di Firestore!', 'error');
        }
    });
}

// --- FUNGSI TAMPILKAN PENANGGUNG JAWAB ---
function displayCabangData(selectedUserId) {
    const data = allBranchesData.find(branch => branch.id === selectedUserId);
    if (data) {
        cabangValue.textContent = data.nama_lengkap || "Nama tidak terdaftar";
    }
}

// --- FUNGSI EDIT HELPER ---
async function showEditPopup(title, inputValue) {
    const { value: newValue } = await Swal.fire({
        title: title,
        input: 'text',
        inputValue: inputValue,
        showCancelButton: true,
        confirmButtonText: 'Simpan',
        cancelButtonText: 'Batal'
    });
    return newValue;
}

// --- FUNGSI EDIT ROLE (Hanya untuk Super Admin) ---
async function handleRoleEdit(e) {
    if (!e.target.classList.contains('btn-edit')) return;
    
    const fieldName = e.target.getAttribute('data-role');
    if (!fieldName) return; 

    let title, currentValue;

    if (fieldName.startsWith('adminName')) {
        const adminNumber = fieldName.replace('adminName', '') || '1'; 
        title = `Ubah Admin ${adminNumber}`;
        currentValue = document.getElementById(`admin-value-${adminNumber}`).textContent;
    } else if (fieldName === 'gudangName') {
        title = 'Ubah Petugas Gudang';
        currentValue = gudangValue.textContent;
    } else if (fieldName === 'kurirName') {
        title = 'Ubah Kurir';
        currentValue = kurirValue.textContent;
    } else {
        return; 
    }

    const newValue = await showEditPopup(title, currentValue);
    if (newValue || newValue === "") { 
        docRolesRef.set({ [fieldName]: newValue }, { merge: true })
            .then(() => Swal.fire('Sukses', `${title} diperbarui`, 'success'))
            .catch(e => Swal.fire('Error', e.message, 'error'));
    }
}

// --- FUNGSI RESET PASSWORD MENU (Hanya untuk Super Admin) ---
async function handlePasswordReset(e) {
    if (!e.target.classList.contains('btn-edit')) return;
    
    const role = e.target.getAttribute('data-role'); 
    if (!role) return;

    const { value: newPassword } = await Swal.fire({
        title: `Reset Password Menu`,
        text: `Masukkan password BARU untuk menu ${role}:`,
        input: 'text',
        inputPlaceholder: 'Password baru...',
        showCancelButton: true,
        confirmButtonText: 'Reset',
    });

    if (newPassword) {
        docPasswordsRef.update({ [role]: newPassword })
            .then(() => {
                Swal.fire('Sukses!', `Password untuk menu ${role} telah direset.`, 'success');
            })
            .catch(e => Swal.fire('Error', e.message, 'error'));
    }
}

// --- EVENT LISTENER (Dropdown & Logout) ---
document.addEventListener('DOMContentLoaded', populateDropdown);
cabangSelect.addEventListener('change', (e) => {
    displayCabangData(e.target.value);
});
logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
});

// --- BLOK KODE PROTEKSI MENU (Tetap Sama) ---
document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged(user => {
        if (!user) return; 
        const currentUserEmail = user.email;

        async function showPasswordPopup(menuTitle, menuFieldName, targetUrl) {
            if (window.location.pathname.endsWith(targetUrl)) {
                return; 
            }
            if (currentUserEmail === 'superadmin@gmail.com') {
                window.location.href = targetUrl; 
                return; 
            }
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
        
        // Listener untuk 6 menu terproteksi
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
    });
});