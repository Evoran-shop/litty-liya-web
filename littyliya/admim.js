/* =====================================================
   LITTY LIYA — admin.js (Firestore version)

   Products এখন Firestore এ save হয়।
   Collection: "products"

   প্রতিটা document এ থাকে:
   {
     name:      string,
     category:  string,
     price:     number,
     image:     string (URL),
     desc:      string,
     createdAt: Firestore Timestamp
   }

   Admin করতে পারে:
   ✅ Product add  → Firestore এ নতুন doc create
   ✅ Product delete → Firestore doc delete
   ✅ Category manage → localStorage (local only)
   ✅ Realtime dashboard → onSnapshot listener
===================================================== */

/* ─── Default categories (local only) ─── */
const DEFAULT_CATEGORIES = ["Lips", "Eyes", "Face", "Skincare"];

function getCategories() {
  const stored = localStorage.getItem('ll_categories');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('ll_categories', JSON.stringify(DEFAULT_CATEGORIES));
  return DEFAULT_CATEGORIES;
}
function saveCategories(cats) {
  localStorage.setItem('ll_categories', JSON.stringify(cats));
}

/* ─── In-memory product list (updated by Firestore listener) ─── */
let allProducts = [];

/* =============================================
   SECTION NAVIGATION
============================================= */
const SECTIONS = ['dashboard', 'add-product', 'manage-products', 'categories'];

function showSection(name) {
  SECTIONS.forEach(s => {
    const el = document.getElementById(`section-${s}`);
    if (el) el.style.display = s === name ? 'block' : 'none';
  });

  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.toggle('active', link.dataset.section === name);
  });

  const titles = {
    'dashboard':       'Dashboard <span>Overview</span>',
    'add-product':     'Add <span>Product</span>',
    'manage-products': 'Manage <span>Products</span>',
    'categories':      'Manage <span>Categories</span>',
  };
  document.getElementById('page-title').innerHTML = titles[name] || name;

  if (name === 'categories') renderCategories();
}

document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    showSection(link.dataset.section);
  });
});

/* =============================================
   FIRESTORE REALTIME LISTENER
   onSnapshot → allProducts update → UI refresh
============================================= */
function initFirestoreListener() {
  const dashTable = document.getElementById('dash-table');

  if (dashTable) dashTable.innerHTML = `
    <tr><td colspan="5" style="text-align:center;padding:30px;color:var(--muted);">
      <i class="fas fa-spinner fa-spin" style="margin-right:8px;color:var(--accent-1);"></i>
      Connecting to Firestore...
    </td></tr>`;

  db.collection('products')
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        allProducts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        renderDashboard();

        const manageEl = document.getElementById('section-manage-products');
        if (manageEl && manageEl.style.display !== 'none') {
          renderManageTable();
        }

        populateCatDropdown();
      },
      (error) => {
        console.error('Firestore error:', error);
        if (dashTable) dashTable.innerHTML = `
          <tr><td colspan="5" style="text-align:center;padding:30px;color:#e76f51;">
            <i class="fas fa-exclamation-triangle" style="margin-right:8px;"></i>
            Firestore connection failed.
          </td></tr>`;
      }
    );
}

/* =============================================
   DASHBOARD
============================================= */
function renderDashboard() {
  const cats = [...new Set(allProducts.map(p => p.category))];
  const avg  = allProducts.length > 0
    ? Math.round(allProducts.reduce((s, p) => s + p.price, 0) / allProducts.length)
    : 0;

  document.getElementById('stat-products').textContent = allProducts.length;
  document.getElementById('stat-cats').textContent     = cats.length;
  document.getElementById('stat-avg').textContent      = '৳' + avg.toLocaleString();

  const table = document.getElementById('dash-table');
  if (!table) return;

  if (allProducts.length === 0) {
    table.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--muted);">
      No products yet. Add your first product!
    </td></tr>`;
    return;
  }

  table.innerHTML = `
    <thead>
      <tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Action</th></tr>
    </thead>
    <tbody>
      ${allProducts.slice(0, 8).map(p => `
        <tr>
          <td><img class="table-thumb" src="${p.image}" alt="${p.name}"
            onerror="this.src='https://via.placeholder.com/48x48?text=?'"/></td>
          <td>${p.name}</td>
          <td><span class="table-cat">${p.category}</span></td>
          <td class="table-price">৳ ${Number(p.price).toLocaleString()}</td>
          <td>
            <button class="tbl-del-btn" onclick="deleteProduct('${p.id}', '${p.name.replace(/'/g,"\\'")}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </td>
        </tr>
      `).join('')}
    </tbody>`;
}

/* =============================================
   ADD PRODUCT — saves to Firestore
============================================= */
function populateCatDropdown() {
  const select = document.getElementById('p-cat');
  if (!select) return;
  const cats = getCategories();
  select.innerHTML = '<option value="">Select category</option>' +
    cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

document.getElementById('p-img').addEventListener('input', function () {
  const preview = document.getElementById('img-preview');
  const url = this.value.trim();
  if (url) {
    preview.innerHTML = `<img src="${url}" alt="preview" onerror="resetPreview()"/>`;
    preview.classList.add('has-img');
  } else {
    resetPreview();
  }
});

function resetPreview() {
  const preview = document.getElementById('img-preview');
  preview.innerHTML = '<span><i class="fas fa-image" style="margin-right:8px;"></i>Enter image URL to preview</span>';
  preview.classList.remove('has-img');
}

/* Form submit — Firestore এ add করো */
document.getElementById('add-product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlerts(['add-success', 'add-error']);

  const name  = document.getElementById('p-name').value.trim();
  const price = parseFloat(document.getElementById('p-price').value);
  const cat   = document.getElementById('p-cat').value;
  const img   = document.getElementById('p-img').value.trim();
  const desc  = document.getElementById('p-desc').value.trim();

  if (!name || !price || !cat || !img) {
    showAlert('add-error'); return;
  }

  const submitBtn = document.querySelector('#add-product-form .btn-primary-sm');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving to Firestore...';

  try {
    /* ── Firestore add ── */
    await db.collection('products').add({
      name,
      price,
      category: cat,
      image:    img,
      desc:     desc || `Premium ${name} by Litty Liya.`,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    document.getElementById('add-product-form').reset();
    resetPreview();
    showAlert('add-success');

    setTimeout(() => {
      hideAlerts(['add-success']);
      showSection('manage-products');
      renderManageTable();
    }, 1500);

  } catch (err) {
    console.error('Firestore add error:', err);
    showAlert('add-error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Product';
  }
});

/* =============================================
   MANAGE PRODUCTS TABLE
============================================= */
let manageFilter = 'all';

function renderManageTable() {
  const table    = document.getElementById('manage-table');
  const filterEl = document.getElementById('filter-cat');
  if (!table) return;

  const cats = ['all', ...new Set(allProducts.map(p => p.category))];
  if (filterEl) {
    filterEl.innerHTML = cats.map(c =>
      `<option value="${c}" ${c === manageFilter ? 'selected' : ''}>${c === 'all' ? 'All Categories' : c}</option>`
    ).join('');
    filterEl.onchange = () => { manageFilter = filterEl.value; renderManageTable(); };
  }

  const filtered = manageFilter === 'all'
    ? allProducts
    : allProducts.filter(p => p.category === manageFilter);

  if (filtered.length === 0) {
    table.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--muted);">No products found.</td></tr>`;
    return;
  }

  table.innerHTML = `
    <thead>
      <tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Description</th><th>Actions</th></tr>
    </thead>
    <tbody>
      ${filtered.map(p => `
        <tr data-id="${p.id}">
          <td><img class="table-thumb" src="${p.image}" alt="${p.name}"
            onerror="this.src='https://via.placeholder.com/48x48?text=?'"/></td>
          <td>
            <strong style="color:var(--white);">${p.name}</strong><br/>
            <small style="color:var(--muted);font-size:0.7rem;">ID: ${p.id}</small>
          </td>
          <td><span class="table-cat">${p.category}</span></td>
          <td class="table-price">৳ ${Number(p.price).toLocaleString()}</td>
          <td style="max-width:200px;color:var(--muted);font-size:0.8rem;">
            ${p.desc ? p.desc.substring(0,60) + '...' : '—'}
          </td>
          <td>
            <button class="tbl-del-btn" onclick="deleteProduct('${p.id}', '${p.name.replace(/'/g,"\\'")}')">
              <i class="fas fa-trash"></i> Delete
            </button>
          </td>
        </tr>
      `).join('')}
    </tbody>`;
}

/* =============================================
   DELETE PRODUCT — Firestore থেকে remove
============================================= */
async function deleteProduct(docId, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

  try {
    await db.collection('products').doc(docId).delete();
    /* onSnapshot auto-refreshes the UI */
  } catch (err) {
    console.error('Delete error:', err);
    alert('Failed to delete. Check console.');
  }
}

/* =============================================
   CATEGORIES (localStorage only)
============================================= */
function renderCategories() {
  const cats    = getCategories();
  const display = document.getElementById('cat-tags-display');
  if (!display) return;

  display.innerHTML = cats.map(cat => `
    <div class="cat-tag default">
      ${cat}
      <button class="cat-del-btn" onclick="deleteCategory('${cat}')">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `).join('');

  populateCatDropdown();
  renderCatSummary();
}

function addCategory() {
  hideAlerts(['cat-success', 'cat-error']);
  const input = document.getElementById('new-cat-input');
  const name  = input.value.trim();
  if (!name) { showAlert('cat-error'); return; }

  const cats = getCategories();
  if (cats.map(c => c.toLowerCase()).includes(name.toLowerCase())) {
    showAlert('cat-error'); return;
  }

  cats.push(name);
  saveCategories(cats);
  input.value = '';
  showAlert('cat-success');
  setTimeout(() => hideAlerts(['cat-success']), 2000);
  renderCategories();
}

function deleteCategory(catName) {
  const inUse = allProducts.some(p => p.category === catName);
  if (inUse) { alert(`Cannot delete "${catName}" — it has products assigned.`); return; }
  if (!confirm(`Delete category "${catName}"?`)) return;
  let cats = getCategories().filter(c => c !== catName);
  saveCategories(cats);
  renderCategories();
}

function renderCatSummary() {
  const table = document.getElementById('cat-summary-table');
  if (!table) return;
  const cats = getCategories();

  table.innerHTML = `
    <thead><tr><th>Category</th><th>Products</th><th>Avg Price</th></tr></thead>
    <tbody>
      ${cats.map(cat => {
        const cp  = allProducts.filter(p => p.category === cat);
        const avg = cp.length > 0
          ? Math.round(cp.reduce((s,p) => s + p.price, 0) / cp.length) : 0;
        return `<tr>
          <td><span class="table-cat">${cat}</span></td>
          <td style="color:var(--white);">${cp.length}</td>
          <td class="table-price">${cp.length > 0 ? '৳'+avg.toLocaleString() : '—'}</td>
        </tr>`;
      }).join('')}
    </tbody>`;
}

/* =============================================
   ALERT HELPERS
============================================= */
function showAlert(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 4000); }
}
function hideAlerts(ids) {
  ids.forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('show'); });
}

/* Manage table refresh on sidebar click */
document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', () => {
    if (link.dataset.section === 'manage-products') setTimeout(renderManageTable, 100);
  });
});

/* =============================================
   INIT
============================================= */
function init() {
  initFirestoreListener();
  populateCatDropdown();
  showSection('dashboard');
}

init();