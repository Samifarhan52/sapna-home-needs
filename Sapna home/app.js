// app.js - Global Engine for Sapna Home Needs

let cart = [];
let pendingOTP = null;
let pendingUserData = null;
let authAction = null; 

// 1. Initialize Database
function initializeData() {
    if(!localStorage.getItem('sapna_config')) {
        localStorage.setItem('sapna_config', JSON.stringify({ storeOpen: true, requireOTP: true, deliveryFee: 20 }));
    }
    if(!localStorage.getItem('sapna_users')) {
        localStorage.setItem('sapna_users', JSON.stringify([]));
    }
    if(!localStorage.getItem('sapna_inventory')) {
        const initialInventory = [
            {id: 1, name: "Aashirvaad Atta (10kg)", cat: "Staples", price: 450, stock: 12, imgUrl: "https://m.media-amazon.com/images/I/910XEqyDcwL._AC_UF1000,1000_QL80_.jpg"},
            {id: 2, name: "Sunflower Oil (1L)", cat: "Dairy & Oil", price: 135, stock: 45, imgUrl: "https://m.media-amazon.com/images/I/51rYqE7aB7L._AC_UF1000,1000_QL80_.jpg"},
            {id: 3, name: "Fresh Tomatoes", cat: "Fresh Veggies", price: 40, stock: 50, imgUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80"},
            {id: 4, name: "Washing Powder (1kg)", cat: "Household", price: 120, stock: 8, imgUrl: "https://m.media-amazon.com/images/I/61NlPjT0-2L._AC_UF1000,1000_QL80_.jpg"}
        ];
        const initialUpdates = [{id: 1, badge: "Discount", title: "Onion & Potato Combo", desc: "5kg each. Farm fresh. ₹299 instead of ₹350."}];
        
        localStorage.setItem('sapna_inventory', JSON.stringify(initialInventory));
        localStorage.setItem('sapna_updates', JSON.stringify(initialUpdates));
        localStorage.setItem('sapna_orders', JSON.stringify([]));
    }
}

// 2. Load Live Offers (For index.html)
function loadLiveOffers() {
    const container = document.getElementById('live-offers-container');
    if (!container) return; 
    const updates = JSON.parse(localStorage.getItem('sapna_updates')) || [];
    container.innerHTML = ''; 
    if (updates.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-center w-full col-span-full">No special offers today.</p>`;
        return;
    }
    updates.forEach(offer => {
        let badgeColor = offer.badge.toLowerCase().includes('bogo') ? 'bg-amber-500' : 'bg-teal-500';
        container.innerHTML += `
            <div class="group bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-500 hover:shadow-[0_0_30px_rgba(20,184,166,0.3)]">
                <div class="flex justify-between items-start mb-6">
                    <span class="${badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">${offer.badge}</span>
                    <div class="p-3 bg-white/10 rounded-2xl group-hover:scale-110 transition-transform"><i class="fa-solid fa-tags text-2xl text-teal-400"></i></div>
                </div>
                <h3 class="text-2xl font-bold mb-2 text-white">${offer.title}</h3>
                <p class="text-slate-400 text-sm mb-6">${offer.desc}</p>
                <div class="flex items-center justify-between">
                    <a href="shop.html?category=All" class="text-teal-400 font-bold hover:text-teal-300 flex items-center gap-2 group-hover:translate-x-2 transition-transform">Shop Offer <i class="fa-solid fa-arrow-right"></i></a>
                </div>
            </div>
        `;
    });
}

// 3. Load Shop Products (For shop.html)
function loadShopProducts() {
    const container = document.getElementById('product-grid');
    if (!container) return; 
    const params = new URLSearchParams(window.location.search);
    const selectedCategory = params.get('category') || 'All';
    document.getElementById('shop-title').innerText = selectedCategory === 'All' ? 'All Products' : selectedCategory;

    const inventory = JSON.parse(localStorage.getItem('sapna_inventory')) || [];
    container.innerHTML = ''; 
    const filteredProducts = selectedCategory === 'All' ? inventory : inventory.filter(p => p.cat === selectedCategory);

    if (filteredProducts.length === 0) {
        container.innerHTML = `<p class="text-slate-500 col-span-full text-center py-12 text-xl">No products available.</p>`;
        return;
    }

    filteredProducts.forEach(product => {
        let stockWarning = product.stock < 10 ? `<span class="text-xs text-red-500 font-bold">Only ${product.stock} left</span>` : `<span class="text-xs text-green-500">In Stock</span>`;
        let imageHTML = product.imgUrl 
            ? `<img src="${product.imgUrl}" alt="${product.name}" class="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500">`
            : `<div class="w-full h-full bg-slate-100 flex items-center justify-center rounded-xl"><i class="fa-solid fa-box text-5xl text-slate-300"></i></div>`;

        container.innerHTML += `
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 flex flex-col justify-between">
                <div>
                    <div class="h-40 mb-4 overflow-hidden rounded-xl relative bg-slate-50">${imageHTML}</div>
                    <h3 class="font-bold text-lg text-slate-800 leading-tight mb-1">${product.name}</h3>
                    <p class="text-slate-400 text-xs mb-4 uppercase tracking-wider">${product.cat}</p>
                </div>
                <div class="flex justify-between items-end">
                    <div>
                        <div class="font-extrabold text-2xl text-teal-600">₹${product.price}</div>
                        ${stockWarning}
                    </div>
                    <button onclick="addToCart(${product.id})" class="bg-slate-900 text-white w-10 h-10 rounded-xl hover:bg-teal-500 transition-colors shadow-lg flex items-center justify-center">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
    });
}

// 4. Cart Logic
window.toggleCart = function() {
    const modal = document.getElementById('cart-modal');
    const panel = document.getElementById('cart-panel');
    if (modal.classList.contains('opacity-0')) {
        modal.classList.remove('opacity-0', 'pointer-events-none');
        panel.classList.remove('translate-x-full');
    } else {
        modal.classList.add('opacity-0', 'pointer-events-none');
        panel.classList.add('translate-x-full');
    }
}

window.addToCart = function(productId) {
    const inventory = JSON.parse(localStorage.getItem('sapna_inventory')) || [];
    const product = inventory.find(p => p.id === productId);
    if(!product) return;
    const existingItem = cart.find(item => item.id === productId);
    if(existingItem) existingItem.qty += 1;
    else cart.push({...product, qty: 1});
    updateCartUI();
    const cartIcon = document.getElementById('cart-btn');
    if(cartIcon) { cartIcon.classList.add('-translate-y-2'); setTimeout(() => cartIcon.classList.remove('-translate-y-2'), 200); }
}

window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
}

function updateCartUI() {
    const countEl = document.getElementById('cart-count');
    const itemsEl = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if(!countEl || !itemsEl) return;

    countEl.innerText = cart.reduce((sum, item) => sum + item.qty, 0);
    itemsEl.innerHTML = '';
    let totalPrice = 0;

    if(cart.length === 0) {
        itemsEl.innerHTML = '<p class="text-slate-400 text-center mt-10">Your cart is empty.</p>';
        totalEl.innerText = '₹0';
        return;
    }

    cart.forEach(item => {
        let itemTotal = item.price * item.qty;
        totalPrice += itemTotal;
        itemsEl.innerHTML += `
            <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                    <h4 class="font-bold text-slate-800 text-sm">${item.name}</h4>
                    <p class="text-slate-500 text-xs mt-1">₹${item.price} x ${item.qty}</p>
                </div>
                <div class="flex items-center gap-4">
                    <span class="font-extrabold text-teal-600">₹${itemTotal}</span>
                    <button onclick="removeFromCart(${item.id})" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-trash text-sm"></i></button>
                </div>
            </div>
        `;
    });
    totalEl.innerText = '₹' + totalPrice;
}

window.processCheckout = function() {
    if(cart.length === 0) { alert("Cart is empty!"); return; }
    const config = JSON.parse(localStorage.getItem('sapna_config'));
    if(!config.storeOpen) { alert("Sorry, the store is currently closed to new orders."); return; }

    const name = document.getElementById('cust-name').value;
    const address = document.getElementById('cust-address').value;
    if(!name || !address) { alert("Enter Name and Address."); return; }

    const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const total = subtotal + parseInt(config.deliveryFee);
    const itemsString = cart.map(item => `${item.qty}x ${item.name}`).join(', ');

    const existingOrders = JSON.parse(localStorage.getItem('sapna_orders')) || [];
    existingOrders.unshift({ id: orderId, name: name, items: itemsString, total: total, status: "Pending" });
    localStorage.setItem('sapna_orders', JSON.stringify(existingOrders));

    let waMessage = `*New Order: ${orderId}*%0A%0A*Customer:* ${name}%0A*Address:* ${address}%0A%0A*Items:*%0A`;
    cart.forEach(item => { waMessage += `- ${item.qty}x ${item.name} (₹${item.price * item.qty})%0A`; });
    waMessage += `%0A*Delivery Fee:* ₹${config.deliveryFee}%0A*Total:* ₹${total}%0A%0AConfirm order.`;

    window.open(`https://wa.me/917676808068?text=${waMessage}`, '_blank');

    cart = []; updateCartUI(); toggleCart();
    setTimeout(() => alert("Order registered! Redirecting to WhatsApp."), 500);
}

// 5. Auth & OTP Logic
window.processAuth = function(e, action) {
    e.preventDefault();
    const config = JSON.parse(localStorage.getItem('sapna_config'));
    const users = JSON.parse(localStorage.getItem('sapna_users'));

    if (action === 'signup') {
        const name = document.getElementById('reg-name').value;
        const phone = document.getElementById('reg-phone').value;
        const pass = document.getElementById('reg-pass').value;
        if(users.find(u => u.phone === phone)) { alert("Phone already registered."); return; }
        pendingUserData = { id: Date.now(), name, phone, pass, address: "" };
        authAction = 'signup';
    } else if (action === 'login') {
        const phone = document.getElementById('auth-phone').value;
        const pass = document.getElementById('auth-pass').value;
        if (phone === 'admin' && pass === 'sapna123') { window.location.href = 'admin.html'; return; }
        const user = users.find(u => u.phone === phone && u.pass === pass);
        if(!user) { alert("Invalid Credentials."); return; }
        pendingUserData = user;
        authAction = 'login';
    }

    if (config.requireOTP && pendingUserData.phone !== 'admin') { triggerOTP(); } 
    else { finalizeLogin(pendingUserData); }
}

function triggerOTP() {
    pendingOTP = Math.floor(1000 + Math.random() * 9000).toString();
    document.getElementById('auth-forms-container').classList.add('hidden');
    document.getElementById('otp-container').classList.remove('hidden');
    setTimeout(() => alert(`🔔 SIMULATED SMS:\nYour Sapna Needs OTP is: ${pendingOTP}`), 500);
}

window.verifyOTP = function(e) {
    e.preventDefault();
    if (document.getElementById('otp-input').value === pendingOTP) {
        if (authAction === 'signup') {
            const users = JSON.parse(localStorage.getItem('sapna_users'));
            users.push(pendingUserData);
            localStorage.setItem('sapna_users', JSON.stringify(users));
            alert("Account created!");
        }
        finalizeLogin(pendingUserData);
    } else { alert("Incorrect OTP."); }
}

function finalizeLogin(userData) {
    localStorage.setItem('sapna_client_user', JSON.stringify(userData));
    window.location.reload();
}

window.logoutUser = function() {
    localStorage.removeItem('sapna_client_user');
    window.location.reload();
}

// 6. Client Settings Logic
window.openClientSettings = function() {
    const user = JSON.parse(localStorage.getItem('sapna_client_user'));
    if(!user) return;
    document.getElementById('set-name').value = user.name;
    document.getElementById('set-phone').value = user.phone;
    document.getElementById('set-address').value = user.address || "";
    document.getElementById('client-settings-modal').classList.remove('hidden');
    document.getElementById('client-settings-modal').classList.add('flex');
}

window.saveClientSettings = function(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('sapna_client_user'));
    let users = JSON.parse(localStorage.getItem('sapna_users'));
    const updatedData = { ...user, name: document.getElementById('set-name').value, address: document.getElementById('set-address').value };
    
    localStorage.setItem('sapna_client_user', JSON.stringify(updatedData));
    const userIndex = users.findIndex(u => u.id === user.id);
    if(userIndex > -1) { users[userIndex] = updatedData; localStorage.setItem('sapna_users', JSON.stringify(users)); }
    
    alert("Profile saved!");
    document.getElementById('client-settings-modal').classList.add('hidden');
    document.getElementById('client-settings-modal').classList.remove('flex');
    if(typeof checkLoginStatus === 'function') checkLoginStatus(); 
}

document.addEventListener('DOMContentLoaded', () => { initializeData(); loadLiveOffers(); loadShopProducts(); });
