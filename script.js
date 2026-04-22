// بيانات الربط مع Google Sheets و Google Forms
const sheetID = '12XnQD1ne4fu7Q56v-RVzFVMFDCY4p18C22pzyBsBoeg';
const base = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;
const actionUrl = "https://docs.google.com/forms/d/e/1FAIpQLScLPaeCxP_gUJBPRTiV0IzcnNhoFWlOkTiQV6TpaauW-3jjSQ/formResponse";

let allProducts = [];
let cart = [];
let totalCartPrice = 0;

// 1. دالة التحميل الرئيسية
async function init() {
    try {
        const response = await fetch(base);
        const text = await response.text();
        const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
        const rows = json.table.rows;

        // تحويل البيانات من الشيت إلى مصفوفة كائنات
        allProducts = rows.map(r => ({
            name: r.c[1]?.v || "منتج بدون اسم",
            price: parseFloat(r.c[2]?.v) || 0,
            stock: parseInt(r.c[3]?.v) || 0,
            type: r.c[4]?.v || "عام",
            img: formatImg(r.c[5]?.v)
        })).filter(p => p.name !== "Name");

        document.getElementById('status-msg').style.display = 'none';
        renderProducts(allProducts);
        setupCategories();
    } catch (err) {
        console.error("خطأ في تحميل البيانات:", err);
        document.getElementById('status-msg').innerText = "حدث خطأ في تحميل المنتجات.";
    }
}

// 2. دالة عرض المنتجات في الصفحة
function renderProducts(data) {
    const grid = document.getElementById('main-grid');
    grid.innerHTML = data.map(p => `
        <div class="product-card">
            <img src="${p.img}" class="product-img" onclick="openImageModal('${p.img}')" alt="${p.name}">
            ${getStockBadge(p.stock)}
            <div class="product-type">${p.type}</div> 
            <div class="product-title">${p.name}</div>
            <div class="price-tag">${p.price.toLocaleString()} د.ع</div>
            <button class="add-btn" onclick="addToCart('${p.name}', ${p.price}, event)" ${p.stock <= 0 ? 'disabled' : ''}>
                ${p.stock > 0 ? 'إضافة للسلة' : 'نفذ المخزون'}
            </button>
        </div>
    `).join('');
}

// 3. دوال حالة المخزون
function getStockBadge(qty) {
    if (qty > 10) return `<span class="stock-badge status-good">متوفر</span>`;
    if (qty > 0) return `<span class="stock-badge status-low">كمية قليلة</span>`;
    return `<span class="stock-badge status-out">نفذ المخزون</span>`;
}

// 4. منطق السلة (إضافة وتحديث)
function addToCart(name, price, event) {
    totalCartPrice += price;
    const item = cart.find(i => i.name === name);
    if (item) {
        item.quantity++;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    updateCartUI();
    
    // تأثير بصري بسيط عند الإضافة
    const originalText = event.target.innerText;
    event.target.innerText = "✓ تمت الإضافة";
    setTimeout(() => event.target.innerText = originalText, 800);
}

function updateCartUI() {
    document.getElementById('cart-total').innerText = totalCartPrice.toLocaleString() + " د.ع";
    document.getElementById('cart-count').innerText = cart.reduce((s, i) => s + i.quantity, 0);
}

// 5. التحكم في النوافذ المنبثقة (Popups)
function handleCheckout() {
    if (cart.length === 0) {
        alert("السلة فارغة، يرجى إضافة منتجات أولاً.");
        return;
    }
    document.getElementById('checkoutModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('checkoutModal').style.display = 'none';
}

function openImageModal(src) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('imgFull');
    modal.style.display = "block";
    modalImg.src = src;
}

function closeImageModal() {
    document.getElementById('imageModal').style.display = "none";
}

// 6. إرسال الطلب إلى Google Form
document.getElementById('orderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('.submit-order-btn');
    btn.innerText = "جاري الإرسال...";
    btn.disabled = true;

    const formData = new URLSearchParams();
    formData.append('entry.452117410', document.getElementById('custName').value);
    formData.append('entry.904354936', document.getElementById('custCity').value);
    formData.append('entry.71483428', document.getElementById('custPhone').value);
    formData.append('entry.86186808', document.getElementById('custEmail').value);
    
    // تجميع تفاصيل السلة
    const cartDetails = cart.map(i => `${i.name} (x${i.quantity})`).join(', ');
    formData.append('entry.1776327165', cartDetails);
    formData.append('entry.130865126', totalCartPrice + " د.ع");

    try {
        await fetch(actionUrl, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        });
        alert("تم استلام طلبك بنجاح! سنتواصل معك قريباً.");
        cart = [];
        totalCartPrice = 0;
        updateCartUI();
        closeModal();
        e.target.reset();
    } catch (error) {
        alert("حدث خطأ أثناء الإرسال، يرجى المحاولة لاحقاً.");
    } finally {
        btn.innerText = "تأكيد وإرسال الطلب";
        btn.disabled = false;
    }
});

// 7. تحسين روابط الصور
function formatImg(url) {
    if (!url) return 'https://placehold.co/400x400/2d5668/D4AF37?text=ELITE';
    if (url.includes('drive.google.com')) {
        const id = url.split('id=')[1] || url.split('/d/')[1].split('/')[0];
        return `https://drive.google.com/thumbnail?id=${id}&sz=w600`;
    }
    return url;
}

// 8. البحث والتصنيفات
function filterProducts() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term));
    renderProducts(filtered);
}

function setupCategories() {
    const nav = document.getElementById('categoryNav');
    const categories = ['all', ...new Set(allProducts.map(p => p.type))];
    
    nav.innerHTML = categories.map(cat => `
        <div class="cat-chip ${cat === 'all' ? 'active' : ''}" 
             onclick="filterByCategory('${cat}', event)">
            ${cat === 'all' ? 'الكل' : cat}
        </div>
    `).join('');
}

function filterByCategory(cat, event) {
    document.querySelectorAll('.cat-chip').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
    
    if (cat === 'all') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.type === cat);
        renderProducts(filtered);
    }
}

// تشغيل الموقع
init();
