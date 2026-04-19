const sheetID = '12XnQD1ne4fu7Q56v-RVzFVMFDCY4p18C22pzyBsBoeg';
const base = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;

let allProducts = [];
let totalCartPrice = 0;
let cartItemCount = 0;

// Utility: Fix Drive Image Links & Fallback
function getDirectImgUrl(url) {
    if (!url || typeof url !== 'string') return 'https://placehold.co/400x400/251b23/db5b34?text=ELITES';
    
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
        
        // Robust cleaning of Google's JSON wrapper
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        const json = JSON.parse(text.substring(start, end + 1));
        const rows = json.table.rows;

        allProducts = rows.map(r => {
            // SKIP header row and handle the shift:
            // Column A (r.c[0]) is Timestamp
            // Column B (r.c[1]) is Name
            if (!r.c[1] || r.c[1].v === "Name" || r.c[1].v === "name") return null;

            return {
                name: r.c[1]?.v || "منتج",            // Column B
                price: parseFloat(r.c[2]?.v) || 0,     // Column C
                qty: r.c[3]?.v || 0,                   // Column D
                type: r.c[4]?.v || "عام",             // Column E
                img: getDirectImgUrl(r.c[5]?.v),      // Column F
                cat: (r.c[6]?.v || "other").toLowerCase(), // Column G
                featured: r.c[7]?.v === "TRUE" || r.c[7]?.v === true // Column H
            };
        }).filter(p => p !== null); // Remove empty or skipped rows

        generateDynamicButtons();
        renderProducts(allProducts);
    } catch (e) { 
        console.error("Data loading failed", e); 
        document.getElementById('main-grid').innerHTML = '<p style="color:white; text-align:center;">خطأ في تحميل البيانات</p>';
    }
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
    if (e) e.target.classList.add('active');
    renderProducts(type === 'all' ? allProducts : allProducts.filter(p => p.type === type));
}

// UI Rendering
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
                <button class="add-btn ${s.off ? 'btn-disabled' : ''}" ${s.off ? 'disabled' : ''} onclick="addToCart(${p.price}, event)">
                    ${s.off ? 'غير متوفر' : 'إضافة للسلة'}
                </button>
            </div>`;
        
        if (mGrid) mGrid.innerHTML += cardHtml;
        if (p.featured && fGrid) { 
            fGrid.innerHTML += cardHtml; 
            fCount++; 
        }
    });
    if (fSec) fSec.style.display = fCount > 0 ? 'block' : 'none';
}

// Image Expansion (Modal)
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
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    const q = searchInput.value.toLowerCase();
    renderProducts(allProducts.filter(p => p.name.toLowerCase().includes(q)));
}

// Run everything
init();
