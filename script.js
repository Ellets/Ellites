// ... المتغيرات العلوية و init تبقى كما هي ...

function renderProducts(data) {
    const grid = document.getElementById('main-grid');
    grid.innerHTML = data.map(p => `
        <div class="product-card">
            <img src="${p.img}" class="product-img" onclick="openImageModal('${p.img}')">
            ${getStockBadge(p.stock)}
            <div class="product-type">${p.type}</div> 
            <div class="product-title">${p.name}</div>
            <div class="price-tag">${p.price.toLocaleString()} د.ع</div>
            <button class="add-btn" onclick="addToCart('${p.name}', ${p.price}, event)" ${p.stock <= 0 ? 'disabled' : ''}>
                ${p.stock > 0 ? 'إضافة للسلة' : 'غير متوفر'}
            </button>
        </div>
    `).join('');
}

// دالة فتح نافذة الطلب (تأكد من وجود ID checkoutModal في HTML)
function handleCheckout() {
    const modal = document.getElementById('checkoutModal');
    if (cart.length === 0) { alert("السلة فارغة"); return; }
    if (modal) modal.style.display = 'block';
}

function closeModal() { document.getElementById('checkoutModal').style.display = 'none'; }

function openImageModal(src) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('imgFull');
    if(modal) {
        modal.style.display = "block";
        modalImg.src = src;
    }
}
function closeImageModal() { document.getElementById('imageModal').style.display = "none"; }

// ... بقية الدوال (addToCart, updateCartUI, formatImg) تبقى كما هي ...
