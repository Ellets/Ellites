const sheetID = '12XnQD1ne4fu7Q56v-RVzFVMFDCY4p18C22pzyBsBoeg';
const base = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;
const actionUrl = "https://docs.google.com/forms/d/e/1FAIpQLScLPaeCxP_gUJBPRTiV0IzcnNhoFWlOkTiQV6TpaauW-3jjSQ/formResponse";

let allProducts = [];
let cart = [];
let totalCartPrice = 0;

// تحميل البيانات الأولية
async function init() {
    try {
        const response = await fetch(base);
        const text = await response.text();
        const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
        const rows = json.table.rows;

        allProducts = rows.map(r => {
            if (!r.c[1] || r.c[1].v === "Name") return null;
            return {
                name: r.c[1]?.v || "منتج",
                price: parseFloat(r.c[2]?.v) || 0,
                type: r.c[4]?.v || "عام",
                img: formatImg(r.c[5]?.v)
            };
        }).filter(p => p !== null);

        document.getElementById('status-msg').style.display = 'none';
        renderCategories();
        renderProducts(allProducts);
    } catch (err) {
        document.getElementById('status-msg').innerText = "خطأ في تحميل البيانات";
    }
}

function handleCheckout() {
    if (cart.length === 0) { alert("السلة فارغة"); return; }
    document.getElementById('checkoutModal').style.display = 'block';
    
    // استرجاع البيانات المخزنة
    ['custName', 'custCity', 'custPhone', 'custEmail'].forEach(id => {
        document.getElementById(id).value = localStorage.getItem(id) || '';
    });
}

function closeModal() { document.getElementById('checkoutModal').style.display = 'none'; }

// إغلاق النافذة عند الضغط خارجها
window.onclick = function(e) {
    if (e.target == document.getElementById('checkoutModal')) closeModal();
}

document.getElementById('orderForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('custName').value;
    const city = document.getElementById('custCity').value;
    const phone = document.getElementById('custPhone').value;
    const email = document.getElementById('custEmail').value;

    // حفظ البيانات
    localStorage.setItem('custName', name);
    localStorage.setItem('custCity', city);
    localStorage.setItem('custPhone', phone);
    localStorage.setItem('custEmail', email);

    let summary = "";
    cart.forEach(i => summary += `${i.name} (x${i.quantity}), `);
    const finalTotal = totalCartPrice.toLocaleString() + " د.ع";

    // إرسال البيانات باستخدام الـ IDs الستة التي استخرجتها
    const formData = new URLSearchParams();
    formData.append('entry.452117410', name);      // الاسم
    formData.append('entry.904354936', city);      // المدينة
    formData.append('entry.71483428', phone);       // الهاتف
    formData.append('entry.86186808', email);       // الإيميل
    formData.append('entry.1776327165', summary);    // المنتجات
    formData.append('entry.130865126', finalTotal); // المجموع الكلي

    fetch(actionUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
    }).then(() => {
        alert("شكراً لك! تم استلام طلبك بنجاح.");
        cart = []; totalCartPrice = 0;
        updateCartUI();
        closeModal();
    });
});

function addToCart(name, price, event) {
    totalCartPrice += price;
    const item = cart.find(i => i.name === name);
    if (item) item.quantity++; else cart.push({name, price, quantity: 1});
    updateCartUI();
    
    const originalText = event.target.innerText;
    event.target.innerText = "✓";
    setTimeout(() => event.target.innerText = originalText, 700);
}

function updateCartUI() {
    document.getElementById('cart-total').innerText = totalCartPrice.toLocaleString() + " د.ع";
    document.getElementById('cart-count').innerText = cart.reduce((s, i) => s + i.quantity, 0);
}

function formatImg(url) {
    if (!url) return 'https://placehold.co/400x400/2d5668/D4AF37?text=ELITE';
    if (url.includes('drive.google.com')) {
        const id = url.split('id=')[1] || url.split('/d/')[1].split('/')[0];
        return `https://drive.google.com/thumbnail?id=${id}&sz=w600`;
    }
    return url;
}

function renderProducts(data) {
    const grid = document.getElementById('main-grid');
    grid.innerHTML = data.map(p => `
        <div class="product-card">
            <img src="${p.img}" class="product-img">
            <div style="font-weight:700; margin:10px 0; height:40px; overflow:hidden;">${p.name}</div>
            <span class="price-tag">${p.price.toLocaleString()} د.ع</span>
            <button class="add-btn" onclick="addToCart('${p.name}', ${p.price}, event)">إضافة للسلة</button>
        </div>
    `).join('');
}

function renderCategories() {
    const nav = document.getElementById('categoryNav');
    const types = [...new Set(allProducts.map(p => p.type))].filter(t => t);
    types.forEach(t => {
        nav.innerHTML += `<div class="cat-chip" onclick="filterByPageType('${t}', event)">${t}</div>`;
    });
}

function filterByPageType(type, e) {
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    renderProducts(type === 'all' ? allProducts : allProducts.filter(p => p.type === type));
}

function filterProducts() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    renderProducts(allProducts.filter(p => p.name.toLowerCase().includes(q)));
}

init();
