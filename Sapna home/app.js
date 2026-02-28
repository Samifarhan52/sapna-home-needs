// app.js - 3D Global Engine for Sapna Home Needs

// Safely load cart from memory
let cart = [];
try { 
    cart = JSON.parse(localStorage.getItem('sapna_cart')) || []; 
} catch (e) { 
    cart = []; 
}

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
        localStorage.setItem('sapna_inventory', JSON.stringify(initialInventory));
    }
    if(!localStorage.getItem('sapna_updates')) {
        localStorage.setItem('sapna_updates', JSON.stringify([{id: 1, badge: "Discount", title: "Onion & Potato Combo", desc: "5kg each. Farm fresh. ₹299 instead of ₹350."}]));
    }
    if(!localStorage.getItem('sapna_orders')) {
        localStorage.setItem('sapna_orders', JSON.stringify([]));
    }
}

// 2. 3D Shop Products Generator (For shop.html)
function loadShopProducts() {
    const container = document.getElementById('product-grid');
    const titleEl = document.getElementById('shop-title');
    if (!container || !titleEl) return; 

    try {
        const params = new URLSearchParams(window.location.search);
        const selectedCategory = params.get('category') || 'All';
        titleEl.innerText = selectedCategory === 'All' ? 'All Products' : selectedCategory;

        const inventory = JSON.parse(localStorage.getItem('sapna_inventory')) || [];
        container.innerHTML = ''; 
        const filteredProducts = selectedCategory === 'All' ? inventory : inventory.filter(p => p.cat === selectedCategory);

        if (filteredProducts.length === 0) {
            container.innerHTML = `<p class="text-slate-500 col-span-full text-center py-12 text-xl font-bold">No products available in this category.</p>`;
            return;
        }

        filteredProducts.forEach(product => {
            let stockWarning = product.stock < 10 ? `<span class="text-xs text-red-500 font-bold bg-red-100 px-2 py-1 rounded-lg">Only ${product.stock} left</span>` : `<span class="text-xs text-green-600 font-bold bg-green-100 px-2 py-1 rounded-lg">In Stock</span>`;
            let imageHTML = product.imgUrl 
                ? `<img src="${product.imgUrl}" alt="${product.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">`
                : `<div class="w-full h-full bg-slate-200 shadow-inner flex items-center justify-center"><i class="fa-solid fa-box text-5xl text-slate-400"></i></div>`;

            // 3D Card Classes Applied Here
            container.innerHTML += `
                <div class="tilt-card bg-white rounded-[2rem] p-5 border-2 border-slate-100 shadow-[0_10px_0_0_#e2e8f0] hover:shadow-[0_15px_0_0_#cbd5e1] hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between group">
                    <div>
                        <div class="h-40 mb-4 overflow-hidden rounded-2xl relative shadow-inner border-2 border-slate-50">${imageHTML}</div>
                        <h3 class="font-bold text-lg text-slate-800 leading-tight mb-1">${product.name}</h3>
                        <p class="text-slate-400 text-xs mb-4 uppercase tracking-wider font-bold">${product.cat}</p>
                    </div>
                    <div class="flex justify-between items-end">
                        <div>
                            <div class="font-extrabold text-2xl text-teal-600 drop-shadow-sm">₹${product.price}</div>
                            <div class="mt-1">${stockWarning}</div>
                        </div>
                        <button onclick="addToCart(${product.id})" class="bg-teal-500 text-white w-12 h-12 rounded-2xl border-b-[6px] border-teal-700 hover:bg-teal-400 active:border-b-0 active:translate-y-[6px] transition-all flex items-center justify-center shadow-lg">
                            <i class="fa-solid fa-plus text-xl"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        // Re-initialize VanillaTilt for dynamically added cards
        if(typeof VanillaTilt !== 'undefined') {
            VanillaTilt.init(document.querySelectorAll(".tilt-card"), { max: 10, speed: 400, glare: true, "max-glare": 0.2 });
        }
    } catch (e) { console.error(e); }
}

// 3. 3D Live Offers (For index.html)
function loadLiveOffers() {
    const container = document.getElementById('live-offers-container');
    if (!container) return; 
    try {
        const updates = JSON.parse(localStorage.getItem('sapna_updates')) || [];
        container.innerHTML = ''; 
        if (updates.length === 0) return;
        
        updates.forEach(offer => {
            let badgeColor = offer.badge.toLowerCase().includes('bogo') ? 'bg-amber-500 text-white' : 'bg-teal-500 text-white';
            container.innerHTML += `
                <div data-aos="zoom-in" class="bg-white rounded-[2rem] p-6 border-2 border-slate-100 shadow-[0_12px_0_0_#e2e8f0] relative overflow-hidden group">
                    <div class="absolute -right-10 -top-10 w-32 h-32 bg-teal-100 rounded-full blur-2xl opacity-50 group-hover:bg-amber-100 transition-colors"></div>
                    <div class="flex justify-between items-start mb-6 relative z-10">
                        <span class="${badgeColor} text-xs font-bold px-4 py-2 rounded-xl uppercase tracking-wider shadow-sm">${offer.badge}</span>
                        <div class="p-3 bg-slate-50 shadow-inner rounded-2xl group-hover:-translate-y-1 transition-transform"><i class="fa-solid fa-tags text-2xl text-teal-500"></i></div>
                    </div>
                    <h3 class="text-2xl font-extrabold mb-2 text-slate-800 relative z-10">${offer.title}</h3>
                    <p class="text-slate-500 text-sm mb-6 font-medium relative z-10">${offer.desc}</p>
                    <a href="shop.html?category=All" class="inline-flex items-center gap-2 bg-slate-900 text-white font-bold py-3 px-6 rounded-xl border-b-[4px] border-slate-700 hover:bg-slate-800 active:border-b-0 active:translate-y-[4px] transition-all relative z-10">
                        Claim Offer <i class="fa-solid fa-arrow-right"></i>
                    </a>
                </div>
            `;
        });
    } catch(e) { console.error(e); }
}

// 4. Cart Logic (3D UI + Auto-fill)
window.toggleCart = function() {
    const modal = document.getElementById('cart-modal');
    const panel = document.getElementById('cart-panel');
    if(!modal || !panel) return;
    
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
    if(cartIcon) { 
        cartIcon.classList.add('-translate-y-3', 'scale-110'); 
        setTimeout(() => cartIcon.classList.remove('-translate-y-3', 'scale-110'), 300); 
    }
}

window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('sapna_cart', JSON.stringify(cart));
    updateCartUI();
}

window.updateCartUI = function() {
    const countEl = document.getElementById('cart-count');
    const itemsEl = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    
    if(countEl) countEl.innerText = cart.reduce((sum, item) => sum + item.qty, 0);
    if(!itemsEl || !totalEl) return;
    
    itemsEl.innerHTML = '';
    let totalPrice = 0;

    if(cart.length === 0) {
        itemsEl.innerHTML = `
            <div class="text-center mt-20 opacity-50">
                <i class="fa-solid fa-cart-shopping text-6xl text-slate-300 mb-4 drop-shadow-md"></i>
                <p class="text-slate-500 font-bold text-lg">Your Cart is empty.</p>
            </div>`;
        totalEl.innerText = '₹0';
        return;
    }

    cart.forEach(item => {
        let itemTotal = item.price * item.qty;
        totalPrice += itemTotal;
        itemsEl.innerHTML += `
            <div class="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-[0_4px_0_0_#e2e8f0] flex justify-between items-center mb-4">
                <div>
                    <h4 class="font-extrabold text-slate-800 text-sm">${item.name}</h4>
                    <p class="text-slate-500 text-xs mt-1 font-bold bg-slate-100 px-2 py-1 rounded-md inline-block">₹${item.price} x ${item.qty}</p>
                </div>
                <div class="flex items-center gap-4">
                    <span class="font-extrabold text-teal-600 text-lg">₹${itemTotal}</span>
                    <button onclick="removeFromCart(${item.id})" class="w-8 h-8 bg-red-100 text-red-500 rounded-xl hover:bg-red-500 hover:text-white border-b-[3px] border-red-200 hover:border-red-700 active:border-b-0 active:translate-y-[3px] transition-all flex items-center justify-center">
                        <i class="fa-solid fa-trash text-xs"></i>
                    </button>
                </div>
            </div>
        `;
    });
    totalEl.innerText = '₹' + totalPrice;
}

// 5. Checkout Page Logic (checkout.html)
window.loadCheckoutPage = function() {
    if(!window.location.href.includes('checkout.html')) return;
    
    if(cart.length === 0) {
        alert("Your cart is empty! Redirecting to shop.");
        window.location.href = 'shop.html';
        return;
    }

    // Auto-fill logged-in user details
    const activeUser = JSON.parse(localStorage.getItem('sapna_client_user'));
    if (activeUser) {
        if(document.getElementById('chk-name')) document.getElementById('chk-name').value = activeUser.name || '';
        if(document.getElementById('chk-phone')) document.getElementById('chk-phone').value = activeUser.phone || '';
        if(document.getElementById('chk-address')) document.getElementById('chk-address').value = activeUser.address || '';
    }

    // Render Order Summary
    const config = JSON.parse(localStorage.getItem('sapna_config')) || { deliveryFee: 20 };
    const list = document.getElementById('chk-items-list');
    let subtotal = 0;
    
    if(list) {
        list.innerHTML = '';
        cart.forEach(item => {
            subtotal += (item.price * item.qty);
            list.innerHTML += `<div class="flex justify-between text-sm text-slate-300"><span>${item.qty}x ${item.name}</span><span>₹${item.price * item.qty}</span></div>`;
        });
        document.getElementById('chk-subtotal').innerText = '₹' + subtotal;
        document.getElementById('chk-fee').innerText = '₹' + config.deliveryFee;
        document.getElementById('chk-total').innerText = '₹' + (subtotal + config.deliveryFee);
    }

    // Set minimum date to today
    const dateInput = document.getElementById('chk-date');
    if(dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
}

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
        totalEl.innerText = '₹' + subtotal; 
    }
}

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

    // Format WhatsApp Message
    let waMessage = `*Sapna Home Needs - New Order: ${orderId}*%0A%0A`;
    waMessage += `*Customer:* ${name}%0A*Phone:* ${phone} ${altPhone ? `(Alt: ${altPhone})` : ''}%0A`;
    waMessage += `*Type:* ${mode}%0A*Slot:* ${deliveryTimeStr}%0A`;
    if(mode === 'Home Delivery') waMessage += `*Address:* ${address}%0A`;
    waMessage += `%0A*Items:*%0A`;
    cart.forEach(item => { waMessage += `- ${item.qty}x ${item.name} (₹${item.price * item.qty})%0A`; });
    waMessage += `%0A*Total Paid:* ₹${total}%0A%0APlease confirm my order!`;

    const waUrl = `https://wa.me/917676808068?text=${waMessage}`;

    // Save Order to Admin LocalStorage
    const existingOrders = JSON.parse(localStorage.getItem('sapna_orders')) || [];
    existingOrders.unshift({ id: orderId, name: name, items: itemsString, total: total, status: "Pending" });
    localStorage.setItem('sapna_orders', JSON.stringify(existingOrders));

    // Save Receipt Details for the next page
    const receiptData = { orderId, method: mode, time: deliveryTimeStr, total, waUrl };
    localStorage.setItem('sapna_current_receipt', JSON.stringify(receiptData));

    // Empty Cart and Go to Receipt
    localStorage.removeItem('sapna_cart');
    cart = [];
    window.location.href = 'receipt.html';
}

// 6. Receipt Logic (receipt.html)
window.loadReceiptPage = function() {
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

// 7. Auth & OTP Logic (index.html)
window.processAuth = function(e, action) {
    e.preventDefault(); 
    
    const config = JSON.parse(localStorage.getItem('sapna_config')) || { requireOTP: true };
    const users = JSON.parse(localStorage.getItem('sapna_users')) || [];

    if (action === 'signup') {
        const name = document.getElementById('reg-name').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const pass = document.getElementById('reg-pass').value;
        
        if(users.find(u => u.phone === phone)) { 
            alert("Phone already registered. Please log in."); 
            return; 
        }
        pendingUserData = { id: Date.now(), name, phone, pass, address: "" };
        authAction = 'signup';
        
    } else if (action === 'login') {
        // Automatically make it lowercase and remove accidental spaces
        const phone = document.getElementById('auth-phone').value.trim().toLowerCase();
        const pass = document.getElementById('auth-pass').value;
        
        // ADMIN LOGIN CHECK (Fixed for lowercase/spaces)
        if (phone === 'admin' && pass === 'sapna123') { 
            window.location.href = 'admin.html'; 
            return; 
        }
        
        // CLIENT LOGIN CHECK
        const user = users.find(u => u.phone === phone && u.pass === pass);
        if(!user) { 
            alert("Invalid Credentials. Please try again."); 
            return; 
        }
        pendingUserData = user;
        authAction = 'login';
    }

    if (config.requireOTP) { 
        triggerOTP(); 
    } else { 
        finalizeLogin(pendingUserData); 
    }
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
            const users = JSON.parse(localStorage.getItem('sapna_users')) || [];
            users.push(pendingUserData);
            localStorage.setItem('sapna_users', JSON.stringify(users));
            alert("Account created successfully!");
        }
        finalizeLogin(pendingUserData);
    } else { alert("Incorrect OTP. Please try again."); }
}

function finalizeLogin(userData) {
    localStorage.setItem('sapna_client_user', JSON.stringify(userData));
    window.location.reload();
}

window.logoutUser = function() {
    localStorage.removeItem('sapna_client_user');
    window.location.reload();
}

// 8. Client Settings
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
    let users = JSON.parse(localStorage.getItem('sapna_users')) || [];
    
    const updatedData = { 
        ...user, 
        name: document.getElementById('set-name').value, 
        address: document.getElementById('set-address').value 
    };
    
    localStorage.setItem('sapna_client_user', JSON.stringify(updatedData));
    
    const userIndex = users.findIndex(u => u.id === user.id);
    if(userIndex > -1) { 
        users[userIndex] = updatedData; 
        localStorage.setItem('sapna_users', JSON.stringify(users)); 
    }
    
    alert("Profile saved successfully!");
    document.getElementById('client-settings-modal').classList.add('hidden');
    document.getElementById('client-settings-modal').classList.remove('flex');
    if(typeof checkLoginStatus === 'function') checkLoginStatus(); 
}

// --- MASTER LOADER ---
// This runs automatically when ANY page loads to trigger the right functions.
document.addEventListener('DOMContentLoaded', () => { 
    initializeData(); 
    loadLiveOffers(); 
    loadShopProducts(); 
    updateCartUI();
    loadCheckoutPage();
    loadReceiptPage();
});
