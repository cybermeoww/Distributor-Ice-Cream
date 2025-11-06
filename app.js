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

// --- DATABASE PRODUK (STATIS) ---
const productsData = [
    { id: 'jagung-001', name: 'Es Krim Jagung', price: 250000, image: 'asset/Jagung.jpeg' },
    { id: 'durian-002', name: 'Es Krim Durian', price: 300000, image: 'asset/Durian.jpeg' }
];

// --- (Fungsi 1-9 dan Elemen DOM tetap sama persis, tidak perlu diubah) ---
let cart = [];
let currentUser = null; 
const productGrid = document.getElementById('product-grid');
const cartIcon = document.getElementById('cart-icon');
const cartBadge = document.getElementById('cart-badge');
const cartModal = document.getElementById('cart-modal');
const closeModal = document.getElementById('close-modal');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartTotalPrice = document.getElementById('cart-total-price');
const checkoutButton = document.getElementById('checkout-button');
const navUserArea = document.getElementById('nav-user-area'); 
function renderProducts() {
    productGrid.innerHTML = ''; 
    productsData.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${formatRupiah(product.price)}</p>
            <button class="btn-add-cart" data-id="${product.id}">+</button>
        `;
        productGrid.appendChild(card);
    });
}
function addToCart(productId) {
    const product = productsData.find(p => p.id === productId); 
    if (!product) return;
    const itemInCart = cart.find(item => item.id === productId);
    if (itemInCart) {
        itemInCart.quantity++;
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
    }
    updateCartDisplay();
}
function updateCartDisplay() {
    renderCartItems();
    updateCartBadge();
    updateCartTotal();
}
function updateCartBadge() {
    let totalItems = 0;
    cart.forEach(item => { totalItems += item.quantity; });
    cartBadge.textContent = totalItems;
}
function renderCartItems() {
    cartItemsContainer.innerHTML = ''; 
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Keranjang Anda masih kosong.</p>';
        return;
    }
    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <span style="flex: 2;">${item.name}</span>
            <div class="cart-quantity">
                <button class="btn-qty" data-id="${item.id}" data-action="decrease">-</button>
                <span>${item.quantity}</span>
                <button class="btn-qty" data-id="${item.id}" data-action="increase">+</button>
            </div>
            <span style="flex: 1; text-align: right;">${formatRupiah(item.price * item.quantity)}</span>
        `;
        cartItemsContainer.appendChild(itemElement);
    });
}
function changeQuantity(productId, action) {
    const itemInCart = cart.find(item => item.id === productId);
    if (!itemInCart) return;
    if (action === 'increase') {
        itemInCart.quantity++;
    } else if (action === 'decrease') {
        itemInCart.quantity--;
        if (itemInCart.quantity <= 0) {
            cart = cart.filter(item => item.id !== productId);
        }
    }
    updateCartDisplay();
}
function updateCartTotal() {
    let total = 0;
    cart.forEach(item => { total += item.price * item.quantity; });
    cartTotalPrice.textContent = formatRupiah(total);
}
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(number);
}
function handleLogout() {
    localStorage.removeItem('namaCabang'); // Hapus data cabang saat logout
    auth.signOut().then(() => {
        Swal.fire({
            title: 'Logout Berhasil', icon: 'success', timer: 1500,
            showConfirmButton: false, toast: true, position: 'top-end'
        });
    }).catch((error) => console.error("Error signing out: ", error));
}
// (Event Listeners DOMContentLoaded, productGrid, dan Modal TETAP SAMA)
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user; 
            navUserArea.innerHTML = `<button class="btn-nav-logout" id="logout-button">Logout</button>`;
            document.getElementById('logout-button').addEventListener('click', handleLogout);
        } else {
            currentUser = null; 
            navUserArea.innerHTML = `<a href="login.html" class="btn-nav-login">Login</a>`;
            cart = []; 
            updateCartDisplay(); 
        }
    });
    renderProducts(); 
});
productGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-add-cart')) {
        if (currentUser) {
            const productId = e.target.getAttribute('data-id');
            addToCart(productId);
            Swal.fire({
                title: 'Ditambahkan!', text: 'Produk masuk ke keranjang.', icon: 'success',
                timer: 1000, showConfirmButton: false, toast: true, position: 'top-end'
            });
        } else {
            Swal.fire({
                title: 'Anda Belum Login', text: 'Anda harus login terlebih dahulu untuk menambah produk.',
                icon: 'warning', confirmButtonText: 'Login Sekarang',
                showCancelButton: true, cancelButtonText: 'Nanti Saja'
            }).then((result) => {
                if (result.isConfirmed) { window.location.href = 'login.html'; }
            });
        }
    }
});
cartIcon.addEventListener('click', () => { cartModal.style.display = 'block'; });
closeModal.addEventListener('click', () => { cartModal.style.display = 'none'; });
window.addEventListener('click', (e) => { if (e.target == cartModal) { cartModal.style.display = 'none'; } });
cartItemsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-qty')) {
        const productId = e.target.getAttribute('data-id');
        const action = e.target.getAttribute('data-action');
        changeQuantity(productId, action);
    }
});

// =================================================================
// 7. Saat tombol Checkout diklik (LOGIKA BARU DENGAN INFO CABANG)
// =================================================================
checkoutButton.addEventListener('click', () => {
    if (cart.length === 0) {
        Swal.fire('Keranjang Kosong', 'Silakan pilih produk terlebih dahulu.', 'warning');
        return;
    }
    
    if (currentUser) {
        let total = 0;
        cart.forEach(item => {
            total += item.price * item.quantity;
        });

        // Ambil info cabang dari localStorage
        const namaCabang = localStorage.getItem('namaCabang');
        
        const productIds = cart.map(item => item.id);
        
        // --- SIMPAN PESANAN KE DATABASE ---
        db.collection("orders").add({
            userId: currentUser.uid,
            email: currentUser.email,
            namaCabang: namaCabang, // <-- DATA BARU
            items: cart, 
            total: total, 
            tanggal: new Date(), 
            status: "Pending",
            productIds: productIds 
        })
        .then((docRef) => {
            // Sukses! Lanjutkan ke pembayaran
            localStorage.setItem('checkoutCart', JSON.stringify(cart));
            localStorage.setItem('checkoutTotal', total);
            window.location.href = 'payment.html';
        })
        .catch((error) => {
            console.error("Error adding document: ", error);
            Swal.fire('Error', 'Gagal menyimpan pesanan, coba lagi.', 'error');
        });
        
    } else {
        // Logika jika belum login
        Swal.fire({
            title: 'Anda Belum Login',
            text: 'Silakan login untuk melanjutkan pembayaran.',
            icon: 'warning',
            confirmButtonText: 'Login'
        }).then(() => {
            window.location.href = 'login.html';
        });
    }
});