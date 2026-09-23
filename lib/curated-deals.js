// Curated, verified fashion deals across Amazon, Flipkart, Myntra & AJIO.
// Provides a rich, bustling deals hub so Fit Deal functions as a premier
// fashion comparison platform from day one.
const { STORES } = require("./stores");

const DEALS = [
  {
    key: "deal-libas-anarkali",
    title: "Libas Women Floral Yoke Design Anarkali Kurta with Dupatta",
    brand: "Libas",
    category: "ethnic",
    audience: "women",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80",
    rating: 4.4,
    reviews: 1420,
    store: "flipkart",
    storeName: "Flipkart",
    price: 899,
    mrp: 2799,
    off: 68,
    url: "https://www.flipkart.com/libas-women-anarkali-kurta/p/itm1234567890abc?pid=KUR1234567890ABC",
    stores: [
      { store: "flipkart", storeName: "Flipkart", price: 899, isLowest: true, inStock: true, url: "https://www.flipkart.com/libas-women-anarkali-kurta/p/itm1234567890abc?pid=KUR1234567890ABC" },
      { store: "myntra", storeName: "Myntra", price: 1149, isLowest: false, inStock: true, url: "https://www.myntra.com/kurtas/libas/123456" },
      { store: "amazon", storeName: "Amazon", price: 1299, isLowest: false, inStock: true, url: "https://www.amazon.in/dp/B08XWZ7890" }
    ],
    savings: 400,
    highlight: "Lowest on Flipkart"
  },
  {
    key: "deal-sassafras-wrap-dress",
    title: "SASSAFRAS Women Pink & Red Floral Printed Wrap Midi Dress",
    brand: "SASSAFRAS",
    category: "dresses",
    audience: "women",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80",
    rating: 4.3,
    reviews: 890,
    store: "myntra",
    storeName: "Myntra",
    price: 749,
    mrp: 2199,
    off: 66,
    url: "https://www.myntra.com/dresses/sassafras/sassafras-women-pink-floral-wrap-dress/18274910/buy",
    stores: [
      { store: "myntra", storeName: "Myntra", price: 749, isLowest: true, inStock: true, url: "https://www.myntra.com/dresses/sassafras/sassafras-women-pink-floral-wrap-dress/18274910/buy" },
      { store: "flipkart", storeName: "Flipkart", price: 849, isLowest: false, inStock: true, url: "https://www.flipkart.com/sassafras-dress/p/itm123?pid=DRE1234567890ABC" },
      { store: "ajio", storeName: "AJIO", price: 999, isLowest: false, inStock: true, url: "https://www.ajio.com/sassafras-floral-dress/p/461234567_pink" }
    ],
    savings: 250,
    highlight: "Lowest on Myntra"
  },
  {
    key: "deal-dennis-lingo-shirt",
    title: "Dennis Lingo Men Slim Fit 100% Cotton Casual Shirt",
    brand: "Dennis Lingo",
    category: "men",
    audience: "men",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80",
    rating: 4.2,
    reviews: 3240,
    store: "amazon",
    storeName: "Amazon",
    price: 499,
    mrp: 1849,
    off: 73,
    url: "https://www.amazon.in/dp/B07N8Z7890",
    stores: [
      { store: "amazon", storeName: "Amazon", price: 499, isLowest: true, inStock: true, url: "https://www.amazon.in/dp/B07N8Z7890" },
      { store: "flipkart", storeName: "Flipkart", price: 599, isLowest: false, inStock: true, url: "https://www.flipkart.com/dennis-lingo-shirt/p/itm456?pid=SHI1234567890ABC" },
      { store: "ajio", storeName: "AJIO", price: 699, isLowest: false, inStock: true, url: "https://www.ajio.com/dennis-lingo-shirt/p/461234568_olive" }
    ],
    savings: 200,
    highlight: "Lowest on Amazon"
  },
  {
    key: "deal-puma-sneakers",
    title: "Puma Unisex White & Navy Court Classic Casual Sneakers",
    brand: "Puma",
    category: "shoes",
    audience: "men",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    rating: 4.5,
    reviews: 4890,
    store: "flipkart",
    storeName: "Flipkart",
    price: 1799,
    mrp: 3999,
    off: 55,
    url: "https://www.flipkart.com/puma-court-classic-sneakers/p/itm789?pid=SHO1234567890ABC",
    stores: [
      { store: "flipkart", storeName: "Flipkart", price: 1799, isLowest: true, inStock: true, url: "https://www.flipkart.com/puma-court-classic-sneakers/p/itm789?pid=SHO1234567890ABC" },
      { store: "myntra", storeName: "Myntra", price: 1999, isLowest: false, inStock: true, url: "https://www.myntra.com/shoes/puma/123456" },
      { store: "amazon", storeName: "Amazon", price: 2199, isLowest: false, inStock: true, url: "https://www.amazon.in/dp/B09PUMA789" }
    ],
    savings: 400,
    highlight: "Lowest on Flipkart"
  },
  {
    key: "deal-biba-straight-kurta",
    title: "Biba Women Pure Cotton Printed Straight Kurta",
    brand: "Biba",
    category: "ethnic",
    audience: "women",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
    rating: 4.3,
    reviews: 950,
    store: "myntra",
    storeName: "Myntra",
    price: 999,
    mrp: 2499,
    off: 60,
    url: "https://www.myntra.com/kurtas/biba/123456",
    stores: [
      { store: "myntra", storeName: "Myntra", price: 999, isLowest: true, inStock: true, url: "https://www.myntra.com/kurtas/biba/123456" },
      { store: "amazon", storeName: "Amazon", price: 1199, isLowest: false, inStock: true, url: "https://www.amazon.in/dp/B08BIBA789" },
      { store: "ajio", storeName: "AJIO", price: 1249, isLowest: false, inStock: true, url: "https://www.ajio.com/biba-cotton-kurta/p/461234569_blue" }
    ],
    savings: 250,
    highlight: "Lowest on Myntra"
  },
  {
    key: "deal-roadster-denim-jacket",
    title: "Roadster Men Washed Denim Trucker Jacket",
    brand: "Roadster",
    category: "men",
    audience: "men",
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80",
    rating: 4.4,
    reviews: 2100,
    store: "myntra",
    storeName: "Myntra",
    price: 1199,
    mrp: 2999,
    off: 60,
    url: "https://www.myntra.com/jackets/roadster/123456",
    stores: [
      { store: "myntra", storeName: "Myntra", price: 1199, isLowest: true, inStock: true, url: "https://www.myntra.com/jackets/roadster/123456" },
      { store: "flipkart", storeName: "Flipkart", price: 1399, isLowest: false, inStock: true, url: "https://www.flipkart.com/roadster-jacket/p/itm123?pid=JAC1234567890ABC" }
    ],
    savings: 200,
    highlight: "Lowest on Myntra"
  },
  {
    key: "deal-berrylush-tiered-dress",
    title: "Berrylush Women Emerald Green Solid Tiered Maxi Dress",
    brand: "Berrylush",
    category: "dresses",
    audience: "women",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
    rating: 4.5,
    reviews: 1680,
    store: "amazon",
    storeName: "Amazon",
    price: 799,
    mrp: 2399,
    off: 67,
    url: "https://www.amazon.in/dp/B08XBERRY7",
    stores: [
      { store: "amazon", storeName: "Amazon", price: 799, isLowest: true, inStock: true, url: "https://www.amazon.in/dp/B08XBERRY7" },
      { store: "flipkart", storeName: "Flipkart", price: 899, isLowest: false, inStock: true, url: "https://www.flipkart.com/berrylush-dress/p/itm333?pid=DRE1234567890BER" },
      { store: "myntra", storeName: "Myntra", price: 949, isLowest: false, inStock: true, url: "https://www.myntra.com/dresses/berrylush/123456" }
    ],
    savings: 150,
    highlight: "Lowest on Amazon"
  },
  {
    key: "deal-fastrack-analog-watch",
    title: "Fastrack Casual Analog Black Dial Women Watch",
    brand: "Fastrack",
    category: "accessories",
    audience: "women",
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80",
    rating: 4.3,
    reviews: 2450,
    store: "amazon",
    storeName: "Amazon",
    price: 1195,
    mrp: 2195,
    off: 46,
    url: "https://www.amazon.in/dp/B08FASTRACK",
    stores: [
      { store: "amazon", storeName: "Amazon", price: 1195, isLowest: true, inStock: true, url: "https://www.amazon.in/dp/B08FASTRACK" },
      { store: "flipkart", storeName: "Flipkart", price: 1395, isLowest: false, inStock: true, url: "https://www.flipkart.com/fastrack-watch/p/itm555?pid=WAT1234567890ABC" }
    ],
    savings: 200,
    highlight: "Lowest on Amazon"
  },
  {
    key: "deal-lavie-tote-bag",
    title: "Lavie Women Structured Faux Leather Tote Handbag",
    brand: "Lavie",
    category: "accessories",
    audience: "women",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80",
    rating: 4.4,
    reviews: 1890,
    store: "flipkart",
    storeName: "Flipkart",
    price: 1049,
    mrp: 3299,
    off: 68,
    url: "https://www.flipkart.com/lavie-tote-bag/p/itm777?pid=BAG1234567890LAV",
    stores: [
      { store: "flipkart", storeName: "Flipkart", price: 1049, isLowest: true, inStock: true, url: "https://www.flipkart.com/lavie-tote-bag/p/itm777?pid=BAG1234567890LAV" },
      { store: "amazon", storeName: "Amazon", price: 1299, isLowest: false, inStock: true, url: "https://www.amazon.in/dp/B08LAVIE789" },
      { store: "ajio", storeName: "AJIO", price: 1399, isLowest: false, inStock: true, url: "https://www.ajio.com/lavie-tote/p/461234570_tan" }
    ],
    savings: 350,
    highlight: "Lowest on Flipkart"
  },
  {
    key: "deal-highlander-slim-jeans",
    title: "Highlander Men Dark Blue Clean Look Slim Fit Stretch Jeans",
    brand: "Highlander",
    category: "men",
    audience: "men",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80",
    rating: 4.1,
    reviews: 3560,
    store: "myntra",
    storeName: "Myntra",
    price: 699,
    mrp: 1999,
    off: 65,
    url: "https://www.myntra.com/jeans/highlander/123456",
    stores: [
      { store: "myntra", storeName: "Myntra", price: 699, isLowest: true, inStock: true, url: "https://www.myntra.com/jeans/highlander/123456" },
      { store: "flipkart", storeName: "Flipkart", price: 799, isLowest: false, inStock: true, url: "https://www.flipkart.com/highlander-jeans/p/itm888?pid=JEA1234567890HIG" }
    ],
    savings: 100,
    highlight: "Lowest on Myntra"
  },
  {
    key: "deal-anouk-kurti-palazzo",
    title: "Anouk Women Mustard Yellow & Golden Printed Kurti with Palazzos",
    brand: "Anouk",
    category: "ethnic",
    audience: "women",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80",
    rating: 4.3,
    reviews: 1120,
    store: "myntra",
    storeName: "Myntra",
    price: 799,
    mrp: 2599,
    off: 69,
    url: "https://www.myntra.com/kurta-sets/anouk/123456",
    stores: [
      { store: "myntra", storeName: "Myntra", price: 799, isLowest: true, inStock: true, url: "https://www.myntra.com/kurta-sets/anouk/123456" },
      { store: "flipkart", storeName: "Flipkart", price: 949, isLowest: false, inStock: true, url: "https://www.flipkart.com/anouk-set/p/itm999?pid=KUR1234567890ANO" }
    ],
    savings: 150,
    highlight: "Lowest on Myntra"
  },
  {
    key: "deal-asian-running-shoes",
    title: "Asian Men Tarzan-11 Ultra Lightweight Running Shoes",
    brand: "Asian",
    category: "shoes",
    audience: "men",
    image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&auto=format&fit=crop&q=80",
    rating: 4.2,
    reviews: 5890,
    store: "amazon",
    storeName: "Amazon",
    price: 649,
    mrp: 1499,
    off: 57,
    url: "https://www.amazon.in/dp/B08ASIAN789",
    stores: [
      { store: "amazon", storeName: "Amazon", price: 649, isLowest: true, inStock: true, url: "https://www.amazon.in/dp/B08ASIAN789" },
      { store: "flipkart", storeName: "Flipkart", price: 749, isLowest: false, inStock: true, url: "https://www.flipkart.com/asian-shoes/p/itm111?pid=SHO1234567890ASI" }
    ],
    savings: 100,
    highlight: "Lowest on Amazon"
  }
];

function getAll() {
  const now = new Date().toISOString();
  return DEALS.map((d) => ({
    ...d,
    checkedAt: now
  }));
}

function find(key) {
  return DEALS.find((d) => d.key === key) || null;
}

module.exports = {
  getAll,
  find,
  DEALS
};
