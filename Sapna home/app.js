// app.js - Global Engine for Sapna Home Needs

let cart = JSON.parse(localStorage.getItem('sapna_cart')) || [];
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

// 2. Cart Logic (Saves to LocalStorage so it survives page changes)
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
    
    localStorage.setItem('sapna_cart', JSON.stringify(cart));
    updateCartUI();
    const cartIcon = document.getElementById('cart-btn');
    if(cartIcon) { cartIcon.classList.add('-translate-y-2'); setTimeout(() => cartIcon.classList.remove('-translate-y-2'), 200); }
}

window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('sapna_cart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const countEl = document.getElementById('cart-count');
    const itemsEl = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if(!countEl || !itemsEl) return;

    countEl.innerText = cart.reduce((sum, item) => sum + item.qty, 0);
    itemsEl.innerHTML = '';
    let totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    if(cart.length === 0) {
        itemsEl.innerHTML = '<p class="text-slate-400 text-center mt-10">Your cart is empty.</p>';
        totalEl.innerText = '₹0';
        return;
    }

    cart.forEach(item => {
        itemsEl.innerHTML += `
            <div class="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                    <h4 class="font-bold text-slate-800 text-sm">${item.name}</h4>
                    <p class="text-slate-500 text-xs mt-1">₹${item.price} x ${item.qty}</p>
                </div>
                <div class="flex items-center gap-4">
                    <span class="font-extrabold text-teal-600">₹${item.price * item.qty}</span>
                    <button onclick="removeFromCart(${item.id})" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-trash text-sm"></i></button>
                </div>
            </div>
        `;
    });
    totalEl.innerText = '₹' + totalPrice;
}

// ==========================================
// NEW: CHECKOUT PAGE LOGIC
// ==========================================

// Pre-fill Checkout Page Data
function loadCheckoutPage() {
    if(!window.location.href.includes('checkout.html')) return;
    
    if(cart.length === 0) {
        alert("Your cart is empty! Redirecting to shop.");
        window.location.href = 'shop.html';
        return;
    }

    // Auto-fill logged-in user details
    const activeUser = JSON.parse(localStorage.getItem('sapna_client_user'));
    if (activeUser) {
        document.getElementById('chk-name').value = activeUser.name || '';
        document.getElementById('chk-phone').value = activeUser.phone || '';
        document.getElementById('chk-address').value = activeUser.address || '';
    }

    // Render Order Summary
    const config = JSON.parse(localStorage.getItem('sapna_config'));
    const list = document.getElementById('chk-items-list');
    let subtotal = 0;
    
    cart.forEach(item => {
        subtotal += (item.price * item.qty);
        list.innerHTML += `<div class="flex justify-between text-sm"><span>${item.qty}x ${item.name}</span><span>₹${item.price * item.qty}</span></div>`;
    });

    document.getElementById('chk-subtotal').innerText = '₹' + subtotal;
    document.getElementById('chk-fee').innerText = '₹' + config.deliveryFee;
    document.getElementById('chk-total').innerText = '₹' + (subtotal + config.deliveryFee);

    // Set minimum date to today for Home Delivery
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('chk-date').setAttribute('min', today);
}

// Toggle Home Delivery vs Pickup UI
window.toggleDeliveryMode = function() {
    const mode = document.querySelector('input[name="delivery_mode"]:checked').value;
    const config = JSON.parse(localStorage.getItem('sapna_config'));
    const totalEl = document.getElementById('chk-total');
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    if (mode === 'Home Delivery') {
        document.getElementById('home-delivery-slots').classList.remove('hidden');
        document.getElementById('self-pickup-notice').classList.add('hidden');
        document.getElementById('chk-address').setAttribute('required', 'true');
        document.getElementById('chk-fee').innerText = '₹' + config.deliveryFee;
        totalEl.innerText = '₹' + (subtotal + config.deliveryFee);
    } else {
        document.getElementById('home-delivery-slots').classList.add('hidden');
        document.getElementById('self-pickup-notice').classList.remove('hidden');
        document.getElementById('chk-address').removeAttribute('required');
        document.getElementById('chk-fee').innerText = '₹0 (Free)';
        totalEl.innerText = '₹' + subtotal; // No delivery fee for pickup
    }
}

// Submit the Order
window.submitOrder = function(e) {
    e.preventDefault();
    if(cart.length === 0) return;

    const name = document.getElementById('chk-name').value;
    const phone = document.getElementById('chk-phone').value;
    const altPhone = document.getElementById('chk-alt-phone').value;
    const mode = document.querySelector('input[name="delivery_mode"]:checked').value;
    const config = JSON.parse(localStorage.getItem('sapna_config'));

    if(!name || !phone) { alert("Name and Primary Phone are required."); return; }

    let deliveryTimeStr = "Within 3 hours of booking";
    let address = "Store Pickup";
    let finalFee = 0;

    if (mode === 'Home Delivery') {
        const date = document.getElementById('chk-date').value;
        const time = document.getElementById('chk-time').value;
        address = document.getElementById('chk-address').value;
        if(!date || !time || !address) { alert("Please select a date, time slot, and enter your address."); return; }
        deliveryTimeStr = `${date} | ${time}`;
        finalFee = parseInt(config.deliveryFee);
    }

    const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const total = subtotal + finalFee;
    const itemsString = cart.map(item => `${item.qty}x ${item.name}`).join(', ');

    // Generate WhatsApp Link
    let waMessage = `*Sapna Home Needs - New Order: ${orderId}*%0A%0A`;
    waMessage += `*Customer:* ${name}%0A*Phone:* ${phone} ${altPhone ? `(Alt: ${altPhone})` : ''}%0A`;
    waMessage += `*Type:* ${mode}%0A*Slot:* ${deliveryTimeStr}%0A`;
    if(mode === 'Home Delivery') waMessage += `*Address:* ${address}%0A`;
    waMessage += `%0A*Items:*%0A`;
    cart.forEach(item => { waMessage += `- ${item.qty}x ${item.name} (₹${item.price * item.qty})%0A`; });
    waMessage += `%0A*Total Paid:* ₹${total}%0A%0APlease confirm my order!`;

    const waUrl = `https://wa.me/917676808068?text=${waMessage}`;

    // Save to Admin Orders Database
    const existingOrders = JSON.parse(localStorage.getItem('sapna_orders')) || [];
    existingOrders.unshift({ id: orderId, name: name, items: itemsString, total: total, status: "Pending" });
    localStorage.setItem('sapna_orders', JSON.stringify(existingOrders));

    // Save Receipt Data for receipt.html
    const receiptData = { orderId, method: mode, time: deliveryTimeStr, total, waUrl };
    localStorage.setItem('sapna_current_receipt', JSON.stringify(receiptData));

    // Clear Cart & Redirect
    localStorage.removeItem('sapna_cart');
    cart = [];
    window.location.href = 'receipt.html';
}

// ==========================================
// NEW: RECEIPT PAGE LOGIC
// ==========================================
function loadReceiptPage() {
    if(!window.location.href.includes('receipt.html')) return;
    const receipt = JSON.parse(localStorage.getItem('sapna_current_receipt'));
    if(!receipt) { window.location.href = 'index.html'; return; }

    document.getElementById('rec-id').innerText = receipt.orderId;
    document.getElementById('rec-method').innerText = receipt.method;
    document.getElementById('rec-time').innerText = receipt.time;
    document.getElementById('rec-total').innerText = '₹' + receipt.total;
    
    window.sendWhatsAppReceipt = function() {
        window.open(receipt.waUrl, '_blank');
    }
}

// (The rest of your code: loadShopProducts, loadLiveOffers, processAuth, OTP, Client Settings remain identical here. Just append them to the bottom of app.js)

// Load Shop Products (For shop.html)
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

// Run functions when the page loads
document.addEventListener('DOMContentLoaded', () => { 
    initializeData(); 
    loadLiveOffers(); 
    loadShopProducts(); 
    updateCartUI(); 
    loadCheckoutPage(); 
    loadReceiptPage(); 
});

// Auth & Client Settings Logic (Retained from previous code)
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
