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
const db = firebase.firestore(); // Butuh firestore

// Menangkap elemen form login
const loginForm = document.querySelector('form');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); 
    const email = loginForm['email'].value;
    const password = loginForm['password'].value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            // Cek apakah ini admin
            if (user.email === 'admin123@gmail.com') {
                Swal.fire({
                    title: 'Login Admin Berhasil!', text: 'Mengarahkan ke dashboard...',
                    icon: 'success', timer: 2000, 
                    showConfirmButton: false, allowOutsideClick: false 
                }).then(() => {
                    window.location.href = 'admin-dashboard.html';
                });
            }else if (user.email === 'admin123@gmail.com') {
                Swal.fire({
                    title: 'Login Admin Berhasil!', text: 'Mengarahkan ke dashboard...',
                    icon: 'success', timer: 2000, 
                    showConfirmButton: false, allowOutsideClick: false 
                }).then(() => {
                    window.location.href = 'admin-dashboard.html';
                });
            }else {
                // INI LOGIKA BARU UNTUK CABANG
                // Ambil data cabang dari 'users'
                db.collection("users").doc(user.uid).get().then((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        // Simpan info penting ke localStorage
                        localStorage.setItem('namaCabang', userData.namaCabang);
                        
                        Swal.fire({
                            title: 'Login Berhasil!',
                            text: `Selamat datang, ${userData.namaCabang}!`,
                            icon: 'success', timer: 2000,
                            showConfirmButton: false, allowOutsideClick: false
                        }).then(() => {
                            window.location.href = 'index.html'; 
                        });
                    } else {
                        // Jika data tidak ditemukan (seharusnya tidak mungkin)
                        auth.signOut();
                        Swal.fire('Login Gagal', 'Data cabang Anda tidak ditemukan.', 'error');
                    }
                });
            }
        })
        .catch((error) => {
            Swal.fire({
                title: 'Login Gagal',
                text: 'Email atau password yang Anda masukkan salah.',
                icon: 'error',
                confirmButtonText: 'Coba Lagi'
            });
        });
});