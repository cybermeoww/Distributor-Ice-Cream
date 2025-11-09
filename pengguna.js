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

// Referensi
// 1. Ke dokumen role
const docRef = db.collection("dashboard_data").doc("user_roles");
// 2. Ke koleksi cabang/users
const usersRef = db.collection("users");

// Elemen DOM
const logoutButton = document.getElementById('admin-logout-button');
const cabangSelect = document.getElementById('cabang-select');
const rolesTableBody = document.getElementById('roles-table-body');

// Elemen Tabel
const adminValue = document.getElementById('admin-value');
const adminValue2 = document.getElementById('admin-value2');
const adminValue3 = document.getElementById('admin-value3');
const adminValue4 = document.getElementById('admin-value4');
const adminValue5 = document.getElementById('admin-value5');
const gudangValue = document.getElementById('gudang-value');
const kurirValue = document.getElementById('kurir-value');
const cabangValue = document.getElementById('cabang-value');

// Variabel Global
let allBranchesData = []; // Untuk menyimpan data cabang

// --- Keamanan Admin ---
auth.onAuthStateChanged((user) => {
    if (user) {
        if (user.email !== 'admin123@gmail.com') {
            alert("Akses ditolak.");
            window.location.href = 'index.html'; 
        }
    } else {
        alert("Silakan login sebagai Admin.");
        window.location.href = 'login.html'; 
    }
});

// --- FUNGSI BACA 1: BACA ROLE (ADMIN, GUDANG, KURIR) ---
docRef.onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        adminValue.textContent = data.adminName || "N/A";
        adminValue2.textContent = data.adminName2 || "N/A";
        adminValue3.textContent = data.adminName3 || "N/A";
        adminValue4.textContent = data.adminName4 || "N/A";
        adminValue5.textContent = data.adminName5 || "N/A";
        gudangValue.textContent = data.gudangName || "N/A";
        kurirValue.textContent = data.kurirName || "N/A";
    } else {
        adminValue.textContent = "Data belum diatur";
        adminValue2.textContent = "Data belum diatur";
        adminValue3.textContent = "Data belum diatur";
        adminValue4.textContent = "Data belum diatur";
        adminValue5.textContent = "Data belum diatur";
        gudangValue.textContent = "Data belum diatur";
        kurirValue.textContent = "Data belum diatur";
    }
});

// --- FUNGSI BACA 2: MENGISI DROPDOWN CABANG ---
function populateDropdown() {
    // Ambil data dari 'users' yang BUKAN admin
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
            const id = doc.id; // Ini adalah User ID
            
            // Simpan SEMUA data user, kita butuh 'nama_lengkap'
            allBranchesData.push({ id, ...data });
            
            const option = document.createElement('option');
            option.value = id;
            option.textContent = data.namaCabang; // Teks yang tampil adalah nama cabang
            cabangSelect.appendChild(option);
        });

        if (allBranchesData.length > 0) {
            // Tampilkan data penanggung jawab untuk cabang pertama
            displayCabangData(allBranchesData[0].id);
        }
    });
}

// --- FUNGSI TAMPILKAN PENANGGUNG JAWAB ---
function displayCabangData(selectedUserId) {
    const data = allBranchesData.find(branch => branch.id === selectedUserId);
    if (data) {
        // Tampilkan "Nama Lengkap Penanggung Jawab" di tabel
        cabangValue.textContent = data.nama_lengkap || "Nama tidak terdaftar";
    }
}

// --- FUNGSI EDIT (UPDATE) ---
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
    
    const role = e.target.getAttribute('data-role');
    let title, currentValue, fieldName;

    if (role === 'admin') {
        title = 'Ubah Admin';
        currentValue = adminValue.textContent;
        fieldName = 'adminName';
    }else if (role === 'admin') {
        title = 'Ubah Admin';
        currentValue = adminValue2.textContent;
        fieldName = 'adminName';
    }else if (role === 'admin') {
        title = 'Ubah Admin';
        currentValue = adminValue3.textContent;
        fieldName = 'adminName';
    }else if (role === 'admin') {
        title = 'Ubah Admin';
        currentValue = adminValue4.textContent;
        fieldName = 'adminName';
    }else if (role === 'admin') {
        title = 'Ubah Admin';
        currentValue = adminValue5.textContent;
        fieldName = 'adminName';
    } else if (role === 'gudang') {
        title = 'Ubah Petugas Gudang';
        currentValue = gudangValue.textContent;
        fieldName = 'gudangName';
    } else if (role === 'kurir') {
        title = 'Ubah Kurir';
        currentValue = kurirValue.textContent;
        fieldName = 'kurirName';
    } else {
        return; // Jika bukan tombol edit yang kita kenali
    }

    const newValue = await showEditPopup(title, currentValue);
    if (newValue) {
        // Gunakan .set({ [fieldName]: newValue }, { merge: true })
        // Ini akan mengupdate 1 field saja, atau membuat dokumen jika belum ada
        docRef.set({ [fieldName]: newValue }, { merge: true })
            .then(() => Swal.fire('Sukses', `Data ${role} diperbarui`, 'success'))
            .catch(e => Swal.fire('Error', e.message, 'error'));
    }
});

// --- EVENT LISTENER ---
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