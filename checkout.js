let products = [];
let cart = loadCart();

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
const checkoutItems = document.getElementById("checkoutItems");
const checkoutTotal = document.getElementById("checkoutTotal");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutMessage = document.getElementById("checkoutMessage");

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("bikeHubCart")) || {};
  } catch {
    return {};
  }
}

function saveCart() {
  localStorage.setItem("bikeHubCart", JSON.stringify(cart));
}

function clearCart() {
  cart = {};
  localStorage.removeItem("bikeHubCart");
}

function formatLkr(value) {
  return "LKR " + Number(value).toLocaleString("en-LK");
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
    if (!response.ok) throw new Error("API unavailable");
    products = await response.json();
  } catch {
    products = [...fallbackProducts];
  }

  renderSummary();
}

function getCartLines() {
  return Object.entries(cart).map(([id, qty]) => {
    const product = products.find((item) => item.id === Number(id));
    if (!product) return null;
    return {
      id: product.id,
      name: product.name,
      quantity: Number(qty),
      price: Number(product.price),
      total: Number(product.price) * Number(qty)
    };
  }).filter(Boolean);
}

function getCartItemsText() {
  return getCartLines().map((line, index) => {
    return `${index + 1}. ${line.name} | Qty: ${line.quantity} | Unit: ${formatLkr(line.price)} | Total: ${formatLkr(line.total)}`;
  }).join("\n");
}

function getCartTotal() {
  return getCartLines().reduce((sum, line) => sum + line.total, 0);
}

function renderSummary() {
  const entries = Object.entries(cart);

  if (!entries.length) {
    checkoutItems.innerHTML = `<p class="empty-message">Your cart is empty. Please add products first.</p>`;
    checkoutTotal.textContent = "LKR 0";
    return;
  }

  checkoutItems.innerHTML = entries.map(([id, qty]) => {
    const product = products.find((item) => item.id === Number(id));
    if (!product) return "";

    return `
      <div class="checkout-item">
        <img src="${getProductMainImage(product)}" alt="${product.name}">
        <div>
          <h3>${product.name}</h3>
          <p>${qty} × ${formatLkr(product.price)}</p>
        </div>
        <strong>${formatLkr(product.price * qty)}</strong>
      </div>
    `;
  }).join("");

  checkoutTotal.textContent = formatLkr(getCartTotal());
}

function buildWhatsappMessage(orderRef, customer) {
  const itemText = getCartItemsText();
  const total = formatLkr(getCartTotal());

  return `Hello BikeHub, I want to place a Cash on Delivery order.\n\nOrder Reference: ${orderRef}\n\nCustomer Details\nName: ${customer.name}\nPhone: ${customer.phone}\nEmail: ${customer.email || "Not provided"}\nAddress: ${customer.address}\nNote: ${customer.note || "No note"}\n\nOrder Items\n${itemText}\n\nGrand Total: ${total}\nPayment Method: Cash on Delivery\n\nPlease confirm my order.`;
}

function submitOrder(event) {
  event.preventDefault();

  if (Object.keys(cart).length === 0) {
    checkoutMessage.textContent = "Cart is empty. Please add products before purchasing.";
    return;
  }

  const customer = {
    name: document.getElementById("customerName").value.trim(),
    phone: document.getElementById("customerPhone").value.trim(),
    email: document.getElementById("customerEmail").value.trim(),
    address: document.getElementById("customerAddress").value.trim(),
    note: document.getElementById("customerNote").value.trim()
  };

  if (!customer.name || !customer.phone || !customer.address) {
    checkoutMessage.textContent = "Please enter name, phone number, and delivery address.";
    return;
  }

  const orderRef = "BH-WA-" + Date.now().toString().slice(-8);
  const message = buildWhatsappMessage(orderRef, customer);
  const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;

  localStorage.setItem("bikeHubLastWhatsappOrder", JSON.stringify({
    orderRef,
    createdAt: new Date().toISOString(),
    customer,
    items: getCartLines(),
    total: getCartTotal()
  }));

  checkoutMessage.innerHTML = `Opening WhatsApp for order ${orderRef}. After customer sends the message, admin can enter it manually in the local dashboard.`;

  const link = document.createElement("a");
  link.href = whatsappUrl;
  link.target = "_blank";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  clearCart();
  saveCart();

  setTimeout(() => {
    window.location.href = `thank-you.html?orderId=${encodeURIComponent(orderRef)}`;
  }, 1600);
}

checkoutForm.addEventListener("submit", submitOrder);
loadProducts();
