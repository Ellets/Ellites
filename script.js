const sheetID = '12XnQD1ne4fu7Q56v-RVzFVMFDCY4p18C22pzyBsBoeg';
const base = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json`;

let allProducts = [];
let totalCartPrice = 0;
let cartItemCount = 0;

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
    return { label: "متوفر بالمخزن", class: "status-good", off: false };
}

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
            type: r.c[3]?.v || "عام",             
            img: getDirectImgUrl(r.c[4]?.v),       
            cat: (r.c[5]?.v || "other").toLowerCase(), 
            featured: r.c[6]?.v === "TRUE" || r.c[6]?.v === true 
        }));

        // 1. Generate the Filter Buttons automatically from the "Type" data
        generateCategoryButtons();
        
        // 2. Initial Render
        renderProducts(allProducts);
    } catch (e) {
        console.error("Failed to load data:", e);
    }
}

/**
 * Automatically creates buttons based on the 'type' column in your sheet
 */
function generateCategoryButtons() {
    const nav = document.getElementById('categoryNav');
    if (!nav) return;

    // Get unique types from our data
    const types = [...new Set(allProducts.map(p => p.type))];

    // Reset nav with "All" button
    nav.innerHTML = `<div class="cat-chip active" onclick="filterByPageType('all', event)">الكل</div>`;

    // Add a button for every unique type found in Column D
    types.forEach(type => {
        if(type) {
            nav.innerHTML += `<div class="cat-chip" onclick="filterByPageType('${type}', event)">${type}</div>`;
        }
    });
}

/**
 * Filter products when a dynamic button is clicked
 */
function filterByPageType(selectedType, event) {
    // UI: update active button
    document.querySelectorAll('.cat-chip').forEach(chip => chip.classList.remove('active'));
    event.target.classList.add('active');

    // Logic: Filter
    if (selectedType === 'all') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.type === selectedType);
        renderProducts(filtered);
    }
}

function renderProducts(data) {
    const mGrid = document.getElementById('main-grid');
    const fGrid = document.getElementById('featured-grid');
    const fSec = document.getElementById('featured-section');
    
    if(!mGrid || !fGrid) return;
    mGrid.innerHTML = ""; fGrid.innerHTML = "";
    let fCount = 0;

    data.forEach(p => {
        const s = getStockStatus(p.qty);
        const cardHtml = `
            <div class="product-card" style="${s.off ? 'opacity:0.7' : ''}">
                <img src="${p.img}" class="product-img" onerror="this.src='https://placehold.co/400x400/251b23/db5b34?text=ELITES'">
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span class="stock-badge ${s.class}">${s.label}</span>
                    <span style="font-size:0.7rem; color:var(--accent); font-weight:bold; background:rgba(219,91,52,0.1); padding:2px 6px; border-radius:4px;">
                        ${p.type}
                    </span>
                </div>

                <div class="product-title">${p.name}</div>
                <div class="price-tag">${s.off ? '---' : p.price.toLocaleString() + ' د.ع'}</div>
                
                <button class="add-btn ${s.off ? 'btn-disabled' : ''}" 
                        ${s.off ? 'disabled' : ''} 
                        onclick="addToCart(${p.price}, event)">
                    ${s.off ? 'غير متوفر' : 'إضافة للسلة'}
                </button>
            </div>`;
        
        mGrid.innerHTML += cardHtml;
        if(p.featured) { fGrid.innerHTML += cardHtml; fCount++; }
    });
    
    if (fSec) fSec.style.display = fCount > 0 ? 'block' : 'none';
}

function addToCart(price, event) {
    totalCartPrice += price;
    cartItemCount++;
    document.getElementById('cart-total').innerText = totalCartPrice.toLocaleString() + " د.ع";
    document.getElementById('cart-count').innerText = cartItemCount;
    
    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = "✓ تم";
    btn.style.background = "#27ae60";
    setTimeout(() => { btn.innerText = originalText; btn.style.background = ""; }, 800);
}

function filterProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    renderProducts(allProducts.filter(p => p.name.toLowerCase().includes(query)));
}

init();
