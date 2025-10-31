async function loadProducts() {
  const res = await fetch('data/products.json');
  const products = await res.json();

  const searchInput = document.getElementById('searchInput');
  const customerFilter = document.getElementById('customerFilter');
  const minPriceFilter = document.getElementById('minPriceFilter');
  const maxPriceFilter = document.getElementById('maxPriceFilter');
  const resultsContainer = document.getElementById('resultsContainer');
  const lastUpdated = document.getElementById('lastUpdated');

  lastUpdated.textContent = "N/A"; // optional

  // Populate Customer dropdown
  const uniqueCustomers = [...new Set(products.map(p => p.customer).filter(Boolean))];
  uniqueCustomers.forEach(c => customerFilter.insertAdjacentHTML('beforeend', `<option value="${c}">${c}</option>`));

  // Render all products initially
  renderProducts(products);

  // Listen to all filter inputs
  [searchInput, customerFilter, minPriceFilter, maxPriceFilter].forEach(el => {
    el.addEventListener('input', updateResults);
    el.addEventListener('change', updateResults);
  });

  function updateResults() {
    const filters = {
      term: searchInput.value.trim().toLowerCase(),
      customer: customerFilter.value,
      minPrice: minPriceFilter.value ? Number(minPriceFilter.value) : null,
      maxPrice: maxPriceFilter.value ? Number(maxPriceFilter.value) : null
    };

    // If all filters empty → show all cards
    if (!filters.term && !filters.customer && filters.minPrice == null && filters.maxPrice == null) {
      renderProducts(products);
      return;
    }

    const breakdown = getFilteredBreakdown(products, filters);

    if (breakdown.length === 0) {
      resultsContainer.innerHTML = `<p>No products match the selected filters.</p>`;
      return;
    }

    // Render breakdown table
    resultsContainer.innerHTML = `
      <h3>Filtered Monthly Breakdown</h3>
      <table class="breakdown-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Month</th>
            <th>Total Qty</th>
            <th>Total Price</th>
            <th>Total Cost</th>
          </tr>
        </thead>
        <tbody>
          ${breakdown.map(row => `
            <tr>
              <td>${row.customer}</td>
              <td>${row.month}</td>
              <td>${row.totalQty}</td>
              <td>$${row.totalPrice.toFixed(2)}</td>
              <td>$${row.totalCost.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

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
        <p><strong>Invoice #:</strong> ${p["inv#"]}</p>
      </div>
    `).join('');
  }
}

// Filter + grouping function (same as before)
function getFilteredBreakdown(products, filters) {
  const { term, customer, minPrice, maxPrice } = filters;

  const filtered = products.filter(p => {
    if (term && !p.description.toLowerCase().includes(term.toLowerCase()) &&
        !p.sku.toLowerCase().includes(term.toLowerCase())) return false;

    if (customer && p.customer !== customer) return false;

    if (minPrice != null && Number(p.price) < minPrice) return false;
    if (maxPrice != null && Number(p.price) > maxPrice) return false;

    return true;
  });

  const grouped = {};
  filtered.forEach(p => {
    const month = new Date(p.date).toLocaleString('default', { month: 'short', year: 'numeric' });
    const key = `${p.customer}_${month}`;
    if (!grouped[key]) {
      grouped[key] = {
        customer: p.customer,
        month,
        totalQty: 0,
        totalPrice: 0,
        totalCost: 0
      };
    }
    grouped[key].totalQty += Number(p.qty) || 0;
    grouped[key].totalPrice += (Number(p.price) || 0) * (Number(p.qty) || 0);
    grouped[key].totalCost += (Number(p.cost) || 0) * (Number(p.qty) || 0);
  });

  return Object.values(grouped);
}

// Start the app
loadProducts();
