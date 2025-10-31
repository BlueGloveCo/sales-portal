async function loadProducts() {
  const res = await fetch('data/products.json');
  const products = await res.json();

  const searchInput = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('resultsContainer');
  const lastUpdated = document.getElementById('lastUpdated');

  lastUpdated.textContent = "N/A"; // optional

  // Render all products initially
  renderProducts(products);

  // 🧩 Listen for search input
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.trim().toLowerCase();

    if (term.length === 0) {
      // show all cards again
      renderProducts(products);
      return;
    }

    // 👇 NEW: use breakdown view instead of simple filter
    const breakdown = getMonthlyBreakdown(products, term);

    if (breakdown.length === 0) {
      resultsContainer.innerHTML = `<p>No data found for "${term}".</p>`;
      return;
    }

    // 👇 Render breakdown table
    resultsContainer.innerHTML = `
      <h3>Monthly Breakdown for "${term.toUpperCase()}"</h3>
      <table class="breakdown-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Month</th>
            <th>Total Quantity</th>
          </tr>
        </thead>
        <tbody>
          ${breakdown.map(row => `
            <tr>
              <td>${row.customer}</td>
              <td>${row.month}</td>
              <td>${row.totalQty}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  });

  // 🧩 Original card renderer
  function renderProducts(list) {
    if (!list || list.length === 0) {
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
        <p><strong>Rep:</strong> ${p.rep}</p>
        <p><strong>Invoice #:</strong> ${p["inv#"]}</p>
      </div>
    `).join('');
  }
}

loadProducts();

// ============================
// NEW breakdown logic
// ============================
function getMonthlyBreakdown(products, searchTerm) {
  // Filter by product name or SKU
  const filtered = products.filter(p =>
    p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by customer + month
  const grouped = {};

  filtered.forEach(p => {
    const month = new Date(p.date).toLocaleString('default', { month: 'short', year: 'numeric' });
    const key = `${p.customer}_${month}`;
    if (!grouped[key]) {
      grouped[key] = {
        customer: p.customer,
        month,
        totalQty: 0
      };
    }
    grouped[key].totalQty += Number(p.qty) || 0;
  });

  // Convert object → array
  return Object.values(grouped);
}
