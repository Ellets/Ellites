const sheetID = '12XnQD1ne4fu7Q56v-RVzFVMFDCY4p18C22pzyBsBoeg';
const base = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;

let allProducts = [];
let totalCartPrice = 0;
let cartItemCount = 0;

// Utility: Fix Drive Image Links & Fallback
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

// Utility: Stock Level UI Logic
function getStockStatus(qty) {
    const n = parseInt(qty) || 0;
    if (n <= 0) return { label: "نفذت الكمية", class: "status-out", off: true };
    if (n <= 5) return { label: "كمية محدودة", class: "status-low", off: false };
    return { label: "متوفر بجودة", class: "status-good", off: false };
}

// Fetch and Map Data
async function init() {
    try {
        const res = await fetch(base);
        const text = await res.text();
        const json = JSON.parse(text.substring(text.indexOf("(") + 1, text.lastIndexOf(")")));
        const rows = json.table.rows;

        allProducts = rows.map(r => ({
            name: r.c[0]?.v || "منتج",
            price: parseFloat(r.c[1]?.v) || 0,
            qty: r.c[2]?.v || 0,
            type: r.c[3]?.v || "عام",             // Column D
            img: getDirectImgUrl(r.c[4]?.v),       // Column E
            cat: (r.c[5]?.v || "other").toLowerCase(), // Column F
            featured: r.c[6]?.v === "TRUE" || r.c[6]?.v === true // Column G
        }));

        generateDynamicButtons();
        renderProducts(allProducts);
    } catch (e) { console.error("Data loading failed", e); }
}

// Build dynamic filters from "Type" column
function generateDynamicButtons() {
    const nav = document.getElementById('categoryNav');
    if (!nav) return;
    const types = [...new Set(allProducts.map(p => p.type))].filter(t => t);
    
    nav.innerHTML = `<div class="cat-chip active" onclick="filterByPageType('all', event)">الكل</div>`;
    types.forEach(t => {
        nav.innerHTML += `<div class="cat-chip" onclick="filterByPageType('${t}', event)">${t}</div>`;
    });
}

// Filter Logic
function filterByPageType(type, e) {
    document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');
    renderProducts(type === 'all' ? allProducts : allProducts.filter(p => p.type === type));
}

// UI Rendering
function renderProducts(data) {
    const mGrid = document.getElementById('main-grid');
    const fGrid = document.getElementById('featured-grid');
    const fSec = document.getElementById('featured-section');
    
    mGrid.innerHTML = ""; fGrid.innerHTML = "";
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
                <button class="add-btn ${s.off ? 'btn-disabled' : ''}" ${s.off ? 'disabled' : ''} onclick="addToCart(${p.price}, event)">
                    ${s.off ? 'غير متوفر' : 'إضافة للسلة'}
                </button>
            </div>`;
        
        mGrid.innerHTML += cardHtml;
        if(p.featured) { fGrid.innerHTML += cardHtml; fCount++; }
    });
    if (fSec) fSec.style.display = fCount > 0 ? 'block' : 'none';
}

// Image Expansion (Modal)
function expandImage(src) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('expandedImg');
    modal.style.display = "block";
    modalImg.src = src;
}

function closeModal() {
    document.getElementById('imageModal').style.display = "none";
}

// Cart Functionality
function addToCart(price, event) {
    totalCartPrice += price;
    cartItemCount++;
    document.getElementById('cart-total').innerText = totalCartPrice.toLocaleString() + " د.ع";
    document.getElementById('cart-count').innerText = cartItemCount;
    
    const btn = event.target;
    const oldText = btn.innerText;
    btn.innerText = "✓";
    btn.style.background = "#27ae60";
    setTimeout(() => { btn.innerText = oldText; btn.style.background = ""; }, 800);
}

// Search Logic
function filterProducts() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    renderProducts(allProducts.filter(p => p.name.toLowerCase().includes(q)));
}

init();
