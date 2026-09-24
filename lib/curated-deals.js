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
  },
  {
    key: "deal-levis-high-rise-jeans",
    title: "Levi's Women High Rise Straight Fit Clean Jeans",
    brand: "Levi's",
    category: "western",
    audience: "women",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80",
    rating: 4.4,
    reviews: 3800,
    store: "myntra",
    storeName: "Myntra",
    price: 1949,
    mrp: 2999,
    off: 35,
    url: "https://www.myntra.com/jeans/levis/123456",
    stores: [
      { store: "myntra", storeName: "Myntra", price: 1949, isLowest: true, inStock: true, url: "https://www.myntra.com/jeans/levis/123456" },
      { store: "amazon", storeName: "Amazon", price: 2199, isLowest: false, inStock: true, url: "https://www.amazon.in/dp/B08LEVIS789" },
      { store: "flipkart", storeName: "Flipkart", price: 2249, isLowest: false, inStock: true, url: "https://www.flipkart.com/levis-jeans/p/itm123?pid=JEA1234567890LEV" },
      { store: "ajio", storeName: "AJIO", price: 2499, isLowest: false, inStock: true, url: "https://www.ajio.com/levis-jeans/p/461234571_blue" }
    ],
    savings: 550,
    highlight: "Lowest on Myntra"
  },
  {
    key: "deal-nike-court-vision",
    title: "Nike Men Court Vision Low Lifestyle Casual Sneakers",
    brand: "Nike",
    category: "shoes",
    audience: "men",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    rating: 4.6,
    reviews: 5120,
    store: "flipkart",
    storeName: "Flipkart",
    price: 3299,
    mrp: 5495,
    off: 40,
    url: "https://www.flipkart.com/nike-court-vision/p/itm123?pid=SHO1234567890NIK",
    stores: [
      { store: "flipkart", storeName: "Flipkart", price: 3299, isLowest: true, inStock: true, url: "https://www.flipkart.com/nike-court-vision/p/itm123?pid=SHO1234567890NIK" },
      { store: "amazon", storeName: "Amazon", price: 3499, isLowest: false, inStock: true, url: "https://www.amazon.in/dp/B08NIKE789" },
      { store: "myntra", storeName: "Myntra", price: 3599, isLowest: false, inStock: true, url: "https://www.myntra.com/shoes/nike/123456" },
      { store: "ajio", storeName: "AJIO", price: 3799, isLowest: false, inStock: true, url: "https://www.ajio.com/nike-sneakers/p/461234572_white" }
    ],
    savings: 500,
    highlight: "Lowest on Flipkart"
  },
  {
    key: "deal-sassafras-crop-top",
    title: "SASSAFRAS Women Black Puff Sleeve Graphic Crop Top",
    brand: "SASSAFRAS",
    category: "western",
    audience: "women",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&auto=format&fit=crop&q=80",
    rating: 4.3,
    reviews: 1230,
    store: "myntra",
    storeName: "Myntra",
    price: 689,
    mrp: 1199,
    off: 43,
    url: "https://www.myntra.com/tops/sassafras/123456",
    stores: [
      { store: "myntra", storeName: "Myntra", price: 689, isLowest: true, inStock: true, url: "https://www.myntra.com/tops/sassafras/123456" },
      { store: "flipkart", storeName: "Flipkart", price: 749, isLowest: false, inStock: true, url: "https://www.flipkart.com/sassafras-top/p/itm123?pid=TOP1234567890SAS" },
      { store: "amazon", storeName: "Amazon", price: 789, isLowest: false, inStock: true, url: "https://www.amazon.in/dp/B08SAS789" },
      { store: "ajio", storeName: "AJIO", price: 899, isLowest: false, inStock: true, url: "https://www.ajio.com/sassafras-top/p/461234573_black" }
    ],
    savings: 210,
    highlight: "Lowest on Myntra"
  },
  {
    key: "deal-hm-linen-shirt",
    title: "H&M Men Regular Fit Breathable Linen Blend Shirt",
    brand: "H&M",
    category: "men",
    audience: "men",
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80",
    rating: 4.5,
    reviews: 2140,
    store: "flipkart",
    storeName: "Flipkart",
    price: 999,
    mrp: 1999,
    off: 50,
    url: "https://www.flipkart.com/hm-linen-shirt/p/itm123?pid=SHI1234567890HM",
    stores: [
      { store: "flipkart", storeName: "Flipkart", price: 999, isLowest: true, inStock: true, url: "https://www.flipkart.com/hm-linen-shirt/p/itm123?pid=SHI1234567890HM" },
      { store: "myntra", storeName: "Myntra", price: 1049, isLowest: false, inStock: true, url: "https://www.myntra.com/shirts/hm/123456" },
      { store: "amazon", storeName: "Amazon", price: 1199, isLowest: false, inStock: true, url: "https://www.amazon.in/dp/B08HM789" },
      { store: "ajio", storeName: "AJIO", price: 1299, isLowest: false, inStock: true, url: "https://www.ajio.com/hm-shirt/p/461234574_olive" }
    ],
    savings: 300,
    highlight: "Lowest on Flipkart"
  },
  {
    key: "deal-red-tape-chunky",
    title: "Red Tape Men Chunky Lifestyle White Walking Sneakers",
    brand: "Red Tape",
    category: "shoes",
    audience: "men",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&auto=format&fit=crop&q=80",
    rating: 4.4,
    reviews: 4100,
    store: "amazon",
    storeName: "Amazon",
    price: 1149,
    mrp: 5299,
    off: 78,
    url: "https://www.amazon.in/dp/B08REDTAPE",
    stores: [
      { store: "amazon", storeName: "Amazon", price: 1149, isLowest: true, inStock: true, url: "https://www.amazon.in/dp/B08REDTAPE" },
      { store: "flipkart", storeName: "Flipkart", price: 1399, isLowest: false, inStock: true, url: "https://www.flipkart.com/redtape-sneakers/p/itm123?pid=SHO1234567890RED" },
      { store: "myntra", storeName: "Myntra", price: 1699, isLowest: false, inStock: true, url: "https://www.myntra.com/shoes/red-tape/123456" },
      { store: "ajio", storeName: "AJIO", price: 1899, isLowest: false, inStock: true, url: "https://www.ajio.com/redtape-shoes/p/461234575_white" }
    ],
    savings: 750,
    highlight: "Lowest on Amazon"
  },
  {
    key: "deal-lavie-satchel-bag",
    title: "LAVIE Structured Dual-Tone Satchel Handbag",
    brand: "LAVIE",
    category: "bags",
    audience: "women",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80",
    rating: 4.5,
    reviews: 1540,
    store: "flipkart",
    storeName: "Flipkart",
    price: 1099,
    mrp: 3499,
    off: 69,
    url: "https://www.flipkart.com/lavie-satchel/p/itm123?pid=BAG1234567890LAV2",
    stores: [
      { store: "flipkart", storeName: "Flipkart", price: 1099, isLowest: true, inStock: true, url: "https://www.flipkart.com/lavie-satchel/p/itm123?pid=BAG1234567890LAV2" },
      { store: "myntra", storeName: "Myntra", price: 1349, isLowest: false, inStock: true, url: "https://www.myntra.com/handbags/lavie/123456" },
      { store: "amazon", storeName: "Amazon", price: 1499, isLowest: false, inStock: true, url: "https://www.amazon.in/dp/B08LAVSAT" },
      { store: "ajio", storeName: "AJIO", price: 1799, isLowest: false, inStock: true, url: "https://www.ajio.com/lavie-satchel/p/461234576_tan" }
    ],
    savings: 700,
    highlight: "Lowest on Flipkart"
  },
  {
    key: "deal-american-tourister-luggage",
    title: "American Tourister Ivy 55cm Hard Luggage Cabin Trolley",
    brand: "American Tourister",
    category: "bags",
    audience: "unisex",
    image: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=600&auto=format&fit=crop&q=80",
    rating: 4.4,
    reviews: 6200,
    store: "amazon",
    storeName: "Amazon",
    price: 2199,
    mrp: 6500,
    off: 66,
    url: "https://www.amazon.in/dp/B08AMTOUR",
    stores: [
      { store: "amazon", storeName: "Amazon", price: 2199, isLowest: true, inStock: true, url: "https://www.amazon.in/dp/B08AMTOUR" },
      { store: "flipkart", storeName: "Flipkart", price: 2499, isLowest: false, inStock: true, url: "https://www.flipkart.com/american-tourister-trolley/p/itm123?pid=LUG1234567890AT" },
      { store: "myntra", storeName: "Myntra", price: 2799, isLowest: false, inStock: true, url: "https://www.myntra.com/trolley/american-tourister/123456" }
    ],
    savings: 600,
    highlight: "Lowest on Amazon"
  },
  {
    key: "deal-titan-neo-watch",
    title: "Titan Neo Analog Black Dial Men Stainless Steel Watch",
    brand: "Titan",
    category: "watches",
    audience: "men",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
    rating: 4.5,
    reviews: 4300,
    store: "flipkart",
    storeName: "Flipkart",
    price: 1995,
    mrp: 3995,
    off: 50,
    url: "https://www.flipkart.com/titan-neo-watch/p/itm123?pid=WAT1234567890TIT",
    stores: [
      { store: "flipkart", storeName: "Flipkart", price: 1995, isLowest: true, inStock: true, url: "https://www.flipkart.com/titan-neo-watch/p/itm123?pid=WAT1234567890TIT" },
      { store: "amazon", storeName: "Amazon", price: 2295, isLowest: false, inStock: true, url: "https://www.amazon.in/dp/B08TITAN789" },
      { store: "myntra", storeName: "Myntra", price: 2495, isLowest: false, inStock: true, url: "https://www.myntra.com/watches/titan/123456" }
    ],
    savings: 500,
    highlight: "Lowest on Flipkart"
  },
  {
    key: "deal-vincent-chase-aviator",
    title: "Vincent Chase Polarized Golden Metal Rim Aviator Sunglasses",
    brand: "Vincent Chase",
    category: "sunglasses",
    audience: "unisex",
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&auto=format&fit=crop&q=80",
    rating: 4.4,
    reviews: 2800,
    store: "amazon",
    storeName: "Amazon",
    price: 799,
    mrp: 1999,
    off: 60,
    url: "https://www.amazon.in/dp/B08VINCHASE",
    stores: [
      { store: "amazon", storeName: "Amazon", price: 799, isLowest: true, inStock: true, url: "https://www.amazon.in/dp/B08VINCHASE" },
      { store: "flipkart", storeName: "Flipkart", price: 949, isLowest: false, inStock: true, url: "https://www.flipkart.com/vincent-chase-sunglasses/p/itm123?pid=SUN1234567890VC" }
    ],
    savings: 150,
    highlight: "Lowest on Amazon"
  },
  {
    key: "deal-giva-silver-pendant",
    title: "GIVA 925 Sterling Silver Classic Solitaire Pendant with Chain",
    brand: "GIVA",
    category: "accessories",
    audience: "women",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80",
    rating: 4.6,
    reviews: 3400,
    store: "amazon",
    storeName: "Amazon",
    price: 1399,
    mrp: 2999,
    off: 53,
    url: "https://www.amazon.in/dp/B08GIVAPEND",
    stores: [
      { store: "amazon", storeName: "Amazon", price: 1399, isLowest: true, inStock: true, url: "https://www.amazon.in/dp/B08GIVAPEND" },
      { store: "myntra", storeName: "Myntra", price: 1599, isLowest: false, inStock: true, url: "https://www.myntra.com/jewellery/giva/123456" },
      { store: "flipkart", storeName: "Flipkart", price: 1699, isLowest: false, inStock: true, url: "https://www.flipkart.com/giva-pendant/p/itm123?pid=JEW1234567890GIV" }
    ],
    savings: 300,
    highlight: "Lowest on Amazon"
  },
  {
    key: "deal-maybelline-lipstick",
    title: "Maybelline New York Super Stay Matte Ink Liquid Lipstick",
    brand: "Maybelline",
    category: "beauty",
    audience: "women",
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80",
    rating: 4.5,
    reviews: 8900,
    store: "myntra",
    storeName: "Myntra",
    price: 449,
    mrp: 699,
    off: 36,
    url: "https://www.myntra.com/lipstick/maybelline/123456",
    stores: [
      { store: "myntra", storeName: "Myntra", price: 449, isLowest: true, inStock: true, url: "https://www.myntra.com/lipstick/maybelline/123456" },
      { store: "amazon", storeName: "Amazon", price: 489, isLowest: false, inStock: true, url: "https://www.amazon.in/dp/B08MAYBELL" },
      { store: "flipkart", storeName: "Flipkart", price: 519, isLowest: false, inStock: true, url: "https://www.flipkart.com/maybelline-matte-ink/p/itm123?pid=BEA1234567890MAY" }
    ],
    savings: 70,
    highlight: "Lowest on Myntra"
  },
  {
    key: "deal-minimalist-serum",
    title: "Minimalist 10% Vitamin C Face Serum for Radiant Glow",
    brand: "Minimalist",
    category: "beauty",
    audience: "unisex",
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
    rating: 4.4,
    reviews: 4700,
    store: "amazon",
    storeName: "Amazon",
    price: 649,
    mrp: 699,
    off: 7,
    url: "https://www.amazon.in/dp/B08MINIMAL",
    stores: [
      { store: "amazon", storeName: "Amazon", price: 649, isLowest: true, inStock: true, url: "https://www.amazon.in/dp/B08MINIMAL" },
      { store: "flipkart", storeName: "Flipkart", price: 679, isLowest: false, inStock: true, url: "https://www.flipkart.com/minimalist-serum/p/itm123?pid=BEA1234567890MIN" }
    ],
    savings: 50,
    highlight: "Lowest on Amazon"
  },
  {
    key: "deal-hrx-track-pants",
    title: "HRX by Hrithik Roshan Men Solid Rapid Dry Athletic Track Pants",
    brand: "HRX",
    category: "sportswear",
    audience: "men",
    image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&auto=format&fit=crop&q=80",
    rating: 4.3,
    reviews: 3100,
    store: "myntra",
    storeName: "Myntra",
    price: 799,
    mrp: 1999,
    off: 60,
    url: "https://www.myntra.com/trackpants/hrx/123456",
    stores: [
      { store: "myntra", storeName: "Myntra", price: 799, isLowest: true, inStock: true, url: "https://www.myntra.com/trackpants/hrx/123456" },
      { store: "flipkart", storeName: "Flipkart", price: 899, isLowest: false, inStock: true, url: "https://www.flipkart.com/hrx-trackpants/p/itm123?pid=SPO1234567890HRX" }
    ],
    savings: 200,
    highlight: "Lowest on Myntra"
  },
  {
    key: "deal-suta-mulmul-saree",
    title: "Suta Handwoven Classic Mulmul Cotton Printed Saree",
    brand: "Suta",
    category: "ethnic",
    audience: "women",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
    rating: 4.6,
    reviews: 1890,
    store: "myntra",
    storeName: "Myntra",
    price: 1850,
    mrp: 3200,
    off: 42,
    url: "https://www.myntra.com/sarees/suta/123456",
    stores: [
      { store: "myntra", storeName: "Myntra", price: 1850, isLowest: true, inStock: true, url: "https://www.myntra.com/sarees/suta/123456" },
      { store: "ajio", storeName: "AJIO", price: 2100, isLowest: false, inStock: true, url: "https://www.ajio.com/suta-saree/p/461234577_maroon" }
    ],
    savings: 250,
    highlight: "Lowest on Myntra"
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
