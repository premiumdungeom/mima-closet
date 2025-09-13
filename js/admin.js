// Admin functionality with MongoDB integration
const API_BASE_URL = 'https://mima-closet.onrender.com/api'; // Change to your server URL

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is on login page
    if (window.location.pathname.endsWith('admin.html')) {
        const loginForm = document.getElementById('admin-login-form');
        
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                if (email === 'Miracleise001@gmail.com' && password === 'MIMASPLACE0001') {
                    localStorage.setItem('adminLoggedIn', 'true');
                    window.location.href = 'admin-panel.html';
                } else {
                    alert('Invalid login credentials. Please try again.');
                }
            });
        }
    }
    
    // Check if user is on admin panel
    if (window.location.pathname.endsWith('admin-panel.html')) {
        // Check if admin is logged in
        if (localStorage.getItem('adminLoggedIn') !== 'true') {
            window.location.href = 'admin.html';
            return;
        }
        
        // Add export/import buttons
        addExportImportButtons();
        
        // Load existing products
        loadAdminProducts();
        
        // Handle product form submission
        const productForm = document.getElementById('product-form');
        if (productForm) {
            productForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                
                try {
                    submitBtn.textContent = 'Adding Product...';
                    submitBtn.disabled = true;
                    
                    // Get form values
                    const name = document.getElementById('product-name').value;
                    const price = document.getElementById('product-price').value;
                    const originalPrice = document.getElementById('original-price').value;
                    const discount = document.getElementById('product-discount').value;
                    const description = document.getElementById('product-description').value;
                    const category = document.getElementById('product-category').value;
                    const image = document.getElementById('product-image').value;
                    const soldOut = document.getElementById('product-soldout').checked;
                    
                    if (!name || !price || !category) {
                        showNotification('Please fill in all required fields (Name, Price, Category).', 'error');
                        return;
                    }
                    
                    // Create product object
                    const productData = {
                        name: name,
                        price: `₦${Number(price).toLocaleString()}`,
                        originalPrice: originalPrice ? `₦${Number(originalPrice).toLocaleString()}` : '',
                        discount: discount || '',
                        description: description,
                        image: image || 'https://files.catbox.moe/da5lzg.png',
                        category: category,
                        mainCategory: category,
                        rating: 4.5,
                        ratingCount: "1K",
                        purchases: "New product",
                        delivery: "FREE delivery within 3-5 days",
                        soldOut: soldOut
                    };
                    
                    // Add to MongoDB
                    const success = await addProductToDatabase(productData);
                    
                    if (success) {
                        // Reset form
                        productForm.reset();
                        document.getElementById('product-image').value = 'https://files.catbox.moe/da5lzg.png';
                        
                        // Reload products
                        loadAdminProducts();
                        
                        showNotification('Product added successfully to database!', 'success');
                    } else {
                        showNotification('Failed to add product to database.', 'error');
                    }
                    
                } catch (error) {
                    console.error('Error adding product:', error);
                    showNotification('Error adding product.', 'error');
                } finally {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
        
        // Logout functionality
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                localStorage.removeItem('adminLoggedIn');
                window.location.href = 'index.html';
            });
        }
    }
});

// Add product to MongoDB
async function addProductToDatabase(productData) {
    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to add product');
        }
        
        return true;
    } catch (error) {
        console.error('Error adding to database:', error);
        return false;
    }
}

// Add export/import buttons to admin panel
function addExportImportButtons() {
    const adminHeader = document.querySelector('.admin-header');
    if (!adminHeader) return;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'admin-utility-buttons';
    buttonContainer.innerHTML = `
        <button id="export-btn" class="btn export-btn">
            <i class="fas fa-download"></i> Export Products
        </button>
        <button id="import-btn" class="btn import-btn">
            <i class="fas fa-upload"></i> Import Products
        </button>
        <input type="file" id="import-file" accept=".json" style="display: none;">
    `;
    
    adminHeader.appendChild(buttonContainer);
    
    // Add event listeners
    document.getElementById('export-btn').addEventListener('click', exportProducts);
    document.getElementById('import-btn').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', importProducts);
}

// Export products to JSON file
async function exportProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        const products = await response.json();
        
        if (products.length === 0) {
            showNotification('No products to export.', 'warning');
            return;
        }
        
        const dataStr = JSON.stringify(products, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `mimasplace-products-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification(`Exported ${products.length} products successfully!`, 'success');
    } catch (error) {
        console.error('Error exporting products:', error);
        showNotification('Failed to export products.', 'error');
    }
}

// Import products from JSON file
async function importProducts(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const products = JSON.parse(e.target.result);
            if (!Array.isArray(products)) {
                throw new Error('Invalid file format');
            }
            
            // Import each product
            let importedCount = 0;
            for (const product of products) {
                try {
                    // Remove ID to let MongoDB generate a new one
                    const { id, ...productData } = product;
                    const response = await fetch(`${API_BASE_URL}/products`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(productData)
                    });
                    
                    if (response.ok) {
                        importedCount++;
                    }
                } catch (error) {
                    console.error('Error importing product:', product.name, error);
                }
            }
            
            // Reload products
            loadAdminProducts();
            
            showNotification(`Imported ${importedCount} out of ${products.length} products successfully!`, 'success');
            
            // Clear file input
            event.target.value = '';
            
        } catch (error) {
            showNotification('Error importing products: Invalid file format', 'error');
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

// Load products into admin panel
async function loadAdminProducts() {
    const productsContainer = document.getElementById('admin-products');
    if (!productsContainer) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        const products = await response.json();
        
        // Clear container
        productsContainer.innerHTML = '';
        
        // Check if we have products
        if (products.length === 0) {
            productsContainer.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open"></i>
                    <h3>No Products Yet</h3>
                    <p>Add your first product using the form above</p>
                </div>
            `;
            return;
        }
        
        // Add products to container (newest first)
        const sortedProducts = [...products].reverse();
        
        sortedProducts.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.setAttribute('data-id', product.id);
            productItem.innerHTML = `
                ${product.soldOut ? '<div class="sold-out-badge">SOLD OUT</div>' : ''}
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://files.catbox.moe/da5lzg.png'">
                    <div class="product-category-badge">${product.category.toUpperCase()}</div>
                </div>
                <div class="product-details">
                    <h3>${product.name}</h3>
                    <p class="product-price">${product.price} ${product.originalPrice ? `<span class="original-price">${product.originalPrice}</span>` : ''}</p>
                    <p class="product-desc">${product.description}</p>
                    <p class="product-status"><strong>Status:</strong> ${product.soldOut ? 'Sold Out' : 'Available'} | <strong>Category:</strong> ${product.category}</p>
                </div>
                <div class="product-actions">
                    <button class="edit-btn" data-id="${product.id}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="soldout-btn" data-id="${product.id}">${product.soldOut ? '<i class="fas fa-undo"></i> Restock' : '<i class="fas fa-times"></i> Mark Sold Out'}</button>
                    <button class="delete-btn" data-id="${product.id}"><i class="fas fa-trash"></i> Delete</button>
                </div>
            `;
            productsContainer.appendChild(productItem);
        });
        
        // Add event listeners
        attachProductEventListeners();
    } catch (error) {
        console.error('Error loading products:', error);
        productsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Products</h3>
                <p>Failed to connect to the server. Please check your connection and try again.</p>
            </div>
        `;
    }
}

// Attach event listeners to product buttons
function attachProductEventListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            editProduct(productId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            deleteProduct(productId);
        });
    });
    
    // Sold out buttons
    document.querySelectorAll('.soldout-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = parseInt(this.getAttribute('data-id'));
            toggleSoldOut(productId);
        });
    });
}

// Edit product function
async function editProduct(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch product');
        }
        
        const product = await response.json();
        
        // Populate form with product data
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price.replace('₦', '').replace(/,/g, '');
        document.getElementById('original-price').value = product.originalPrice ? product.originalPrice.replace('₦', '').replace(/,/g, '') : '';
        document.getElementById('product-discount').value = product.discount || '';
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-image').value = product.image;
        document.getElementById('product-soldout').checked = product.soldOut;
        
        // Scroll to form
        document.querySelector('.product-form').scrollIntoView({ behavior: 'smooth' });
        
        showNotification(`Editing: ${product.name}. Update the values and click "Add Product" to save changes.`, 'info');
    } catch (error) {
        console.error('Error fetching product:', error);
        showNotification('Failed to load product details.', 'error');
    }
}

// Delete product function
async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete product');
            }
            
            // Remove from UI
            document.querySelector(`.product-item[data-id="${productId}"]`).remove();
            
            showNotification('Product deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting product:', error);
            showNotification('Failed to delete product.', 'error');
        }
    }
}

// Toggle sold out status
async function toggleSoldOut(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}/toggle-soldout`, {
            method: 'PATCH'
        });
        
        if (!response.ok) {
            throw new Error('Failed to update product status');
        }
        
        const updatedProduct = await response.json();
        
        // Update UI
        const productElement = document.querySelector(`.product-item[data-id="${productId}"]`);
        const soldOutBadge = productElement.querySelector('.sold-out-badge');
        const soldOutBtn = productElement.querySelector('.soldout-btn');
        
        if (updatedProduct.soldOut) {
            if (!soldOutBadge) {
                productElement.insertAdjacentHTML('afterbegin', '<div class="sold-out-badge">SOLD OUT</div>');
            }
            soldOutBtn.innerHTML = '<i class="fas fa-undo"></i> Restock';
        } else {
            if (soldOutBadge) {
                soldOutBadge.remove();
            }
            soldOutBtn.innerHTML = '<i class="fas fa-times"></i> Mark Sold Out';
        }
        
        showNotification(`Product ${updatedProduct.soldOut ? 'marked as sold out' : 'restocked'}!`, 'success');
    } catch (error) {
        console.error('Error toggling sold out status:', error);
        showNotification('Failed to update product status.', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove any existing notification
    const existingNotification = document.querySelector('.admin-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="close-notification">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 5000);
    
    // Close button event
    notification.querySelector('.close-notification').addEventListener('click', function() {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
  