async function loadProducts() {
  const res = await fetch('data/products.json');
  const products = await res.json();

  const searchInput = document.getElementById('searchInput');
  const skuSelect = document.getElementById('skuSelect');
  const resultsContainer = document.getElementById('resultsContainer');
  const lastUpdated = document.getElementById('lastUpdated');

  lastUpdated.textContent = "N/A";

  // Initial render: all products as cards
  renderProducts(products);

  // Keep the current breakdown and current sort state
  let currentBreakdown = [];
  let sortConfig = { key: null, asc: true };

  // Keyword search
  searchInput.addEventListener('input', () => {
    const term = searchInput.value.trim().toLowerCase();

    const filtered = products.filter(p =>
      p.sku.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
    );

    renderProducts(filtered);

    // Populate SKU dropdown with SKU + Description (include all descriptions per SKU)
    const skuMap = new Map();
    filtered.forEach(p => {
      if (!skuMap.has(p.sku)) skuMap.set(p.sku, new Set());
      skuMap.get(p.sku).add(p.description);
    });

    skuSelect.innerHTML = `<option value="">Select SKU</option>` +
      [...skuMap.entries()].flatMap(([sku, descriptions]) =>
        [...descriptions].map(desc => `<option value="${sku}">${sku} — ${desc}</option>`)
      ).join('');
  });

  // SKU selection → detailed monthly breakdown
  skuSelect.addEventListener('change', () => {
    const selectedSKU = skuSelect.value;
    if (!selectedSKU) {
      // Show filtered products if no SKU selected
      const term = searchInput.value.trim().toLowerCase();
      const filtered = products.filter(p =>
        p.sku.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
      );
      renderProducts(filtered);
      return;
    }

    const skuProducts = products.filter(p => p.sku === selectedSKU);
    currentBreakdown = getMonthlyBreakdown(skuProducts);
    // reset sort when loading new breakdown
    sortConfig = { key: null, asc: true };
    renderBreakdownTable(currentBreakdown);
  });

  // Render product cards
  function renderProducts(list) {
    if (!list.length) {
      resultsContainer.innerHTML = `<p>No products found.</p>`;
      return;
    }

    resultsContainer.innerHTML = list.map(p => `
      <div class="card">
        <h3>${p.description}</h3>
        <p><strong>SKU:</strong> ${p.sku}</p>
        <p><strong>Customer:</strong> ${p.customer}</p>
        <p><strong>Quantity:</strong> ${p.qty}</p>
        <p><strong>Price:</strong> $${Number(p.price).toFixed(2)}</p>
        <p><strong>Cost:</strong> $${Number(p.cost).toFixed(2)}</p>
        <p><strong>Invoice #:</strong> ${p["inv#"]}</p>
      </div>
    `).join('');
  }

  // Group products by month + customer and compute avg price & avg cost per unit.
  // We also add monthKey (YYYY-MM) to allow correct chronological sorting.
  function getMonthlyBreakdown(list) {
    const grouped = {};
    list.forEach(p => {
      const d = new Date(p.date);
      if (isNaN(d)) return;
      const month = d.toLocaleString('default', { month: 'short', year: 'numeric' }); // display
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // for sorting
      const key = `${p.customer}_${monthKey}`;

      if (!grouped[key]) {
        grouped[key] = {
          customer: p.customer,
          month,
          monthKey,
          totalQty: 0,
          totalPrice: 0, // price * qty
          totalCostAmount: 0 // cost * qty
        };
      }

      const qty = Number(p.qty) || 0;
      const price = Number(p.price) || 0;
      const cost = Number(p.cost) || 0;

      grouped[key].totalQty += qty;
      grouped[key].totalPrice += price * qty;
      grouped[key].totalCostAmount += cost * qty;
    });

    return Object.values(grouped).map(row => ({
      ...row,
      avgPrice: row.totalQty ? row.totalPrice / row.totalQty : 0,
      avgCost: row.totalQty ? row.totalCostAmount / row.totalQty : 0
    }));
  }

  // Render monthly breakdown table and attach sortable headers
  function renderBreakdownTable(data) {
    // ensure we have data
    if (!data || data.length === 0) {
      resultsContainer.innerHTML = `<p>No breakdown data available.</p>`;
      return;
    }

    resultsContainer.innerHTML = `
      <h3>Monthly Breakdown for SKU: ${skuSelect.value}</h3>
      <table class="breakdown-table">
        <thead>
          <tr>
            <th data-key="customer">Customer</th>
            <th data-key="month">Month</th>
            <th data-key="totalQty">Total Qty</th>
            <th data-key="avgPrice">Avg Price</th>
            <th data-key="avgCost">Cost</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              <td>${row.customer}</td>
              <td>${row.month}</td>
              <td>${row.totalQty}</td>
              <td>$${row.avgPrice.toFixed(2)}</td>
              <td>$${row.avgCost.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Attach click handlers to headers for sorting
    document.querySelectorAll('.breakdown-table th').forEach(th => {
      th.style.cursor = 'pointer';
      th.onclick = () => {
        const key = th.dataset.key;
        // toggle asc/desc if same key; otherwise asc
        sortConfig.asc = sortConfig.key === key ? !sortConfig.asc : true;
        sortConfig.key = key;

        // create sorted copy
        const sorted = [...currentBreakdown].sort((a, b) => {
          // month should use monthKey for chronological sort
          if (key === 'month') {
            const av = a.monthKey;
            const bv = b.monthKey;
            return sortConfig.asc ? av.localeCompare(bv) : bv.localeCompare(av);
          }

          // strings
          if (typeof a[key] === 'string') {
            return sortConfig.asc ? a[key].localeCompare(b[key]) : b[key].localeCompare(a[key]);
          }

          // numbers (avgPrice, avgCost, totalQty)
          return sortConfig.asc ? a[key] - b[key] : b[key] - a[key];
        });

        // update the currentBreakdown so repeated sorts keep order
        currentBreakdown = sorted;
        renderBreakdownTable(sorted);
      };
    });
  }
}

loadProducts();
