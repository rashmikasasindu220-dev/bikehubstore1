let products = [];
let cart = loadCart();
let galleryProduct = null;
let galleryIndex = 0;

const fallbackProducts = [
  { id: 1, name: "Racing Helmet Pro", category: "Safety", price: 18500, oldPrice: 22000, rating: 4.8, stock: 12, badge: "Best Seller", image: "images/helmet.svg", images: ["images/helmet.svg"] },
  { id: 2, name: "LED Headlight Kit", category: "Lighting", price: 7600, oldPrice: 9200, rating: 4.6, stock: 8, badge: "New Arrival", image: "images/headlight.svg", images: ["images/headlight.svg"] },
  { id: 3, name: "Digital Speed Meter", category: "Electronics", price: 12500, oldPrice: 14500, rating: 4.7, stock: 5, badge: "Limited", image: "images/speedmeter.svg", images: ["images/speedmeter.svg"] },
  { id: 4, name: "Performance Tool Set", category: "Maintenance", price: 9900, oldPrice: 11800, rating: 4.5, stock: 20, badge: "Popular", image: "images/tools.svg", images: ["images/tools.svg"] },
  { id: 5, name: "Riding Gloves", category: "Safety", price: 4200, oldPrice: 5100, rating: 4.4, stock: 15, badge: "Hot Deal", image: "images/gloves.svg", images: ["images/gloves.svg"] },
  { id: 6, name: "Chain Cleaning Brush", category: "Maintenance", price: 1850, oldPrice: 2400, rating: 4.3, stock: 30, badge: "Budget", image: "images/brush.svg", images: ["images/brush.svg"] },
  { id: 7, name: "USB Mobile Charger", category: "Electronics", price: 5500, oldPrice: 6900, rating: 4.6, stock: 10, badge: "Useful", image: "images/charger.svg", images: ["images/charger.svg"] },
  { id: 8, name: "Indicator Light Set", category: "Lighting", price: 6800, oldPrice: 8200, rating: 4.5, stock: 6, badge: "Bright", image: "images/indicator.svg", images: ["images/indicator.svg"] }
];

const WHATSAPP_PHONE = "94768664483";

const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const cartCount = document.getElementById("cartCount");
const cartDrawer = document.getElementById("cartDrawer");
const openCartBtn = document.getElementById("openCartBtn");
const closeCartBtn = document.getElementById("closeCartBtn");
const overlay = document.getElementById("overlay");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cursorGlow = document.getElementById("cursorGlow");
const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");
const checkoutBtn = document.getElementById("checkoutBtn");

function saveCart() {
  localStorage.setItem("bikeHubCart", JSON.stringify(cart));
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("bikeHubCart")) || {};
  } catch {
    return {};
  }
}

function formatLkr(value) {
  return "LKR " + Number(value).toLocaleString("en-LK");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeProductImages(product) {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images.filter(Boolean);
  }
  return product.image ? [product.image] : ["images/logo.svg"];
}

function getProductMainImage(product) {
  return normalizeProductImages(product)[0] || "images/logo.svg";
}

async function loadProducts() {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) throw new Error("Product API unavailable");
    products = await response.json();
  } catch (error) {
    products = [...fallbackProducts];
    showNotice("GitHub Pages mode: products loaded locally. Orders will be sent through WhatsApp.");
  }

  renderProducts();
  updateCart();
}

function showNotice(text) {
  if (document.querySelector(".java-notice")) return;

  const notice = document.createElement("div");
  notice.className = "java-notice";
  notice.textContent = text;
  document.body.appendChild(notice);

  setTimeout(() => notice.remove(), 6500);
}

function getFilteredProducts() {
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const category = categoryFilter ? categoryFilter.value : "All";

  return products.filter((product) => {
    const matchesSearch =
      String(product.name || "").toLowerCase().includes(query) ||
      String(product.category || "").toLowerCase().includes(query);

    const matchesCategory = category === "All" || product.category === category;
    return matchesSearch && matchesCategory;
  });
}

function buildProductWhatsappMessage(product) {
  return `Hello BikeHub, I want to order this product.\n\nProduct: ${product.name}\nPrice: ${formatLkr(product.price)}\nPayment Method: Cash on Delivery\n\nCustomer Name:\nDelivery Address:\nPhone Number:\n\nPlease confirm availability.`;
}

function orderProductViaWhatsapp(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;
  const message = buildProductWhatsappMessage(product);
  const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, "_blank", "noopener");
}

function openGeneralWhatsappOrder() {
  const message = "Hello BikeHub, I want to order bike accessories. Please send me details.";
  window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
}

function renderProducts() {
  if (!productGrid) return;

  const filtered = getFilteredProducts();

  if (!filtered.length) {
    productGrid.innerHTML = `<p class="empty-message">No products found. Try another search.</p>`;
    return;
  }

  productGrid.innerHTML = filtered.map((product) => {
    const qty = cart[product.id] || 0;
    const stockClass = product.stock === 0 ? "out" : product.stock <= 5 ? "low" : "";
    const images = normalizeProductImages(product);
    const mainImage = images[0];
    const photoLabel = images.length > 1 ? `${images.length} photos` : "1 photo";

    return `
      <article class="product-card">
        <div class="product-image">
          <span class="badge">${escapeHtml(product.badge)}</span>
          <span class="photo-count">${photoLabel}</span>
          <button class="product-photo-trigger" type="button" onclick="openProductGallery(${product.id})" aria-label="Inspect product photos">
            <img src="${escapeHtml(mainImage)}" alt="${escapeHtml(product.name)}">
          </button>
        </div>

        <div class="product-body">
          <div class="product-meta">
            <span class="category">${escapeHtml(product.category)}</span>
            <span class="rating">★ ${escapeHtml(product.rating)}</span>
          </div>

          <h3>${escapeHtml(product.name)}</h3>

          <div class="price-row">
            <span class="price">${formatLkr(product.price)}</span>
            <span class="old-price">${formatLkr(product.oldPrice)}</span>
          </div>

          <p class="stock ${stockClass}">
            ${product.stock === 0 ? "Out of stock" : "Stock available: " + product.stock}
          </p>

          <button class="inspect-btn" type="button" onclick="openProductGallery(${product.id})">Inspect Photos</button>

          <button class="whatsapp-product-btn" type="button" onclick="orderProductViaWhatsapp(${product.id})">💬 Order on WhatsApp</button>

          ${
            qty === 0
              ? `<button class="add-btn" onclick="addToCart(${product.id})" ${product.stock === 0 ? "disabled" : ""}>Add to Cart</button>`
              : `<div class="qty-control">
                  <button onclick="changeQty(${product.id}, -1)">−</button>
                  <span>${qty}</span>
                  <button onclick="changeQty(${product.id}, 1)" ${qty >= product.stock ? "disabled" : ""}>+</button>
                </div>`
          }
        </div>
      </article>
    `;
  }).join("");
}

function addToCart(id) {
  const product = products.find((item) => item.id === id);
  if (!product || product.stock === 0) return;

  cart[id] = 1;
  saveCart();
  updateCart();
  renderProducts();
}

function changeQty(id, amount) {
  const product = products.find((item) => item.id === id);
  if (!product) return;

  const current = cart[id] || 0;
  const next = current + amount;

  if (next <= 0) {
    delete cart[id];
  } else if (next <= product.stock) {
    cart[id] = next;
  }

  saveCart();
  updateCart();
  renderProducts();
}

function removeFromCart(id) {
  delete cart[id];
  saveCart();
  updateCart();
  renderProducts();
}

function updateCart() {
  if (!cartCount || !cartItems || !cartTotal) return;

  const entries = Object.entries(cart);
  const totalQty = entries.reduce((sum, [, qty]) => sum + qty, 0);
  cartCount.textContent = totalQty;

  if (!entries.length) {
    cartItems.innerHTML = `<p class="empty-message">Your cart is empty.</p>`;
    cartTotal.textContent = "LKR 0";
    return;
  }

  let total = 0;

  cartItems.innerHTML = entries.map(([id, qty]) => {
    const product = products.find((item) => item.id === Number(id));
    if (!product) return "";

    total += product.price * qty;

    return `
      <div class="cart-item">
        <img src="${escapeHtml(getProductMainImage(product))}" alt="${escapeHtml(product.name)}">
        <div>
          <h4>${escapeHtml(product.name)}</h4>
          <p>${qty} × ${formatLkr(product.price)}</p>
        </div>
        <button class="cart-remove" onclick="removeFromCart(${product.id})">Remove</button>
      </div>
    `;
  }).join("");

  cartTotal.textContent = formatLkr(total);
}

function openCart() {
  if (!cartDrawer || !overlay) return;
  closeProductGallery();
  cartDrawer.classList.add("open");
  overlay.classList.add("show");
}

function closeCart() {
  if (!cartDrawer || !overlay) return;
  cartDrawer.classList.remove("open");
  overlay.classList.remove("show");
}

function goToCheckout() {
  if (Object.keys(cart).length === 0) {
    alert("Your cart is empty. Please add products before purchasing.");
    return;
  }

  saveCart();
  window.location.href = "checkout.html";
}

function ensureGalleryModal() {
  let modal = document.getElementById("productGalleryModal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "productGalleryModal";
  modal.className = "product-gallery-modal";
  modal.innerHTML = `
    <div class="gallery-backdrop" onclick="closeProductGallery()"></div>
    <section class="gallery-panel" role="dialog" aria-modal="true" aria-labelledby="galleryTitle">
      <button class="gallery-close" type="button" onclick="closeProductGallery()">×</button>
      <div class="gallery-content">
        <div class="gallery-main-wrap">
          <button class="gallery-nav gallery-prev" type="button" onclick="moveGallery(-1)">‹</button>
          <img id="galleryMainImage" src="images/logo.svg" alt="Product photo">
          <button class="gallery-nav gallery-next" type="button" onclick="moveGallery(1)">›</button>
        </div>
        <div class="gallery-details">
          <p class="kicker">PHOTO INSPECTION</p>
          <h2 id="galleryTitle">Product Photos</h2>
          <p id="galleryCategory"></p>
          <strong id="galleryPrice"></strong>
          <div id="galleryThumbs" class="gallery-thumbs"></div>
        </div>
      </div>
    </section>
  `;
  document.body.appendChild(modal);
  return modal;
}

function openProductGallery(id) {
  const product = products.find((item) => item.id === id);
  if (!product) return;

  galleryProduct = product;
  galleryIndex = 0;
  closeCart();

  const modal = ensureGalleryModal();
  modal.classList.add("show");
  document.body.classList.add("gallery-open");
  renderGallery();
}

function closeProductGallery() {
  const modal = document.getElementById("productGalleryModal");
  if (modal) modal.classList.remove("show");
  document.body.classList.remove("gallery-open");
  galleryProduct = null;
}

function setGalleryImage(index) {
  if (!galleryProduct) return;
  const images = normalizeProductImages(galleryProduct);
  galleryIndex = Math.max(0, Math.min(index, images.length - 1));
  renderGallery();
}

function moveGallery(direction) {
  if (!galleryProduct) return;
  const images = normalizeProductImages(galleryProduct);
  galleryIndex = (galleryIndex + direction + images.length) % images.length;
  renderGallery();
}

function renderGallery() {
  if (!galleryProduct) return;
  const images = normalizeProductImages(galleryProduct);
  const main = document.getElementById("galleryMainImage");
  const title = document.getElementById("galleryTitle");
  const category = document.getElementById("galleryCategory");
  const price = document.getElementById("galleryPrice");
  const thumbs = document.getElementById("galleryThumbs");

  if (main) {
    main.src = images[galleryIndex] || "images/logo.svg";
    main.alt = `${galleryProduct.name} photo ${galleryIndex + 1}`;
  }
  if (title) title.textContent = galleryProduct.name;
  if (category) category.textContent = `${galleryProduct.category} • ${images.length} product photo(s) available`;
  if (price) price.textContent = formatLkr(galleryProduct.price);
  if (thumbs) {
    thumbs.innerHTML = images.map((src, index) => `
      <button class="gallery-thumb ${index === galleryIndex ? "active" : ""}" type="button" onclick="setGalleryImage(${index})">
        <img src="${escapeHtml(src)}" alt="Thumbnail ${index + 1}">
      </button>
    `).join("");
  }
}

function activateRevealAnimation() {
  document.querySelectorAll(".reveal").forEach((item) => item.classList.add("visible"));
}

function attachEvents() {
  if (searchInput) searchInput.addEventListener("input", renderProducts);
  if (categoryFilter) categoryFilter.addEventListener("change", renderProducts);
  if (openCartBtn) openCartBtn.addEventListener("click", openCart);
  if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);
  if (checkoutBtn) checkoutBtn.addEventListener("click", goToCheckout);

  if (overlay) {
    overlay.addEventListener("click", closeCart);
  }

  if (menuBtn && navMenu) {
    menuBtn.addEventListener("click", () => navMenu.classList.toggle("open"));
  }

  document.querySelectorAll(".nav a").forEach((link) => {
    link.addEventListener("click", () => {
      if (navMenu) navMenu.classList.remove("open");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (!galleryProduct) return;
    if (event.key === "Escape") closeProductGallery();
    if (event.key === "ArrowLeft") moveGallery(-1);
    if (event.key === "ArrowRight") moveGallery(1);
  });

  if (cursorGlow) {
    document.addEventListener("mousemove", (event) => {
      cursorGlow.style.left = event.clientX + "px";
      cursorGlow.style.top = event.clientY + "px";
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  activateRevealAnimation();
  attachEvents();
  loadProducts();
});
