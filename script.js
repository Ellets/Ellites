const sheetID = '12XnQD1ne4fu7Q56v-RVzFVMFDCY4p18C22pzyBsBoeg';
const base = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;
const actionUrl = "https://docs.google.com/forms/d/e/1FAIpQLScLPaeCxP_gUJBPRTiV0IzcnNhoFWlOkTiQV6TpaauW-3jjSQ/formResponse";

let allProducts = [];
let cart = [];
let totalCartPrice = 0;

// تحميل المنتجات
async function init() {
    try {
        const response = await fetch(base);
        const text = await response.text();
        const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
        const rows = json.table.rows;

        allProducts = rows.map(r => ({
            name: r.c[1]?.v || "منتج",
            price: parseFloat(r.c[2]?.v) || 0,
            stock: parseInt(r.c[3]?.v) || 0, // جلب مستوى المخزون
            type: r.c[4]?.v || "عام",
            img: formatImg(r.c[5]?.v)
        })).filter(p => p.name !== "Name");

        document.getElementById('status-msg').style.display = 'none';
        renderProducts(allProducts);
    } catch (err) { console.error(err); }
}

// دالة المخزون (Badge)
function getStockBadge(qty) {
    if (qty > 10) return `<span class="stock-badge status-good">متوفر</span>`;
    if (qty > 0) return `<span class="stock-badge status-low">كمية قليلة</span>`;
    return `<span class="stock-badge status-out">نفذ المخزون</span>`;
}

function renderProducts(data) {
    const grid = document.getElementById('main-grid');
    grid.innerHTML = data.map(p => `
        <div class="product-card">
            <img src="${p.img}" class="product-img" onclick="openImageModal('${p.img}')">
            ${getStockBadge(p.stock)}
            <div class="product-title">${p.name}</div>
            <div class="price-tag">${p.price.toLocaleString()} د.ع</div>
            <button class="add-btn" onclick="addToCart('${p.name}', ${p.price}, event)" ${p.stock <= 0 ? 'disabled' : ''}>
                ${p.stock > 0 ? 'إضافة للسلة' : 'غير متوفر'}
            </button>
        </div>
    `).join('');
}

// فتح وإغلاق الـ Popup (حل الالتفاف)
function handleCheckout() {
    const modal = document.getElementById('checkoutModal');
    if (cart.length === 0) { alert("السلة فارغة"); return; }
    modal.style.display = 'block';
}

function closeModal() { document.getElementById('checkoutModal').style.display = 'none'; }

// ميزة تكبير الصور
function openImageModal(src) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('imgFull');
    modal.style.display = "block";
    modalImg.src = src;
}
function closeImageModal() { document.getElementById('imageModal').style.display = "none"; }

// إرسال الطلب (مع تجنب أخطاء الاستضافة الساكنة)
document.getElementById('orderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerText = "جاري الإرسال...";

    const formData = new URLSearchParams();
    formData.append('entry.452117410', document.getElementById('custName').value);
    formData.append('entry.904354936', document.getElementById('custCity').value);
    formData.append('entry.71483428', document.getElementById('custPhone').value);
    formData.append('entry.86186808', document.getElementById('custEmail').value);
    
    let summary = cart.map(i => `${i.name} (x${i.quantity})`).join(', ');
    formData.append('entry.1776327165', summary);
    formData.append('entry.130865126', totalCartPrice + " د.ع");

    await fetch(actionUrl, { method: 'POST', mode: 'no-cors', body: formData });
    
    alert("تم استلام طلبك!");
    cart = []; totalCartPrice = 0; updateCartUI();
    closeModal();
    btn.innerText = "تأكيد وإرسال الطلب";
});

function addToCart(name, price, event) {
    totalCartPrice += price;
    const item = cart.find(i => i.name === name);
    if (item) item.quantity++; else cart.push({name, price, quantity: 1});
    updateCartUI();
    event.target.innerText = "✓ تمت الإضافة";
    setTimeout(() => event.target.innerText = "إضافة للسلة", 800);
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

init();
