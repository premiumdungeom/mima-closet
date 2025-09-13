// MongoDB API Base URL
const API_BASE_URL = 'https://mima-closet.onrender.com/api';

// Global variables for pagination
let currentPage = 1;
let productsPerPage = 8;
let allProducts = [];
let filteredProducts = [];
let totalProducts = 0;
let totalPages = 0;

// Load products from MongoDB
async function loadAllProducts() {
    try {
        console.log('Loading products from MongoDB...');
        const response = await fetch(`${API_BASE_URL}/products`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const products = data.products || data; // Handle both formats
        
        console.log('MongoDB products loaded:', products.length);
        return products;
        
    } catch (error) {
        console.error('Error loading from MongoDB:', error);
        
        // Fallback to localStorage if MongoDB fails
        const localProducts = JSON.parse(localStorage.getItem('storeProducts') || '[]');
        console.log('Using fallback products:', localProducts.length);
        return localProducts;
    }
}

function createProductCard(product) {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    
    // Generate star rating HTML
    const rating = product.rating || 4.5;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    if (halfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    // Add discount badge if product has a discount
    const discountBadge = product.discount ? 
        `<span class="discount-badge">${product.discount}</span>` : '';
    
    // Add sold out badge if product is sold out
    const soldOutBadge = product.soldOut ? 
        `<span class="sold-out-badge">SOLD OUT</span>` : '';
        
    // Create pricing HTML
    const priceHTML = product.originalPrice ? 
        `<div class="price-container">
            <span class="original-price">${product.originalPrice}</span>
            <span class="current-price">${product.price}</span>
            ${product.discount ? `<span class="savings-badge">Save ${product.discount}</span>` : ''}
        </div>` : 
        `<div class="price-container">
            <span class="current-price">${product.price}</span>
        </div>`;
    
    productCard.innerHTML = `
        <div class="product-image">
            <img src="${product.image || 'https://files.catbox.moe/da5lzg.png'}" alt="${product.name}" 
                 onerror="this.src='https://files.catbox.moe/da5lzg.png'">
            ${discountBadge}
            ${soldOutBadge}
        </div>
        <div class="product-info">
            <h3 class="product-title">${product.name}</h3>
            <div class="rating">
                <div class="stars">${starsHTML}</div>
                <span class="rating-count">${product.ratingCount || '1K'}</span>
            </div>
            ${priceHTML}
            <div class="purchase-info">${product.purchases || 'New product'}</div>
            <p class="product-description">${product.description}</p>
            <div class="delivery-info">${product.delivery || 'FREE delivery within 3-5 days'}</div>
            <a href="https://Wa.me/2348063881526?text=I'M FROM YOUR WEBSITE. I want to order: ${encodeURIComponent(product.name)} (Product ID: ${product.id})" 
               class="btn order-btn" target="_blank" ${product.soldOut ? 'style="opacity:0.7; cursor:not-allowed;" onclick="return false;"' : ''}>
               ${product.soldOut ? 'Out of Stock' : 'Order Now'}
            </a>
        </div>
    `;
    
    return productCard;
}

function loadProducts(productsArray) {
    const container = document.getElementById('all-products');
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // Check if there are products to show
    if (!productsArray || productsArray.length === 0) {
        container.innerHTML = '<p class="no-products">No products found in this category.</p>';
        return;
    }
    
    // Add products to container
    productsArray.forEach(product => {
        const productCard = createProductCard(product);
        container.appendChild(productCard);
    });
}

// Show notification function
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Initialize pagination
async function initPagination(products = null) {
    if (products) {
        // Use provided products array
        filteredProducts = products;
        totalProducts = products.length;
    } else {
        // Fetch products from MongoDB
        await fetchProductsForPagination();
    }
    
    totalPages = Math.ceil(totalProducts / productsPerPage);
    setupPagination();
    await showPage(1);
}

// Fetch products from MongoDB for pagination
async function fetchProductsForPagination() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        const data = await response.json();
        allProducts = data.products || data; // Handle both formats
        filteredProducts = allProducts;
        totalProducts = allProducts.length;
    } catch (error) {
        console.error('Error fetching products for pagination:', error);
        showNotification('Failed to load products. Please try again.', 'error');
        
        // Fallback to empty array
        allProducts = [];
        filteredProducts = [];
        totalProducts = 0;
    }
}

// Set up pagination buttons
function setupPagination() {
    const pageNumbersContainer = document.getElementById('page-numbers');
    if (!pageNumbersContainer) return;
    
    // Clear existing page numbers
    pageNumbersContainer.innerHTML = '';
    
    // Always show first page button if there are pages
    if (totalPages > 0) {
        addPageNumber(1, pageNumbersContainer);
    }
    
    // Show ellipsis and pages around current page
    if (totalPages > 7) {
        // Show first page, current page range, and last page
        if (currentPage > 3) {
            addEllipsis(pageNumbersContainer);
        }
        
        // Calculate start and end pages to show
        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);
        
        // Adjust if we're near the beginning
        if (currentPage <= 3) {
            endPage = 4;
        }
        
        // Adjust if we're near the end
        if (currentPage >= totalPages - 2) {
            startPage = totalPages - 3;
        }
        
        // Add page numbers in range
        for (let i = startPage; i <= endPage; i++) {
            if (i > 1 && i < totalPages) {
                addPageNumber(i, pageNumbersContainer);
            }
        }
        
        // Add ellipsis before last page if needed
        if (currentPage < totalPages - 2) {
            addEllipsis(pageNumbersContainer);
        }
        
        // Add last page
        if (totalPages > 1) {
            addPageNumber(totalPages, pageNumbersContainer);
        }
    } else {
        // Show all pages if there are 7 or fewer
        for (let i = 2; i <= totalPages; i++) {
            addPageNumber(i, pageNumbersContainer);
        }
    }
    
    // Set up previous and next buttons
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                showPage(currentPage - 1);
            }
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                showPage(currentPage + 1);
            }
        });
    }
    
    // Update button states
    updateButtonStates();
}

// Add a page number button
function addPageNumber(pageNumber, container) {
    const pageElement = document.createElement('button');
    pageElement.className = `page-number ${pageNumber === currentPage ? 'active' : ''}`;
    pageElement.textContent = pageNumber;
    pageElement.addEventListener('click', () => showPage(pageNumber));
    container.appendChild(pageElement);
}

// Add ellipsis
function addEllipsis(container) {
    const ellipsis = document.createElement('span');
    ellipsis.textContent = '...';
    ellipsis.className = 'ellipsis';
    ellipsis.style.padding = '10px 5px';
    container.appendChild(ellipsis);
}

// Show products for a specific page
async function showPage(page) {
    currentPage = page;
    
    // Calculate start and end index
    const startIndex = (page - 1) * productsPerPage;
    const endIndex = Math.min(startIndex + productsPerPage, totalProducts);
    
    try {
        // Show loading state
        const container = document.getElementById('all-products');
        if (container) {
            container.innerHTML = '<div class="loading">Loading products...</div>';
        }
        
        // Get products for current page
        let currentProducts = [];
        
        if (filteredProducts.length > 0) {
            // Use already loaded products
            currentProducts = filteredProducts.slice(startIndex, endIndex);
        } else {
            // Fetch specific page from server (if you implement server-side pagination)
            // For now, we'll use client-side pagination with all products
            currentProducts = allProducts.slice(startIndex, endIndex);
        }
        
        // Display products
        loadProducts(currentProducts);
        
        // Update pagination UI
        setupPagination();
        
        // Scroll to top of products section
        const productsSection = document.querySelector('.all-products');
        if (productsSection) {
            productsSection.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error loading page:', error);
        showNotification('Failed to load products. Please try again.', 'error');
    }
}

// Update previous/next button states
function updateButtonStates() {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    
    if (prevButton) {
        prevButton.disabled = currentPage === 1;
        prevButton.classList.toggle('disabled', currentPage === 1);
    }
    
    if (nextButton) {
        nextButton.disabled = currentPage === totalPages;
        nextButton.classList.toggle('disabled', currentPage === totalPages);
    }
}

// Filter products by category
async function filterProductsByCategory(category) {
    try {
        // Show loading state
        const container = document.getElementById('all-products');
        if (container) {
            container.innerHTML = '<div class="loading">Filtering products...</div>';
        }
        
        if (category === 'all') {
            // Reset to all products
            filteredProducts = allProducts;
        } else {
            // Filter by category
            filteredProducts = allProducts.filter(product => 
                product.mainCategory && product.mainCategory.toLowerCase() === category.toLowerCase()
            );
        }
        
        totalProducts = filteredProducts.length;
        totalPages = Math.ceil(totalProducts / productsPerPage);
        
        // Reset to first page and update pagination
        currentPage = 1;
        setupPagination();
        await showPage(1);
        
    } catch (error) {
        console.error('Error filtering products:', error);
        showNotification('Failed to filter products. Please try again.', 'error');
    }
}

// Refresh products function
async function refreshProducts() {
    const allProductsContainer = document.getElementById('all-products');
    const featuredContainer = document.getElementById('featured-products');
    
    if (allProductsContainer || featuredContainer) {
        if (allProductsContainer) allProductsContainer.innerHTML = '<div class="loading">Refreshing products...</div>';
        if (featuredContainer) featuredContainer.innerHTML = '<div class="loading">Refreshing products...</div>';
        
        try {
            // Fetch latest products from MongoDB
            const response = await fetch(`${API_BASE_URL}/products`);
            if (!response.ok) {
                throw new Error('Failed to refresh products');
            }
            
            const data = await response.json();
            const products = data.products || data; // Handle both formats
            
            // Update global products arrays
            allProducts = products;
            filteredProducts = products;
            totalProducts = products.length;
            totalPages = Math.ceil(totalProducts / productsPerPage);
            
            if (featuredContainer) {
                featuredContainer.innerHTML = '';
                const featuredProducts = products.slice(0, 4);
                featuredProducts.forEach(product => {
                    const productCard = createProductCard(product);
                    featuredContainer.appendChild(productCard);
                });
            }
            
            if (allProductsContainer) {
                // Reset to first page
                currentPage = 1;
                initPagination(products);
            }
            
            showNotification('Products refreshed successfully!', 'success');
        } catch (error) {
            console.error('Error refreshing products:', error);
            showNotification('Failed to refresh products. Please try again.', 'error');
            
            // Restore previous content
            if (allProductsContainer && allProducts.length > 0) {
                initPagination(allProducts);
            }
        }
    }
}

// Add refresh button to products page if needed
function addRefreshButton() {
    const productsHeader = document.querySelector('.products-header');
    if (productsHeader && !document.getElementById('refresh-products-btn')) {
        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'refresh-products-btn';
        refreshBtn.className = 'btn refresh-btn';
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        refreshBtn.onclick = refreshProducts;
        productsHeader.appendChild(refreshBtn);
    }
}

// Initialize refresh button
document.addEventListener('DOMContentLoaded', addRefreshButton);

// Main initialization
document.addEventListener('DOMContentLoaded', async function() {
    // Show loading message
    const featuredContainer = document.getElementById('featured-products');
    const allProductsContainer = document.getElementById('all-products');
    
    if (featuredContainer) featuredContainer.innerHTML = '<div class="loading">Loading products...</div>';
    if (allProductsContainer) allProductsContainer.innerHTML = '<div class="loading">Loading products...</div>';
    
    try {
        // Load products from MongoDB
        const products = await loadAllProducts();
        console.log('Final products array:', products);
        
        // Store products globally for pagination
        allProducts = products;
        filteredProducts = products;
        totalProducts = products.length;
        
        // Load featured products
        if (featuredContainer) {
            featuredContainer.innerHTML = '';
            const featuredProducts = products.slice(0, 4);
            
            if (featuredProducts.length === 0) {
                featuredContainer.innerHTML = '<p class="no-products">No featured products available.</p>';
            } else {
                featuredProducts.forEach(product => {
                    const productCard = createProductCard(product);
                    featuredContainer.appendChild(productCard);
                });
            }
        }
        
        // Load all products on products page with pagination
        if (allProductsContainer) {
            // Initialize pagination
            initPagination(filteredProducts);
            
            // Filter products by category
            const filterButtons = document.querySelectorAll('.filter-btn');
            filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Remove active class from all buttons
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    
                    // Add active class to clicked button
                    this.classList.add('active');
                    
                    const category = this.getAttribute('data-filter');
                    
                    if (category === 'all') {
                        filteredProducts = allProducts;
                    } else {
                        // Filter by main category
                        filteredProducts = allProducts.filter(product => 
                            product.mainCategory && product.mainCategory.toLowerCase() === category.toLowerCase()
                        );
                    }
                    
                    // Reset to first page and initialize pagination
                    currentPage = 1;
                    initPagination(filteredProducts);
                });
            });
        }
        
    } catch (error) {
        console.error('Error loading products:', error);
        
        // Show error message
        if (featuredContainer) {
            featuredContainer.innerHTML = '<p class="error-message">Error loading products. Please refresh the page.</p>';
        }
        if (allProductsContainer) {
            allProductsContainer.innerHTML = '<p class="error-message">Error loading products. Please refresh the page.</p>';
        }
    }
});

// Make functions available globally
window.refreshProducts = refreshProducts;
window.filterProductsByCategory = filterProductsByC