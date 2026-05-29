 import "./styles.css";

type Product = {
  id: string;
  name: string;
  detail: string;
  rating: string;
  reviews: string;
  price: number;
  oldPrice: number;
  badge?: string;
  color: string;
  category: string;
  image?: string;
};

type Category = {
  label: string;
  sub: string;
  icon: string;
};

type CartItem = Product & {
  quantity: number;
};

type Order = {
  id: string;
  createdAt: string;
  items: CartItem[];
  total: number;
  status: "checkout_started";
};

type ApiDebugEntry = {
  time: string;
  method: string;
  path: string;
  status?: number;
  message: string;
};

declare global {
  interface Window {
    royCellDebug?: {
      apiBase: string;
      logs: () => ApiDebugEntry[];
      clear: () => void;
      ping: () => Promise<unknown>;
    };
  }
}

const storeEmail = "roycell1@yahoo.com";
const storePhone = "+96181705240";
const whatsappNumber = "96181705240";
const instagramUrl = "https://www.instagram.com/roycell.lb/";
const tiktokUrl = "https://www.tiktok.com/@roycell.lb";
const locationUrl = "https://www.google.com/maps/search/?api=1&query=Roy%20Cell%20Lebanon";
const emailUrl =
  "https://mail.google.com/mail/?view=cm&fs=1&to=roycell1@yahoo.com&su=Roy%20Cell%20Inquiry";
const adminUserKey = "roy-cell-admin-user";
const adminSessionKey = "roy-cell-admin-session";

const categories: Category[] = [
  { label: "iPhone", sub: "Unlocked, tested, battery checked", icon: "phone" },
  { label: "Android", sub: "Samsung, Xiaomi, Nothing, Honor", icon: "android" },
  { label: "Tablets", sub: "iPad and Android tablets", icon: "tablet" },
  { label: "Laptops", sub: "MacBook and Windows notebooks", icon: "laptop" },
  { label: "Audio", sub: "AirPods, earbuds, speakers", icon: "audio" },
  { label: "Accessories", sub: "Chargers, cases, screen guards", icon: "cable" }
];

const seedProducts: Product[] = [
  {
    id: "iphone-14",
    name: "iPhone 14",
    detail: "128 GB - Midnight - Excellent",
    rating: "4.8/5",
    reviews: "312",
    price: 429,
    oldPrice: 699,
    badge: "Best seller",
    color: "silver",
    category: "iPhone"
  },
  {
    id: "galaxy-s23",
    name: "Galaxy S23",
    detail: "256 GB - Phantom Black - Good",
    rating: "4.7/5",
    reviews: "188",
    price: 389,
    oldPrice: 749,
    color: "graphite",
    category: "Android"
  },
  {
    id: "iphone-13-pro",
    name: "iPhone 13 Pro",
    detail: "128 GB - Sierra Blue - Excellent",
    rating: "4.9/5",
    reviews: "421",
    price: 499,
    oldPrice: 899,
    badge: "Going fast",
    color: "blue",
    category: "iPhone"
  },
  {
    id: "ipad-air-5",
    name: "iPad Air 5",
    detail: "64 GB - Wi-Fi - Very good",
    rating: "4.6/5",
    reviews: "93",
    price: 369,
    oldPrice: 599,
    color: "green",
    category: "Tablets"
  },
  {
    id: "macbook-air-m1",
    name: "MacBook Air M1",
    detail: "256 GB - 8 GB RAM - Space Gray",
    rating: "4.7/5",
    reviews: "146",
    price: 629,
    oldPrice: 999,
    color: "slate",
    category: "Laptops"
  },
  {
    id: "airpods-pro-2",
    name: "AirPods Pro 2",
    detail: "USB-C case - Sanitized - Excellent",
    rating: "4.8/5",
    reviews: "277",
    price: 159,
    oldPrice: 249,
    color: "white",
    category: "Audio"
  }
];

let products: Product[] = loadProducts();

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found");
}

const state = {
  query: "",
  selectedCategory: "All",
  cart: new Map<string, CartItem>(),
  favorites: new Set<string>(),
  searchOpen: false
};

const viteEnv = (import.meta as ImportMeta & { env?: { VITE_API_BASE_URL?: string } }).env;
const configuredApiBase = viteEnv?.VITE_API_BASE_URL?.trim().replace(/\/$/, "");
const apiBase =
  configuredApiBase ||
  (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
    ? "http://127.0.0.1:4000/api"
    : "/api");
const apiDebugKey = "roy-cell-api-debug";

let adminHasUser = Boolean(localStorage.getItem(adminUserKey));
let adminOrders: Order[] = [];
let adminStatusError = "";

const getAdminToken = () => sessionStorage.getItem(adminSessionKey) || "";

const apiHeaders = () => ({
  Authorization: `Bearer ${getAdminToken()}`
});

const readApiLogs = () => {
  try {
    const saved = localStorage.getItem(apiDebugKey);
    const parsed = saved ? (JSON.parse(saved) as ApiDebugEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeApiLog = (entry: ApiDebugEntry) => {
  const logs = [entry, ...readApiLogs()].slice(0, 25);
  localStorage.setItem(apiDebugKey, JSON.stringify(logs));
};

const fetchJson = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const method = options?.method || "GET";

  try {
    const response = await fetch(`${apiBase}${path}`, options);
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("text/html")) {
      const message = `API returned HTML for ${path}. Check Vercel API routing and environment variables.`;
      writeApiLog({ time: new Date().toISOString(), method, path, status: response.status, message });
      throw new Error(message);
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: `Request failed with status ${response.status}` }));
      const detail = typeof error.detail === "string" ? `: ${error.detail}` : "";
      const message = `${error.message || `Request failed with status ${response.status}`}${detail}`;
      writeApiLog({ time: new Date().toISOString(), method, path, status: response.status, message });
      throw new Error(message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network request failed";
    writeApiLog({ time: new Date().toISOString(), method, path, message });
    throw error;
  }
};

window.royCellDebug = {
  apiBase,
  logs: readApiLogs,
  clear: () => localStorage.removeItem(apiDebugKey),
  ping: () => fetchJson("/health")
};

const formatPrice = (value: number) => `$${value.toLocaleString("en-US")}`;

function loadProducts() {
  const savedProducts = localStorage.getItem("roy-cell-products");
  if (!savedProducts) return seedProducts;

  try {
    const parsed = JSON.parse(savedProducts) as Product[];
    return Array.isArray(parsed) && parsed.length ? parsed : seedProducts;
  } catch {
    return seedProducts;
  }
}

const saveProducts = () => {
  localStorage.setItem("roy-cell-products", JSON.stringify(products));
};

const loadOrders = () => {
  const savedOrders = localStorage.getItem("roy-cell-orders");
  if (!savedOrders) return [] as Order[];

  try {
    const parsed = JSON.parse(savedOrders) as Order[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

adminOrders = loadOrders();

const saveOrder = (order: Order) => {
  const orders = loadOrders();
  orders.unshift(order);
  localStorage.setItem("roy-cell-orders", JSON.stringify(orders));
};

const syncProductsFromApi = async () => {
  try {
    products = await fetchJson<Product[]>("/products");
    saveProducts();
    renderProducts();
    renderSearchSuggestions();
    renderCart();
  } catch (error) {
    console.warn("Product sync failed", error);
    // Keep local fallback products when the API is not running.
  }
};

const syncAdminFromApi = async () => {
  try {
    const status = await fetchJson<{ hasAdmin: boolean }>("/admin/status");
    adminHasUser = status.hasAdmin;
    adminStatusError = "";
    if (getAdminToken()) {
      adminOrders = await fetchJson<Order[]>("/orders", { headers: apiHeaders() });
    }
  } catch (error) {
    console.warn("Admin sync failed", error);
    adminStatusError =
      error instanceof Error
        ? error.message
        : "Could not connect to the API. Check deployment environment variables.";
    adminOrders = loadOrders();
  }
};

const renderAdmin = async () => {
  await syncAdminFromApi();
  app.innerHTML = adminShell();
};

const whatsappLink = (message: string) =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

const icon = (name: string) => {
  const paths: Record<string, string> = {
    search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.4-3.4"></path>',
    user: '<path d="M20 21a8 8 0 0 0-16 0"></path><circle cx="12" cy="8" r="4"></circle>',
    heart:
      '<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6l1.2 1.2L12 21l7.6-7.6 1.2-1.2a5.4 5.4 0 0 0 0-7.6Z"></path>',
    bag: '<path d="M6 8h12l-1 13H7L6 8Z"></path><path d="M9 8a3 3 0 0 1 6 0"></path>',
    phone: '<rect x="8" y="2" width="8" height="20" rx="2"></rect><path d="M11 18h2"></path>',
    android:
      '<rect x="5" y="7" width="14" height="12" rx="3"></rect><path d="M8 7 6 4"></path><path d="m16 7 2-3"></path><path d="M9 11h.01"></path><path d="M15 11h.01"></path>',
    tablet: '<rect x="5" y="3" width="14" height="18" rx="2"></rect><path d="M11 17h2"></path>',
    laptop: '<path d="M5 6h14v10H5z"></path><path d="M3 20h18"></path>',
    audio:
      '<path d="M4 13a8 8 0 0 1 16 0"></path><path d="M4 13v4a2 2 0 0 0 2 2h1v-7H6a2 2 0 0 0-2 1Z"></path><path d="M20 13v4a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 1Z"></path>',
    cable:
      '<path d="M7 7v4a5 5 0 0 0 10 0V7"></path><path d="M9 3v4"></path><path d="M15 3v4"></path><path d="M12 16v5"></path>',
    shield:
      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path><path d="m9 12 2 2 4-5"></path>',
    rotate: '<path d="M21 12a9 9 0 1 1-2.6-6.4"></path><path d="M21 3v6h-6"></path>',
    truck:
      '<path d="M3 6h12v10H3z"></path><path d="M15 10h4l2 3v3h-6z"></path><circle cx="7" cy="18" r="2"></circle><circle cx="18" cy="18" r="2"></circle>',
    leaf: '<path d="M20 4C12 4 6 9 6 17a4 4 0 0 0 4 4c8 0 10-9 10-17Z"></path><path d="M6 17c3-1 6-4 8-8"></path>',
    star:
      '<path d="m12 2 2.9 6 6.6.9-4.8 4.7 1.1 6.5L12 17l-5.8 3.1 1.1-6.5-4.8-4.7 6.6-.9L12 2Z"></path>',
    menu: '<path d="M4 6h16"></path><path d="M4 12h16"></path><path d="M4 18h16"></path>',
    moon: '<path d="M12 3a6 6 0 0 0 9 7.4A9 9 0 1 1 12 3Z"></path>',
    sun:
      '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.9 4.9 1.4 1.4"></path><path d="m17.7 17.7 1.4 1.4"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.3 17.7-1.4 1.4"></path><path d="m19.1 4.9-1.4 1.4"></path>',
    minus: '<path d="M5 12h14"></path>',
    plus: '<path d="M12 5v14"></path><path d="M5 12h14"></path>',
    x: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
    whatsapp:
      '<path d="M3.5 20.5 5 16.8A8.5 8.5 0 1 1 8 19.5l-4.5 1Z"></path><path d="M9 9.5c.3 2 2.2 4.1 4.4 4.8l1.4-1.2 2 .5c.2 1.1-.6 2.2-1.8 2.2-4.1 0-7.8-3.6-7.8-7.8 0-1.1 1.1-2 2.1-1.8l.6 2-1 1.3Z"></path>',
    instagram:
      '<rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17" cy="7" r="1"></circle>',
    tiktok:
      '<path d="M14 3v10.5a4 4 0 1 1-4-4"></path><path d="M14 5c1.2 2.8 3 4.4 6 4.7"></path>',
    mail:
      '<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path>',
    location:
      '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>'
  };

  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
};

const cartCount = () =>
  Array.from(state.cart.values()).reduce((total, item) => total + item.quantity, 0);

const cartTotal = () =>
  Array.from(state.cart.values()).reduce((total, item) => total + item.price * item.quantity, 0);

const filteredProducts = () => {
  const query = state.query.trim().toLowerCase();

  return products.filter((product) => {
    const matchesCategory =
      state.selectedCategory === "All" || product.category === state.selectedCategory;
    const matchesQuery =
      !query ||
      `${product.name} ${product.detail} ${product.category}`.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });
};

const searchSuggestions = () => {
  const query = state.query.trim().toLowerCase();
  if (!query) {
    return products;
  }

  return products.filter((product) =>
    `${product.name} ${product.detail} ${product.category}`.toLowerCase().includes(query)
  );
};

const productCard = (product: Product) => {
  const isFavorite = state.favorites.has(product.id);

  return `
    <article class="product-card">
      <div class="product-media ${product.color}">
        ${product.badge ? `<span class="badge">${product.badge}</span>` : ""}
        ${
          product.image
            ? `<img class="product-image" src="${product.image}" alt="${product.name}" />`
            : `<div class="device-shell"><div></div></div>`
        }
        <button class="icon-button favorite ${isFavorite ? "active" : ""}" data-favorite="${product.id}" aria-label="Save ${product.name}">
          ${icon("heart")}
        </button>
      </div>
      <div class="product-copy">
        <p class="rating">${icon("star")} ${product.rating} <span>(${product.reviews})</span></p>
        <h3>${product.name}</h3>
        <p>${product.detail}</p>
        <div class="price-row">
          <strong>${formatPrice(product.price)}</strong>
          <span>${formatPrice(product.oldPrice)} new</span>
        </div>
        <button class="cart-button" data-add-cart="${product.id}">${icon("bag")} Add to cart</button>
      </div>
    </article>
  `;
};

const cartMarkup = () => {
  const items = Array.from(state.cart.values());

  if (!items.length) {
    return `
      <div class="empty-cart">
        ${icon("bag")}
        <h3>Your cart is empty</h3>
        <p>Add a phone, tablet, laptop, or accessory and your checkout request will be prepared for WhatsApp.</p>
      </div>
    `;
  }

  return `
    <div class="cart-items">
      ${items
        .map(
          (item) => `
          <article class="cart-item">
            <div>
              <strong>${item.name}</strong>
              <span>${item.detail}</span>
              <small>${formatPrice(item.price)} each</small>
            </div>
            <div class="quantity-control" aria-label="Quantity for ${item.name}">
              <button data-decrease="${item.id}" aria-label="Decrease ${item.name}">${icon("minus")}</button>
              <span>${item.quantity}</span>
              <button data-increase="${item.id}" aria-label="Increase ${item.name}">${icon("plus")}</button>
            </div>
          </article>
        `
        )
        .join("")}
    </div>
    <div class="cart-summary">
      <span>Total</span>
      <strong>${formatPrice(cartTotal())}</strong>
    </div>
    <button class="checkout-button" type="button" data-checkout>
      ${icon("whatsapp")} Checkout on WhatsApp
    </button>
  `;
};

const renderProducts = () => {
  const grid = document.querySelector<HTMLDivElement>("#products");
  const count = document.querySelector<HTMLSpanElement>("#product-count");

  if (!grid || !count) return;

  const results = filteredProducts();
  count.textContent = `${results.length} item${results.length === 1 ? "" : "s"}`;
  grid.innerHTML = results.length
    ? results.map(productCard).join("")
    : `<div class="no-results"><h3>No matching products</h3><p>Try another category or search term.</p></div>`;
};

const renderSearchSuggestions = () => {
  const panel = document.querySelector<HTMLDivElement>("#search-suggestions");
  if (!panel) return;

  const suggestions = searchSuggestions();
  const shouldShow = state.searchOpen && (state.query.trim().length > 0 || suggestions.length > 0);

  panel.classList.toggle("open", shouldShow);
  panel.setAttribute("aria-hidden", shouldShow ? "false" : "true");

  if (!shouldShow) {
    panel.innerHTML = "";
    return;
  }

  panel.innerHTML = suggestions.length
    ? suggestions
        .map(
          (product) => `
            <button class="search-suggestion" type="button" data-search-product="${product.id}">
              <span>
                <strong>${product.name}</strong>
                <small>${product.category} - ${product.detail}</small>
              </span>
              <b>${formatPrice(product.price)}</b>
            </button>
          `
        )
        .join("")
    : `<div class="search-empty"><strong>No results</strong><span>Try iPhone, Samsung, MacBook, iPad, or AirPods.</span></div>`;
};

const renderCart = () => {
  document.querySelectorAll("[data-cart-count]").forEach((node) => {
    node.textContent = String(cartCount());
  });

  const cartBody = document.querySelector<HTMLDivElement>("#cart-body");
  if (cartBody) {
    cartBody.innerHTML = cartMarkup();
  }
};

const render = () => {
  renderProducts();
  renderSearchSuggestions();
  renderCart();
};

const bytesToHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

const randomToken = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes.buffer);
};

const hashPassword = async (password: string, salt: string) => {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  return bytesToHex(await crypto.subtle.digest("SHA-256", data));
};

const getAdminUser = () => {
  const savedUser = localStorage.getItem(adminUserKey);
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser) as { username: string; salt: string; passwordHash: string };
  } catch {
    return null;
  }
};

const isAdminLoggedIn = () => Boolean(sessionStorage.getItem(adminSessionKey));

const resizeImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      image.onload = () => {
        const maxSize = 900;
        const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Image processing failed"));
          return;
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", 0.82));
      };

      image.onerror = () => reject(new Error("Invalid image"));
      image.src = String(reader.result);
    };

    reader.onerror = () => reject(new Error("Image upload failed"));
    reader.readAsDataURL(file);
  });

const adminProductForm = (product?: Product) => `
  <form class="admin-product-form ${product ? "inline-edit" : ""}" id="admin-product-form">
    <input class="product-id" type="hidden" value="${product?.id || ""}" />
    <label>Name<input class="product-name" type="text" value="${product?.name || ""}" required /></label>
    <label>Details<input class="product-detail" type="text" value="${product?.detail || ""}" placeholder="128 GB - Black - Excellent" required /></label>
    <label>Category<select class="product-category">${categories.map((category) => `<option ${product?.category === category.label ? "selected" : ""}>${category.label}</option>`).join("")}</select></label>
    <label>Price<input class="product-price" type="number" min="0" value="${product?.price || ""}" required /></label>
    <label class="toggle-label">
      Best seller badge
      <span class="admin-toggle">
        <input class="product-badge" type="checkbox" ${product?.badge ? "checked" : ""} />
        <span></span>
      </span>
    </label>
    <label>Image<input class="product-image-input" type="file" accept="image/*" /></label>
    <button type="submit">${product ? "Update product" : "Add product"}</button>
    ${product ? `<button type="button" data-admin-cancel-edit>Cancel</button>` : `<button type="reset">Clear form</button>`}
    <p class="admin-message product-message"></p>
  </form>
`;

const adminShell = () => {
  const loggedIn = isAdminLoggedIn();
  const orders = adminOrders;
  const totalRevenue = orders.reduce((total, order) => total + order.total, 0);
  const editingProductId = sessionStorage.getItem("roy-cell-editing-product");

  if (adminStatusError) {
    return `
      <main class="admin-page">
        <section class="admin-auth">
          <a class="brand" href="/"><span>Roy</span> Cell</a>
          <h1>Admin unavailable</h1>
          <p>The admin API could not be reached.</p>
          <p class="admin-message">${adminStatusError}</p>
        </section>
      </main>
    `;
  }

  if (!adminHasUser) {
    return `
      <main class="admin-page">
        <section class="admin-auth">
          <a class="brand" href="/"><span>Roy</span> Cell</a>
          <h1>Create admin</h1>
          <p>Create one admin account for this browser. Use a strong password.</p>
          <form id="admin-create-form">
            <label>Username<input id="admin-new-username" type="text" autocomplete="username" required /></label>
            <label>Password
              <span class="password-field">
                <input id="admin-new-password" type="password" autocomplete="new-password" minlength="8" required />
                <button type="button" data-toggle-password="admin-new-password">Show</button>
              </span>
            </label>
            <button type="submit">Create secure admin</button>
            <p class="admin-message" id="admin-message"></p>
          </form>
        </section>
      </main>
    `;
  }

  if (!loggedIn) {
    return `
      <main class="admin-page">
        <section class="admin-auth">
          <a class="brand" href="/"><span>Roy</span> Cell</a>
          <h1>Admin login</h1>
          <p>Sign in to manage products and review checkout history.</p>
          <form id="admin-login-form">
            <label>Username<input id="admin-username" type="text" autocomplete="username" required /></label>
            <label>Password
              <span class="password-field">
                <input id="admin-password" type="password" autocomplete="current-password" required />
                <button type="button" data-toggle-password="admin-password">Show</button>
              </span>
            </label>
            <button type="submit">Sign in</button>
            <button type="button" id="forgot-password">Forgot password</button>
            <p class="admin-message" id="admin-message"></p>
          </form>
          <form id="admin-reset-form" class="admin-reset-form" hidden>
            <label>Reset key<input id="admin-reset-key" type="password" autocomplete="off" required /></label>
            <label>New password
              <span class="password-field">
                <input id="admin-reset-password" type="password" autocomplete="new-password" minlength="8" required />
                <button type="button" data-toggle-password="admin-reset-password">Show</button>
              </span>
            </label>
            <button type="submit">Reset password</button>
          </form>
        </section>
      </main>
    `;
  }

  return `
    <main class="admin-page dashboard">
      <header class="admin-header">
        <div>
          <a class="brand" href="/"><span>Roy</span> Cell</a>
          <p>Admin dashboard</p>
        </div>
        <button id="admin-logout" type="button">Log out</button>
      </header>

      <section class="admin-stats" aria-label="Dashboard statistics">
        <article><span>Products</span><strong>${products.length}</strong></article>
        <article><span>Checkout clicks</span><strong>${orders.length}</strong></article>
        <article><span>Tracked value</span><strong>${formatPrice(totalRevenue)}</strong></article>
      </section>

      <section class="admin-panel">
        <div class="admin-section-title">
          <div>
            <p class="eyebrow">Inventory</p>
            <h2>Add or edit items</h2>
          </div>
        </div>
        ${adminProductForm()}
        <div class="admin-products">
          ${products
            .map(
              (product) => `
                <article class="${editingProductId === product.id ? "is-editing" : ""}">
                  <div class="admin-product-row">
                    ${product.image ? `<img src="${product.image}" alt="${product.name}" />` : `<div class="admin-product-placeholder">${icon("phone")}</div>`}
                    <div><strong>${product.name}</strong><span>${product.detail}</span></div>
                    <b class="admin-price">${formatPrice(product.price)}</b>
                    <button type="button" data-admin-edit="${product.id}">Edit</button>
                    <button type="button" data-admin-delete="${product.id}">Delete</button>
                  </div>
                  ${editingProductId === product.id ? adminProductForm(product) : ""}
                </article>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="admin-panel">
        <div class="admin-section-title">
          <div>
            <p class="eyebrow">Orders</p>
            <h2>Checkout history</h2>
          </div>
          <button type="button" id="orders-clear">Clear history</button>
        </div>
        <div class="admin-orders">
          ${
            orders.length
              ? orders
                  .map(
                    (order) => `
                      <article>
                        <div><strong>${order.id}</strong><span>${new Date(order.createdAt).toLocaleString()}</span></div>
                        <p>${order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}</p>
                        <b>${formatPrice(order.total)}</b>
                      </article>
                    `
                  )
                  .join("")
              : `<p class="admin-empty">No checkout history yet.</p>`
          }
        </div>
      </section>
    </main>
  `;
};

if (window.location.pathname === "/admin") {
  app.innerHTML = `<main class="admin-page"><section class="admin-auth"><h1>Loading admin...</h1></section></main>`;
  void renderAdmin();
} else {
app.innerHTML = `
  <header class="site-header">
    <div class="top-strip">
      <span>Delivery all over Lebanon and pickup from Roy Cell</span>
    </div>
    <nav class="nav-bar" aria-label="Main navigation">
      <a href="#" class="brand" aria-label="Roy Cell home"><span>Roy</span> Cell</a>
      <div class="search-area">
        <label class="search-box">
          ${icon("search")}
          <input id="search-input" type="search" placeholder="Search iPhone, Samsung, MacBook..." autocomplete="off" aria-controls="search-suggestions" />
        </label>
        <div class="search-suggestions" id="search-suggestions" aria-hidden="true"></div>
      </div>
      <div class="nav-actions">
        <a class="icon-button" href="${locationUrl}" target="_blank" rel="noreferrer" aria-label="Open Roy Cell location">${icon("location")}</a>
        <a class="icon-button" href="${emailUrl}" target="_blank" rel="noreferrer" aria-label="Email Roy Cell">${icon("mail")}</a>
        <button class="icon-button cart-trigger" data-open-cart type="button" aria-label="Open cart">${icon("bag")}<span data-cart-count>0</span></button>
      </div>
    </nav>
    <div class="category-nav" aria-label="Product categories">
      <button class="active" data-category="All">All</button>
      ${categories.map((item) => `<button data-category="${item.label}">${item.label}</button>`).join("")}
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Refurbished tech, checked in Lebanon</p>
        <h1>Where Lebanon shops smarter phones.</h1>
        <p class="hero-lede">
          Roy Cell brings inspected iPhone, Android, tablets, laptops, and accessories with clear condition grades and local support.
        </p>
        <div class="hero-actions">
          <a class="primary-button" href="#shop">Shop bestsellers</a>
          <a class="secondary-button" href="${whatsappLink("Hello Roy Cell, I want to ask about available refurbished phones.")}" target="_blank" rel="noreferrer">WhatsApp Roy Cell</a>
        </div>
        <ul class="promise-list">
          <li>${icon("shield")} Quality inspection</li>
          <li>${icon("rotate")} Easy exchange support</li>
          <li>${icon("truck")} Lebanon delivery</li>
        </ul>
      </div>
      <figure class="hero-media">
        <img src="/assets/edited-photo.png" alt="Roy Cell red phone repair and electronics logo" />
      </figure>
    </section>

    <section class="quick-search" aria-labelledby="quick-title">
      <div class="section-heading">
        <p class="eyebrow">Popular searches</p>
        <h2 id="quick-title">Start with what people ask for most</h2>
      </div>
      <div class="pill-row">
        ${["iPhone 14", "Galaxy S23", "iPad Air", "MacBook Air", "AirPods Pro", "USB-C chargers"]
          .map((pill) => `<button data-search="${pill}">${pill}</button>`)
          .join("")}
      </div>
    </section>

    <section class="category-grid" aria-labelledby="categories-title">
      <div class="section-heading">
        <p class="eyebrow">Categories</p>
        <h2 id="categories-title">Shop renewed tech by type</h2>
      </div>
      <div class="categories">
        ${categories
          .map(
            (item) => `
              <button class="category-card" data-category="${item.label}">
                <span>${icon(item.icon)}</span>
                <strong>${item.label}</strong>
                <small>${item.sub}</small>
              </button>
            `
          )
          .join("")}
      </div>
    </section>

    <section class="products-section" id="shop" aria-labelledby="shop-title">
      <div class="section-heading with-action">
        <div>
          <p class="eyebrow">Shop bestsellers</p>
          <h2 id="shop-title">Inspected devices ready for a second life</h2>
        </div>
        <span class="result-count" id="product-count">0 items</span>
      </div>
      <div class="products" id="products"></div>
    </section>

  </main>

  <button class="mobile-cart-button" data-open-cart type="button" aria-label="Open cart">
    ${icon("bag")}
    <span data-cart-count>0</span>
  </button>
  <div class="cart-edge-trigger" data-open-cart aria-hidden="true"></div>
  <aside class="cart-panel" id="cart-panel" aria-label="Shopping cart" aria-hidden="true">
    <div class="cart-panel-header">
      <div>
        <p class="eyebrow">Cart</p>
        <h2>Your Roy Cell order</h2>
      </div>
      <button class="icon-button" data-close-cart type="button" aria-label="Close cart">${icon("x")}</button>
    </div>
    <div id="cart-body"></div>
  </aside>
  <div class="cart-backdrop" data-close-cart></div>

  <section class="checkout-modal" id="checkout-modal" aria-hidden="true" aria-label="Customer checkout details">
    <form class="checkout-form" id="checkout-form">
      <div class="checkout-form-header">
        <div>
          <p class="eyebrow">Checkout</p>
          <h2>Delivery details</h2>
        </div>
        <button class="icon-button" type="button" data-close-checkout aria-label="Close checkout form">${icon("x")}</button>
      </div>
      <label>First name<input id="customer-first-name" type="text" autocomplete="given-name" required /></label>
      <label>Last name<input id="customer-last-name" type="text" autocomplete="family-name" required /></label>
      <label>Phone number<input id="customer-phone" type="tel" autocomplete="tel" required /></label>
      <label>City<input id="customer-city" type="text" autocomplete="address-level2" required /></label>
      <label>Street / building<input id="customer-street" type="text" autocomplete="street-address" required /></label>
      <button class="checkout-button" type="submit">${icon("whatsapp")} Prepare WhatsApp message</button>
      <p class="admin-message" id="checkout-message"></p>
    </form>
  </section>
  <div class="checkout-backdrop" data-close-checkout></div>

  <footer class="footer">
    <div class="footer-grid">
      <section class="footer-brand" aria-label="Roy Cell summary">
        <a href="#" class="footer-logo"><span>Roy</span> Cell</a>
        <p>Refurbished phones, tablets, laptops, audio gear, and accessories checked for customers across Lebanon.</p>
        <div class="footer-socials">
          <a class="social-link" href="${whatsappLink("Hello Roy Cell, I want to ask about your products.")}" target="_blank" rel="noreferrer" aria-label="WhatsApp Roy Cell">${icon("whatsapp")}</a>
          <a class="social-link" href="${instagramUrl}" target="_blank" rel="noreferrer" aria-label="Roy Cell Instagram">${icon("instagram")}</a>
          <a class="social-link" href="${tiktokUrl}" target="_blank" rel="noreferrer" aria-label="Roy Cell TikTok">${icon("tiktok")}</a>
        </div>
      </section>

      <nav class="footer-column" aria-label="Shop links">
        <h3>Shop</h3>
        <a href="#shop">Bestsellers</a>
        <a href="#shop" data-search="iPhone">iPhone</a>
        <a href="#shop" data-search="Samsung">Samsung</a>
        <a href="#shop" data-search="MacBook">MacBook</a>
      </nav>

      <nav class="footer-column" aria-label="Support links">
        <h3>Support</h3>
        <a href="${emailUrl}" target="_blank" rel="noreferrer">Email support</a>
        <a href="${whatsappLink("Hello Roy Cell, I need support with an order.")}" target="_blank" rel="noreferrer">WhatsApp support</a>
        <a href="${locationUrl}" target="_blank" rel="noreferrer">Store location</a>
      </nav>

      <address class="footer-column">
        <h3>Contact</h3>
        <a href="tel:${storePhone}">${storePhone}</a>
        <a href="${emailUrl}" target="_blank" rel="noreferrer">${storeEmail}</a>
        <span>Delivery all over Lebanon</span>
      </address>
    </div>

    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} Roy Cell. All rights reserved.</span>
      <span>Quality checked tech • Local support • Secure checkout by WhatsApp</span>
    </div>
  </footer>
`;
void syncProductsFromApi();
}

document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const categoryButton = target.closest<HTMLElement>("[data-category]");
  const searchButton = target.closest<HTMLElement>("[data-search]");
  const searchProductButton = target.closest<HTMLElement>("[data-search-product]");
  const addButton = target.closest<HTMLElement>("[data-add-cart]");
  const favoriteButton = target.closest<HTMLElement>("[data-favorite]");
  const increaseButton = target.closest<HTMLElement>("[data-increase]");
  const decreaseButton = target.closest<HTMLElement>("[data-decrease]");
  const checkoutButton = target.closest<HTMLElement>("[data-checkout]");
  const adminEditButton = target.closest<HTMLElement>("[data-admin-edit]");
  const adminDeleteButton = target.closest<HTMLElement>("[data-admin-delete]");

  if (categoryButton) {
    state.selectedCategory = categoryButton.dataset.category || "All";
    document.querySelectorAll("[data-category]").forEach((node) => node.classList.remove("active"));
    document
      .querySelectorAll(`[data-category="${state.selectedCategory}"]`)
      .forEach((node) => node.classList.add("active"));
    renderProducts();
  }

  if (searchButton) {
    const searchInput = document.querySelector<HTMLInputElement>("#search-input");
    state.query = searchButton.dataset.search || "";
    state.searchOpen = false;
    if (searchInput) searchInput.value = state.query;
    render();
    document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth" });
  }

  if (searchProductButton) {
    const product = products.find((item) => item.id === searchProductButton.dataset.searchProduct);
    const searchInput = document.querySelector<HTMLInputElement>("#search-input");

    if (product) {
      state.query = product.name;
      state.selectedCategory = product.category;
      state.searchOpen = false;

      if (searchInput) searchInput.value = product.name;
      document.querySelectorAll("[data-category]").forEach((node) => node.classList.remove("active"));
      document
        .querySelectorAll(`[data-category="${product.category}"]`)
        .forEach((node) => node.classList.add("active"));
      render();
      document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  if (addButton) {
    const product = products.find((item) => item.id === addButton.dataset.addCart);
    if (product) {
      const existing = state.cart.get(product.id);
      state.cart.set(product.id, { ...product, quantity: existing ? existing.quantity + 1 : 1 });
      addButton.textContent = "Added";
      setTimeout(() => {
        addButton.innerHTML = `${icon("bag")} Add to cart`;
      }, 900);
      renderCart();
      document.querySelector("#cart-panel")?.classList.add("open");
      document.querySelector("#cart-panel")?.setAttribute("aria-hidden", "false");
    }
  }

  if (favoriteButton) {
    const id = favoriteButton.dataset.favorite;
    if (id) {
      state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id);
      renderProducts();
    }
  }

  if (increaseButton) {
    const item = state.cart.get(increaseButton.dataset.increase || "");
    if (item) {
      item.quantity += 1;
      renderCart();
    }
  }

  if (decreaseButton) {
    const id = decreaseButton.dataset.decrease || "";
    const item = state.cart.get(id);
    if (item) {
      item.quantity -= 1;
      if (item.quantity <= 0) {
        state.cart.delete(id);
      }
      renderCart();
    }
  }

  if (checkoutButton) {
    const items = Array.from(state.cart.values());
    if (!items.length) return;
    document.querySelector("#checkout-modal")?.classList.add("open");
    document.querySelector("#checkout-modal")?.setAttribute("aria-hidden", "false");
    document.querySelector("#cart-panel")?.classList.remove("open");
    document.querySelector("#cart-panel")?.setAttribute("aria-hidden", "true");
  }

  if (adminEditButton) {
    sessionStorage.setItem("roy-cell-editing-product", adminEditButton.dataset.adminEdit || "");
    void renderAdmin();
  }

  if (adminDeleteButton) {
    const id = adminDeleteButton.dataset.adminDelete || "";
    if (getAdminToken()) {
      void fetch(`${apiBase}/products/${id}`, {
        method: "DELETE",
        headers: apiHeaders()
      }).then(async () => {
        await syncProductsFromApi();
        void renderAdmin();
      });
    } else {
      products = products.filter((item) => item.id !== id);
      saveProducts();
      void renderAdmin();
    }
  }

  if (target.closest("#admin-logout")) {
    sessionStorage.removeItem(adminSessionKey);
    void renderAdmin();
  }

  if (target.closest("[data-admin-cancel-edit]")) {
    sessionStorage.removeItem("roy-cell-editing-product");
    void renderAdmin();
  }

  if (target.closest("#orders-clear")) {
    if (getAdminToken()) {
      void fetch(`${apiBase}/orders`, {
        method: "DELETE",
        headers: apiHeaders()
      }).then(() => {
        adminOrders = [];
        localStorage.removeItem("roy-cell-orders");
        void renderAdmin();
      });
    } else {
      localStorage.removeItem("roy-cell-orders");
      adminOrders = [];
      void renderAdmin();
    }
  }

  const passwordToggle = target.closest<HTMLElement>("[data-toggle-password]");
  if (passwordToggle) {
    const input = document.querySelector<HTMLInputElement>(
      `#${passwordToggle.dataset.togglePassword}`
    );
    if (input) {
      input.type = input.type === "password" ? "text" : "password";
      passwordToggle.textContent = input.type === "password" ? "Show" : "Hide";
    }
  }

  if (target.closest("#forgot-password")) {
    const resetForm = document.querySelector<HTMLFormElement>("#admin-reset-form");
    if (resetForm) {
      resetForm.hidden = !resetForm.hidden;
    }
  }

  if (target.closest("[data-open-cart]")) {
    document.querySelector("#cart-panel")?.classList.add("open");
    document.querySelector("#cart-panel")?.setAttribute("aria-hidden", "false");
  }

  if (target.closest("[data-close-cart]")) {
    document.querySelector("#cart-panel")?.classList.remove("open");
    document.querySelector("#cart-panel")?.setAttribute("aria-hidden", "true");
  }

  if (target.closest("[data-close-checkout]")) {
    document.querySelector("#checkout-modal")?.classList.remove("open");
    document.querySelector("#checkout-modal")?.setAttribute("aria-hidden", "true");
  }

  if (!target.closest(".search-area")) {
    state.searchOpen = false;
    renderSearchSuggestions();
  }
});

document.querySelector("#search-input")?.addEventListener("input", (event) => {
  state.query = (event.target as HTMLInputElement).value;
  state.searchOpen = true;
  renderProducts();
  renderSearchSuggestions();
});

document.querySelector("#search-input")?.addEventListener("focus", () => {
  state.searchOpen = true;
  renderSearchSuggestions();
});

document.querySelector(".cart-edge-trigger")?.addEventListener("mouseenter", () => {
  document.querySelector("#cart-panel")?.classList.add("open");
  document.querySelector("#cart-panel")?.setAttribute("aria-hidden", "false");
});

document.querySelector("#cart-panel")?.addEventListener("mouseleave", () => {
  document.querySelector("#cart-panel")?.classList.remove("open");
  document.querySelector("#cart-panel")?.setAttribute("aria-hidden", "true");
});

document.querySelector("#trade-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const model = document.querySelector<HTMLInputElement>("#trade-model")?.value.trim();
  const condition = document.querySelector<HTMLSelectElement>("#trade-condition")?.value;
  if (!model) return;

  window.open(
    whatsappLink(`Hello Roy Cell, I want a trade-in estimate for ${model}. Condition: ${condition}.`),
    "_blank",
    "noreferrer"
  );
});

document.addEventListener("submit", async (event) => {
  const form = event.target as HTMLFormElement;

  if (form.id === "admin-create-form") {
    event.preventDefault();
    const message = document.querySelector<HTMLElement>("#admin-message");
    const username = document.querySelector<HTMLInputElement>("#admin-new-username")?.value.trim();
    const password = document.querySelector<HTMLInputElement>("#admin-new-password")?.value;

    if (!username || !password || password.length < 8) {
      if (message) message.textContent = "Use a username and password of at least 8 characters.";
      return;
    }

    try {
      const result = await fetchJson<{ token: string }>("/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      sessionStorage.setItem(adminSessionKey, result.token);
      localStorage.removeItem(adminUserKey);
      adminHasUser = true;
      void renderAdmin();
    } catch (error) {
      if (message) message.textContent = error instanceof Error ? error.message : "Setup failed.";
    }
  }

  if (form.id === "checkout-form") {
    event.preventDefault();
    const items = Array.from(state.cart.values());
    if (!items.length) return;
    const messageNode = document.querySelector<HTMLElement>("#checkout-message");
    const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');

    const firstName = document.querySelector<HTMLInputElement>("#customer-first-name")?.value.trim();
    const lastName = document.querySelector<HTMLInputElement>("#customer-last-name")?.value.trim();
    const phone = document.querySelector<HTMLInputElement>("#customer-phone")?.value.trim();
    const city = document.querySelector<HTMLInputElement>("#customer-city")?.value.trim();
    const street = document.querySelector<HTMLInputElement>("#customer-street")?.value.trim();

    if (!firstName || !lastName || !phone || !city || !street) return;

    if (messageNode) messageNode.textContent = "";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Saving order...";
    }

    const order: Order = {
      id: `RC-${Date.now()}`,
      createdAt: new Date().toISOString(),
      items,
      total: cartTotal(),
      status: "checkout_started"
    };

    try {
      const savedOrder = await fetchJson<{ id: string; createdAt: string }>("/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { firstName, lastName, phone, city, street },
          items: items.map((item) => ({
            productId: item.id,
            name: item.name,
            detail: item.detail,
            price: item.price,
            quantity: item.quantity
          })),
          total: order.total,
          status: order.status
        })
      });

      order.id = savedOrder.id;
      order.createdAt = savedOrder.createdAt;
      saveOrder(order);
    } catch (error) {
      if (messageNode) {
        messageNode.textContent =
          error instanceof Error
            ? `Order was not saved: ${error.message}`
            : "Order was not saved. Make sure the API server is running.";
      }
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = `${icon("whatsapp")} Prepare WhatsApp message`;
      }
      return;
    }

    const orderLines = items
      .map((item) => `- ${item.quantity}x ${item.name} (${item.detail}) - ${formatPrice(item.price * item.quantity)}`)
      .join("\n");

    const message = `Hello Roy Cell, I want to confirm this order.

Order ID: ${order.id}

Customer:
${firstName} ${lastName}
Phone: ${phone}
City: ${city}
Street/building: ${street}

Items:
${orderLines}

Total: ${formatPrice(order.total)}`;

    window.open(whatsappLink(message), "_blank", "noreferrer");
    state.cart.clear();
    document.querySelector("#checkout-modal")?.classList.remove("open");
    document.querySelector("#checkout-modal")?.setAttribute("aria-hidden", "true");
    form.reset();
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = `${icon("whatsapp")} Prepare WhatsApp message`;
    }
    renderCart();
  }

  if (form.id === "admin-login-form") {
    event.preventDefault();
    const message = document.querySelector<HTMLElement>("#admin-message");
    const username = document.querySelector<HTMLInputElement>("#admin-username")?.value.trim();
    const password = document.querySelector<HTMLInputElement>("#admin-password")?.value;

    if (!username || !password) return;

    try {
      const result = await fetchJson<{ token: string }>("/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      sessionStorage.setItem(adminSessionKey, result.token);
      void renderAdmin();
    } catch (error) {
      if (message) message.textContent = error instanceof Error ? error.message : "Login failed.";
    }
  }

  if (form.id === "admin-reset-form") {
    event.preventDefault();
    const message = document.querySelector<HTMLElement>("#admin-message");
    const username = document.querySelector<HTMLInputElement>("#admin-username")?.value.trim();
    const resetKey = document.querySelector<HTMLInputElement>("#admin-reset-key")?.value;
    const newPassword = document.querySelector<HTMLInputElement>("#admin-reset-password")?.value;

    if (!username || !resetKey || !newPassword || newPassword.length < 8) {
      if (message) message.textContent = "Enter username, reset key, and a new password.";
      return;
    }

    try {
      await fetchJson("/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetKey, username, password: newPassword })
      });
      if (message) message.textContent = "Password reset. You can sign in now.";
      form.reset();
      form.hidden = true;
    } catch (error) {
      if (message) message.textContent = error instanceof Error ? error.message : "Reset failed.";
    }
  }

  if (form.id === "admin-product-form") {
    event.preventDefault();
    const message = form.querySelector<HTMLElement>(".product-message");
    const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const idInput = form.querySelector<HTMLInputElement>(".product-id");
    const imageInput = form.querySelector<HTMLInputElement>(".product-image-input");
    const existingProduct = products.find((product) => product.id === idInput?.value);
    const imageFile = imageInput?.files?.[0];
    let image = existingProduct?.image;
    if (imageFile) {
      try {
        image = await resizeImage(imageFile);
      } catch (error) {
        if (message) message.textContent = error instanceof Error ? error.message : "Image upload failed.";
        return;
      }
    }
    const name = form.querySelector<HTMLInputElement>(".product-name")?.value.trim() || "";
    const price = Number(form.querySelector<HTMLInputElement>(".product-price")?.value || 0);

    const product: Product = {
      id: existingProduct?.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `product-${Date.now()}`,
      name,
      detail: form.querySelector<HTMLInputElement>(".product-detail")?.value.trim() || "",
      category: form.querySelector<HTMLSelectElement>(".product-category")?.value || "iPhone",
      price,
      oldPrice: existingProduct?.oldPrice || price,
      badge: form.querySelector<HTMLInputElement>(".product-badge")?.checked ? "Best seller" : undefined,
      rating: existingProduct?.rating || "4.8/5",
      reviews: existingProduct?.reviews || "0",
      color: existingProduct?.color || "graphite",
      image
    };

    if (!product.name || !product.detail || product.price <= 0) {
      if (message) message.textContent = "Please complete name, details, and price.";
      return;
    }

    if (message) message.textContent = existingProduct ? "Updating product..." : "Saving product...";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = existingProduct ? "Updating..." : "Saving...";
    }

    if (getAdminToken()) {
      const body = new FormData();
      body.set("name", product.name);
      body.set("detail", product.detail);
      body.set("category", product.category);
      body.set("price", String(product.price));
      body.set("oldPrice", String(product.oldPrice));
      if (product.badge) body.set("badge", product.badge);
      if (imageFile) body.set("image", imageFile);

      try {
        await fetchJson<Product>(`/products${existingProduct ? `/${existingProduct.id}` : ""}`, {
          method: existingProduct ? "PUT" : "POST",
          headers: apiHeaders(),
          body
        });
        await syncProductsFromApi();
      } catch (error) {
        if (message) message.textContent = error instanceof Error ? error.message : "Could not save product.";
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = existingProduct ? "Update product" : "Add product";
        }
        return;
      }
    } else {
      products = existingProduct
        ? products.map((item) => (item.id === existingProduct.id ? product : item))
        : [product, ...products];
      saveProducts();
    }

    sessionStorage.removeItem("roy-cell-editing-product");
    if (message) message.textContent = "Product saved.";
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = existingProduct ? "Update product" : "Add product";
    }
    void renderAdmin();
  }
});

let lastScrollY = window.scrollY;

window.addEventListener(
  "scroll",
  () => {
    const header = document.querySelector<HTMLElement>(".site-header");
    const currentScrollY = window.scrollY;
    if (!header) return;

    if (currentScrollY > lastScrollY && currentScrollY > 140) {
      header.classList.add("header-hidden");
      state.searchOpen = false;
      renderSearchSuggestions();
    } else {
      header.classList.remove("header-hidden");
    }

    lastScrollY = Math.max(currentScrollY, 0);
  },
  { passive: true }
);

render();
