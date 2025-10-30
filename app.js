async function loadProducts() {
  const res = await fetch('data/products.json');
  const products = await res.json();

  const searchInput = document.getElementById('searchInput');
  const resultsContainer = document.getElementById('resultsContainer');
  const lastUpdated = document.getElementById('lastUpdated');

  // Show last updated date (if available in JSON)
  if (products.meta && products.meta.last_updated) {
    lastUpdated.textContent = products.meta.last_updated;
  }

  // Render all products initially
  renderProducts(products.items);

  // Filter products on search input
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = products.items.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
    renderProducts(filtered);
  });

  function renderProducts(list) {
    resultsContainer.innerHTML = list.map(p => `
      <div class="card">
        <h3>${p.name}</h3>
        <p><strong>Category:</strong> ${p.category}</p>
        <p><strong>Price:</strong> $${p.price.toFixed(2)}</p>
        <p><strong>Cost:</strong> $${p.cost.toFixed(2)}</p>
      </div>
    `).join('');
  }
}

loadProducts();
