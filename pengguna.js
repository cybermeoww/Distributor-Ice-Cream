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

// Elemen DOM (DIPERBARUI)
const logoutButton = document.getElementById('admin-logout-button');
const cabangSelect = document.getElementById('cabang-select');
const rolesTableBody = document.getElementById('roles-table-body');
// 5 Elemen Admin Baru
const adminValue1 = document.getElementById('admin-value-1');
const adminValue2 = document.getElementById('admin-value-2');
const adminValue3 = document.getElementById('admin-value-3');
const adminValue4 = document.getElementById('admin-value-4');
const adminValue5 = document.getElementById('admin-value-5');
// Elemen Lainnya
const gudangValue = document.getElementById('gudang-value');
const kurirValue = document.getElementById('kurir-value');
const cabangValue = document.getElementById('cabang-value');

// DOM Tabel Password
const passwordManagerSection = document.getElementById('password-manager');
const passwordTable = document.getElementById('password-table');
const passPesananValue = document.getElementById('pass-pesanan-value');
const passProdukValue = document.getElementById('pass-produk-value');
const passStokValue = document.getElementById('pass-stok-value');
const passCabangValue = document.getElementById('pass-cabang-value');
const passPengirimanValue = document.getElementById('pass-pengiriman-value');

// Variabel Global
let allBranchesData = []; 

// --- Keamanan Admin (Tetap Sama) ---
auth.onAuthStateChanged((user) => {
    if (user) {
        if (user.email !== 'admin123@gmail.com' && user.email !== 'superadmin@gmail.com') {
            alert("Akses ditolak."); window.location.href = 'index.html'; 
        }
        if (user.email === 'superadmin@gmail.com') {
            passwordManagerSection.style.display = 'block'; 
            loadMenuPasswords(); 
        }
    } else {
        alert("Silakan login sebagai Admin."); window.location.href = 'login.html'; 
    }
});

// --- FUNGSI BACA 1: BACA ROLE (DIPERBARUI) ---
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
        adminValue1.textContent = "Data belum diatur";
        adminValue2.textContent = "Data belum diatur";
        adminValue3.textContent = "Data belum diatur";
        adminValue4.textContent = "Data belum diatur";
        adminValue5.textContent = "Data belum diatur";
        gudangValue.textContent = "Data belum diatur";
        kurirValue.textContent = "Data belum diatur";
    }
});

// --- FUNGSI BACA 2: MENGISI DROPDOWN CABANG (Tetap Sama) ---
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

// --- FUNGSI BACA 3: MEMUAT PASSWORD MENU (Tetap Sama) ---
function loadMenuPasswords() {
    docPasswordsRef.onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
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

// --- FUNGSI TAMPILKAN PENANGGUNG JAWAB (Tetap Sama) ---
function displayCabangData(selectedUserId) {
    const data = allBranchesData.find(branch => branch.id === selectedUserId);
    if (data) {
        cabangValue.textContent = data.nama_lengkap || "Nama tidak terdaftar";
    }
}

// --- FUNGSI EDIT ROLE (DIPERBARUI) ---
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

rolesTableBody.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('btn-edit')) return;
    
    // Logika baru ini menangani semua data-role dinamis
    const fieldName = e.target.getAttribute('data-role'); // e.g., "adminName", "adminName2", "gudangName"
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
        return; // Bukan peran yang kita kenali
    }

    const newValue = await showEditPopup(title, currentValue);
    if (newValue || newValue === "") { // Izinkan mengosongkan nama
        docRolesRef.set({ [fieldName]: newValue }, { merge: true })
            .then(() => Swal.fire('Sukses', `${title} diperbarui`, 'success'))
            .catch(e => Swal.fire('Error', e.message, 'error'));
    }
});

// --- FUNGSI RESET PASSWORD MENU (Tetap Sama) ---
passwordTable.addEventListener('click', async (e) => {
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
});

// --- EVENT LISTENER (Tetap Sama) ---
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