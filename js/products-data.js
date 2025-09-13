// products-data.js
// This file now only contains fallback products for localStorage
// Main products are fetched from MongoDB via the API

let products = JSON.parse(localStorage.getItem('storeProducts')) || [
    {
        id: 1,
        name: "High Quality Hand Bag",
        originalPrice: "₦18,000",
        price: "₦15,000",
        description: "Light and comfortable hand bag for summer days",
        image: "https://files.catbox.moe/da5lzg.png",
        category: "bags",
        mainCategory: "bags",
        discount: "17% off",
        rating: 4.7,
        ratingCount: "1.7K",
        purchases: "3K+ bought in past month",
        delivery: "FREE delivery Sep 12 - 16",
        soldOut: false
    },
    {
        id: 2,
        name: "Portable Hand Bag",
        originalPrice: "₦17,000",
        price: "₦12,000",
        description: "Compact and stylish portable hand bag",
        image: "https://files.catbox.moe/da5lzg.png",
        category: "bags",
        mainCategory: "bags",
        discount: "29% off",
        rating: 4.5,
        ratingCount: "892",
        purchases: "1.2K+ bought in past month",
        delivery: "FREE delivery Sep 13 - 17",
        soldOut: false
    }
];

// Function to update localStorage with products from MongoDB (for fallback)
async function updateLocalStorageWithMongoDBProducts() {
    try {
        const API_BASE_URL = 'https://mima-closet.onrender.com/api';
        const response = await fetch(`${API_BASE_URL}/products`);
        
        if (response.ok) {
            const products = await response.json();
            localStorage.setItem('storeProducts', JSON.stringify(products));
            console.log('Local storage updated with MongoDB products');
        }
    } catch (error) {
        console.error('Error updating local storage from MongoDB:', error);
    }
}

// Update localStorage when the page loads (as a fallback mechanism)
if (typeof window !== 'undefined') {
    window.addEventListener('load', updateLocalStorageWithMongoDBProdu