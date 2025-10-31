async function loadProducts() {
  const res = await fetch('data/products.json');
  console.log('Response status:', res.status);

  const products = await res.json();
  console.log('Parsed JSON:', products);

  const searchInput = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('resultsContainer');
  const lastUpdated = document.getElementById('lastUpdated');

  lastUpdated.textContent = "N/A"; // optional

  // Render all products initially
  renderProducts(products);

  // Filter products on search input
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();

    const filtered = products.filter(p =>
      p.description.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.customer.toLowerCase().includes(term)
    );

    renderProducts(filtered);
  });

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
