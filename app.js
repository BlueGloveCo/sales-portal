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

  let currentBreakdown = [];

  // Keyword search event
  searchInput.addEventListener('input', () => {
    const term = searchInput.value.trim().toLowerCase();

    // Filter products by keyword in SKU or description
    const filtered = products.filter(p =>
      p.sku.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
    );

    // Render filtered products as cards
    renderProducts(filtered);

        // Populate SKU dropdown from filtered results
const uniqueSkus = [...new Set(filtered.map(p => p.sku))];
skuSelect.innerHTML = `<option value="">Select SKU</option>` +
  uniqueSkus.map(sku => {
    const product = filtered.find(p => p.sku === sku);
    return `<option value="${sku}">${sku} — ${product.description}</option>`;
  }).join('');

  // SKU selection event
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
    renderBreakdownTable(currentBreakdown);
  });

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

  function getMonthlyBreakdown(list) {
    const grouped = {};
    list.forEach(p => {
      // Parse date safely
      const d = new Date(p.date);
      if (isNaN(d)) return;
      const month = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      const key = `${p.customer}_${month}`;
      if (!grouped[key]) grouped[key] = { customer: p.customer, month, totalQty: 0, totalPrice: 0, totalCost: 0 };
      grouped[key].totalQty += Number(p.qty) || 0;
      grouped[key].totalPrice += (Number(p.price) || 0) * (Number(p.qty) || 0);
      grouped[key].totalCost += (Number(p.cost) || 0) * (Number(p.qty) || 0);
    });
    return Object.values(grouped).map(row => ({
      ...row,
      avgPrice: row.totalQty ? row.totalPrice / row.totalQty : 0
    }));
  }

  function renderBreakdownTable(data) {
    resultsContainer.innerHTML = `
      <h3>Monthly Breakdown for SKU: ${skuSelect.value}</h3>
      <table class="breakdown-table">
        <thead>
          <tr>
            <th data-key="customer">Customer</th>
            <th data-key="month">Month</th>
            <th data-key="totalQty">Total Qty</th>
            <th data-key="avgPrice">Avg Price</th>
            <th data-key="totalCost">Total Cost</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              <td>${row.customer}</td>
              <td>${row.month}</td>
              <td>${row.totalQty}</td>
              <td>$${row.avgPrice.toFixed(2)}</td>
              <td>$${row.totalCost.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
}

loadProducts();
