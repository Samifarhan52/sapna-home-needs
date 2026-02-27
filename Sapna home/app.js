// app.js - Global Engine for Sapna Home Needs

let cart = [];
let pendingOTP = null;
let pendingUserData = null;
let authAction = null; // 'login' or 'signup'

// 1. Initialize Database (Users, Inventory, Config)
function initializeData() {
    // Basic Settings
    if(!localStorage.getItem('sapna_config')) {
        localStorage.setItem('sapna_config', JSON.stringify({
            storeOpen: true,
            requireOTP: true,
            deliveryFee: 20
        }));
    }
    // Users Database
    if(!localStorage.getItem('sapna_users')) {
        localStorage.setItem('sapna_users', JSON.stringify([]));
    }
    // Inventory
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

// ==========================================
// AUTHENTICATION & OTP SYSTEM
// ==========================================

function processAuth(e, action) {
    e.preventDefault();
    const config = JSON.parse(localStorage.getItem('sapna_config'));
    const users = JSON.parse(localStorage.getItem('sapna_users'));

    if (action === 'signup') {
        const name = document.getElementById('reg-name').value;
        const phone = document.getElementById('reg-phone').value;
        const pass = document.getElementById('reg-pass').value;

        if(users.find(u => u.phone === phone)) {
            alert("This phone number is already registered! Please log in.");
            return;
        }
        pendingUserData = { id: Date.now(), name, phone, pass, address: "" };
        authAction = 'signup';

    } else if (action === 'login') {
        const phone = document.getElementById('auth-phone').value;
        const pass = document.getElementById('auth-pass').value;

        if (phone === 'admin' && pass === 'sapna123') {
            window.location.href = 'admin.html';
            return;
        }

        const user = users.find(u => u.phone === phone && u.pass === pass);
        if(!user) {
            alert("Invalid Phone Number or Password.");
            return;
        }
        pendingUserData = user;
        authAction = 'login';
    }

    // Trigger OTP if enabled in Admin Settings
    if (config.requireOTP && phone !== 'admin') {
        triggerOTP();
    } else {
        finalizeLogin(pendingUserData);
    }
}

function triggerOTP() {
    // Generate 4 digit OTP
    pendingOTP = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Switch UI to OTP mode
    document.getElementById('auth-forms-container').classList.add('hidden');
    document.getElementById('otp-container').classList.remove('hidden');
    
    // Simulate sending SMS
    setTimeout(() => {
        alert(`🔔 SIMULATED SMS:\nYour Sapna Home Needs OTP is: ${pendingOTP}`);
    }, 500);
}

function verifyOTP(e) {
    e.preventDefault();
    const enteredOTP = document.getElementById('otp-input').value;
    
    if (enteredOTP === pendingOTP) {
        if (authAction === 'signup') {
            const users = JSON.parse(localStorage.getItem('sapna_users'));
            users.push(pendingUserData);
            localStorage.setItem('sapna_users', JSON.stringify(users));
            alert("Account created successfully!");
        }
        finalizeLogin(pendingUserData);
    } else {
        alert("Incorrect OTP. Please try again.");
    }
}

function finalizeLogin(userData) {
    localStorage.setItem('sapna_client_user', JSON.stringify(userData));
    window.location.reload(); // Reload to update UI
}

function logoutUser() {
    localStorage.removeItem('sapna_client_user');
    window.location.reload();
}

// ==========================================
// CLIENT SETTINGS SYSTEM
// ==========================================

function openClientSettings() {
    const user = JSON.parse(localStorage.getItem('sapna_client_user'));
    if(!user) return;
    
    document.getElementById('set-name').value = user.name;
    document.getElementById('set-phone').value = user.phone;
    document.getElementById('set-address').value = user.address || "";
    
    document.getElementById('client-settings-modal').classList.remove('hidden');
}

function saveClientSettings(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('sapna_client_user'));
    let users = JSON.parse(localStorage.getItem('sapna_users'));

    const updatedData = {
        ...user,
        name: document.getElementById('set-name').value,
        phone: document.getElementById('set-phone').value,
        address: document.getElementById('set-address').value
    };

    // Update active session
    localStorage.setItem('sapna_client_user', JSON.stringify(updatedData));
    
    // Update main database
    const userIndex = users.findIndex(u => u.id === user.id);
    if(userIndex > -1) {
        users[userIndex] = updatedData;
        localStorage.setItem('sapna_users', JSON.stringify(users));
    }
    
    alert("Profile updated successfully!");
    document.getElementById('client-settings-modal').classList.add('hidden');
    checkLoginStatus(); // defined in index.html
}

// Run functions when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeData();
});
