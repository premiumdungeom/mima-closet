// Pagination functionality with MongoDB integration

// Global variables for pagination
let currentPage = 1;
let productsPerPage = 8;
let allProducts = [];
let filteredProducts = [];
let totalProducts = 0;
let totalPages = 0;

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
        
        allProducts = await response.json();
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
            
            const products = await response.json();
            
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

// Make functions available globally
window.refreshProducts = refreshProducts;
window.filterProductsByCategory = filterProductsByCategory;