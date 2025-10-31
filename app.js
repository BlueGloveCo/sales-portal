async function loadProducts() {
  const res = await fetch('data/products.json');
  const products = await res.json();

  const skuFilter = document.getElementById('skuFilter');
  const customerFilter = document.getElementById('customerFilter');
  const resultsContainer = document.getElementById('resultsContainer');
  const lastUpdated = document.getElementById('lastUpdated');

  lastUpdated.textContent = "N/A"; // optional

  // Initially render all products
  renderProducts(products);

  // Event listeners
  [skuFilter, customerFilter].forEach(el => {
    el.addEventListener('input', updateResults);
    el.addEventListener('change', updateResults);
  });

  function updateResults() {
    const filters = {
      sku: skuFilter.value.trim().toLowerCase(),
      customer: customerFilter.value
    };

    // Filter products by SKU/description
    let filteredProducts = products.filter(p =>
      !filters.sku || p.sku.toLowerCase().includes(filters.sku) ||
      p.description.toLowerCase().includes(filters.sku)
    );

    // Populate Customer dropdown based on filtered products
    const uniqueCustomers = [...new Set(filteredProducts.map(p => p.customer).filter(Boolean))];
    customerFilter.innerHTML = `<option value="">All Customers</option>` +
      uniqueCustomers.map(c => `<option value="${c}">${c}</option>`).join('');

    // Apply customer filter
    if (filters.customer) {
      filteredProducts = filteredProducts.filter(p => p.customer === filters.customer);
    }

    // Render either cards or breakdown
    if (filters.sku || filters.customer) {
      const breakdown = getFilteredBreakdown(filteredProducts);
      if (breakdown.length === 0) {
        resultsContainer.innerHTML = `<p>No matching purchases found.</p>`;
      } else {
        resultsContainer.innerHTML = renderBreakdownTable(breakdown);
      }
    } else {
      renderProducts(products);
    }
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

  function getFilteredBreakdown(filteredProducts) {
    const grouped = {};
    filteredProducts.forEach(p => {
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

  function renderBreakdownTable(breakdown) {
    return `
      <h3>Monthly Breakdown</h3>
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
}

loadProducts();
