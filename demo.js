/***********************
 * DEMO CONFIG
 ***********************/
const DEMO_MODE = true;
const DEMO_TIME_LIMIT = 15 * 60 * 1000; // 15 minutes
const DEMO_START_KEY = "demoStartTime";
let demoDeleteUsed = false;

// Start timer
let demoStart = localStorage.getItem(DEMO_START_KEY);
if (!demoStart) {
  demoStart = Date.now();
  localStorage.setItem(DEMO_START_KEY, demoStart);
}

function demoExpired() {
  return Date.now() - demoStart > DEMO_TIME_LIMIT;
}

function checkDemo() {
  if (demoExpired()) {
    alert("Demo time expired (15 minutes).\nPlease purchase the full version.");
    location.reload();
    return true;
  }
  return false;
}

// Reset demo data
localStorage.removeItem("salesToday");

/***********************
 * ORIGINAL POS CODE
 ***********************/
let db;
let cart = [];
let salesToday = [];

// Shop info
localStorage.setItem("shopName", "Convenience POS (Demo)");
localStorage.setItem("shopAddress", "Demo Address");
document.getElementById("shopNameDisplay").textContent = localStorage.getItem("shopName");

// ---------- IndexedDB ----------
function initDB(){
  const req = indexedDB.open("POS_DEMO_DB",1);
  req.onsuccess = e => { db = e.target.result; loadProducts(); };
  req.onupgradeneeded = e => {
    db = e.target.result;
    const store = db.createObjectStore("products",{ keyPath:"id", autoIncrement:true });
  };
}

// ---------- Demo Products ----------
function seedDemoProducts(){
  const tx = db.transaction("products","readwrite");
  const store = tx.objectStore("products");
  store.add({name:"Coffee",price:50,stock:10,category:"Drinks"});
  store.add({name:"Burger",price:120,stock:5,category:"Food"});
  store.add({name:"Water",price:20,stock:20,category:"Drinks"});
}

function loadProducts(){
  const tx = db.transaction("products","readonly");
  tx.objectStore("products").getAll().onsuccess = e => {
    if(e.target.result.length === 0) seedDemoProducts();
    displayProducts(e.target.result);
  };
}

// ---------- UI ----------
function displayProducts(products){
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";
  products.forEach(p=>{
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-name">${p.name}</div>
      <div class="product-meta">₱${p.price} | Stock: ${p.stock}</div>
      <div class="add-btn">Add</div>
      <div class="button-row">
        <div class="small-btn del">Delete</div>
      </div>
    `;

    card.querySelector(".add-btn").onclick = () => {
      if(checkDemo()) return;
      addToCart(p);
    };

    card.querySelector(".del").onclick = () => {
      if(checkDemo()) return;
      if(demoDeleteUsed){
        alert("This is a demo only.\nPlease purchase the full version.");
        return;
      }
      demoDeleteUsed = true;
      deleteProduct(p.id);
    };

    grid.appendChild(card);
  });
}

function deleteProduct(id){
  const tx = db.transaction("products","readwrite");
  tx.objectStore("products").delete(id).onsuccess = loadProducts;
}

// ---------- Cart ----------
function addToCart(p){
  const f = cart.find(i=>i.name===p.name);
  if(f) f.qty++;
  else cart.push({...p,qty:1});
  renderCart();
}

function renderCart(){
  const list = document.getElementById("cartList");
  const totalEl = document.getElementById("cartTotal");
  const countEl = document.getElementById("cartCount");
  list.innerHTML="";
  let t=0,c=0;
  cart.forEach(i=>{
    c+=i.qty; t+=i.qty*i.price;
    list.innerHTML+=`<div>${i.name} x ${i.qty}</div>`;
  });
  countEl.textContent=c;
  totalEl.textContent=t.toFixed(2);
}

// ---------- Disabled Features ----------
document.getElementById("downloadReport").onclick = () =>
  alert("Demo version: Download disabled.");

document.getElementById("btn-cash").onclick = () =>
  alert("Demo version: Checkout limited.\nPurchase full version.");

// ---------- Init ----------
initDB();
