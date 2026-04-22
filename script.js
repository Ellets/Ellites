const sheetID = '12XnQD1ne4fu7Q56v-RVzFVMFDCY4p18C22pzyBsBoeg';
const base = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;

let allProducts = [];
let cart = []; // مصفوفة لتخزين محتويات السلة
let totalCartPrice = 0;

// Utility: Fix Drive Image Links
function getDirectImgUrl(url) {
    if (!url) return 'https://placehold.co/400x400/251b23/db5b34?text=ELITES';
    if (url.includes('drive.google.com')) {
        let id = "";
        if (url.includes('/d/')) id = url.split('/d/')[1].split('/')[0];
        else if (url.includes('id=')) id = url.split('id=')[1].split('&')[0];
        return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
    }
    return url;
}

function getStockStatus(qty) {
    const n = parseInt(qty) || 0;
    if (n <= 0) return { label: "نفذت الكمية", class: "status-out", off: true };
    if (n <= 5) return { label: "كمية محدودة", class: "status-low", off: false };
    return { label: "متوفر بجودة", class: "status-good", off: false };
}

async function init() {
    try {
        const res = await fetch(base);
        const text = await res.text();
        const json = JSON.parse(text.substring(text.indexOf("(") + 1, text.lastIndexOf(")")));
        const rows = json.table.rows;

        allProducts = rows.map(r => {
            if (!r.c[1] || r.c[1].v === "Name" || r.c[1].v === "name") return null;
            return {
                name: r.c[1]?.v || "منتج",
                price: parseFloat(r.c[2]?.v) || 0,
                qty: r.c[3]?.v || 0,
                type: r.c[4]?.v || "عام",
                img: getDirectImgUrl(r.c[5]?.v),
                cat: (r.c[6]?.v || "other").toLowerCase(),
                featured: r.c[7]?.v === "TRUE" || r.c[7]?.v === true
            };
        }).filter(p => p !== null);

        generateDynamicButtons();
        renderProducts(allProducts);
    } catch (e) { console.error("Data loading failed", e); }
}

function generateDynamicButtons() {
    const nav = document.getElementById('categoryNav');
    if (!nav) return;
    const types = [...new Set(allProducts.map(p => p.type))].filter(t => t);
    nav.innerHTML = `<div class="cat-chip active" onclick="filterByPageType('all', event)">الكل</div>`;
    types.forEach(t => {
        nav.innerHTML += `<div class="cat-chip" onclick="filterByPageType('${t}', event)">${t}</div>`;
    });
}

function filterByPageType(type, e) {
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    if (e && e.target) e.target.classList.add('active');
    renderProducts(type === 'all' ? allProducts : allProducts.filter(p => p.type === type));
}

function renderProducts(data) {
    const mGrid = document.getElementById('main-grid');
    const fGrid = document.getElementById('featured-grid');
    const fSec = document.getElementById('featured-section');
    if (mGrid) mGrid.innerHTML = ""; 
    if (fGrid) fGrid.innerHTML = "";
    let fCount = 0;

    data.forEach(p => {
        const s = getStockStatus(p.qty);
        const cardHtml = `
            <div class="product-card" style="${s.off ? 'opacity:0.7' : ''}">
                <img src="${p.img}" class="product-img" onclick="expandImage('${p.img}')" onerror="this.src='https://placehold.co/400x400/251b23/db5b34?text=ELITES'">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="stock-badge ${s.class}">${s.label}</span>
                    <span style="font-size:0.65rem; color:var(--accent); font-weight:bold;">${p.type}</span>
                </div>
                <div class="product-title">${p.name}</div>
                <div class="price-tag">${s.off ? '---' : p.price.toLocaleString() + ' د.ع'}</div>
                <button class="add-btn ${s.off ? 'btn-disabled' : ''}" ${s.off ? 'disabled' : ''} 
                    onclick="addToCart('${p.name}', ${p.price}, event)">
                    ${s.off ? 'غير متوفر' : 'إضافة للسلة'}
                </button>
            </div>`;
        if (mGrid) mGrid.innerHTML += cardHtml;
        if (p.featured && fGrid) { fGrid.innerHTML += cardHtml; fCount++; }
    });
    if (fSec) fSec.style.display = fCount > 0 ? 'block' : 'none';
}

// إضافة للسلة مع تخزين تفاصيل المنتج
function addToCart(name, price, event) {
    totalCartPrice += price;
    
    // التحقق إذا كان المنتج موجود مسبقاً لزيادة الكمية
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ name: name, price: price, quantity: 1 });
    }

    document.getElementById('cart-total').innerText = totalCartPrice.toLocaleString() + " د.ع";
    document.getElementById('cart-count').innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const btn = event.target;
    const oldText = btn.innerText;
    btn.innerText = "✓ تم";
    btn.style.background = "#27ae60";
    setTimeout(() => { btn.innerText = oldText; btn.style.background = ""; }, 800);
}

// دالة اتمام الطلب والتحويل لصفحة Requests
function handleCheckout() {
    if (cart.length === 0) {
        alert("السلة فارغة! أضف بعض المنتجات أولاً.");
        return;
    }

    let summary = "🛒 طلب جديد من المتجر:\n";
    summary += "--------------------------\n";
    cart.forEach(item => {
        summary += `• ${item.name} (${item.quantity}x) - ${ (item.price * item.quantity).toLocaleString() } د.ع\n`;
    });
    summary += "--------------------------\n";
    summary += `💰 المجموع الكلي: ${totalCartPrice.toLocaleString()} د.ع`;

    const encodedData = encodeURIComponent(summary);
    // سيفتح صفحة requests.html في تاب جديد ويمرر البيانات
    window.open(`requests.html?order=${encodedData}`, '_blank');
}

// ربط الزر بالدالة
document.querySelector('.checkout-btn').addEventListener('click', handleCheckout);

function expandImage(src) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('expandedImg');
    if (modal && modalImg) {
        modal.style.display = "block";
        modalImg.src = src;
    }
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) modal.style.display = "none";
}

function filterProducts() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    const q = input.value.toLowerCase();
    renderProducts(allProducts.filter(p => p.name.toLowerCase().includes(q)));
}

init();
