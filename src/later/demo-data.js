/* DEMO DATA — preview only (fit-deal.onrender.com).
   Every product, price, match score, vote count and alert here is made up so
   the pages can be seen working. Before fitdeal.shop goes live this file is
   removed and the pages read real search results instead (see PLAN.md,
   "Before the real launch"). */
window.FD_DEMO = {
  look: {
    id: "demo-look",
    image: "/img/demo/look.webp",
    items: ["Blazer", "Top", "Jeans"]
  },
  products: [
    { id: "p1", item: "Blazer", brand: "H&M", name: "Oversized Blazer", price: 1299, mrp: 2499, match: 96, store: "Myntra", image: "/img/demo/blazer.webp" },
    { id: "p2", item: "Top", brand: "ZARA", name: "Ribbed Knit Top", price: 1199, mrp: 1899, match: 89, store: "AJIO", image: "/img/demo/knit-top.webp" },
    { id: "p3", item: "Jeans", brand: "MANGO", name: "Wide Leg Jeans", price: 899, mrp: 1999, match: 87, store: "Myntra", image: "/img/demo/wide-jeans.webp" },
    { id: "p4", item: "Blazer", brand: "Vero Moda", name: "Relaxed Fit Blazer", price: 1649, mrp: 3299, match: 91, store: "AJIO", image: "/img/demo/blazer.webp" },
    { id: "p5", item: "Top", brand: "Tokyo Talkies", name: "Sleeveless Tank Top", price: 399, mrp: 999, match: 84, store: "Flipkart", image: "/img/samples/top-m.webp" },
    { id: "p6", item: "Jeans", brand: "Roadster", name: "Wide-Leg Denim", price: 749, mrp: 1799, match: 85, store: "Myntra", image: "/img/samples/jeans-m.webp" },
    { id: "p7", item: "Top", brand: "ONLY", name: "Ribbed Crew Tee", price: 549, mrp: 1299, match: 82, store: "Amazon", image: "/img/demo/knit-top.webp" },
    { id: "p8", item: "Jeans", brand: "Levi's", name: "94 Baggy Jeans", price: 2199, mrp: 3999, match: 90, store: "Amazon", image: "/img/demo/wide-jeans.webp" }
  ],
  outfits: [
    { id: "o1", name: "Beige Blazer Look", price: 2198, image: "/img/demo/tryon-result.webp" },
    { id: "o2", name: "Pink Floral Dress", price: 1299, image: "/img/samples/dress-m.webp" },
    { id: "o3", name: "Olive Shirt", price: 899, image: "/img/samples/shirt-m.webp" },
    { id: "o4", name: "Beige Kurti", price: 799, image: "/img/samples/kurti-m.webp" },
    { id: "o5", name: "Black Tank Top", price: 399, image: "/img/samples/top-m.webp" }
  ],
  vote: {
    id: "demo",
    askedBy: "Riya",
    question: "Which look should I buy?",
    hoursLeft: 6,
    options: [
      { key: "A", name: "Blazer + Wide Jeans", price: 2198, votes: 124, image: "/img/demo/vote-a.webp" },
      { key: "B", name: "Black Tank + Jeans", price: 1148, votes: 86, image: "/img/demo/vote-b.webp" },
      { key: "C", name: "Pink Sweater + Trousers", price: 1749, votes: 211, image: "/img/demo/vote-c.webp" }
    ]
  },
  alerts: [
    { id: "a1", brand: "ZARA", name: "Ribbed Knit Top", store: "AJIO", now: 1199, was: 1459, target: 999, image: "/img/demo/knit-top.webp" },
    { id: "a2", brand: "H&M", name: "Oversized Blazer", store: "Myntra", now: 1299, was: 1299, target: 1099, image: "/img/demo/blazer.webp" },
    { id: "a3", brand: "Roadster", name: "Wide-Leg Denim", store: "Myntra", now: 749, was: 899, target: 799, image: "/img/samples/jeans-m.webp" }
  ],
  savedLooks: [
    { id: "l1", name: "Street Blazer Look", items: 3, from: 2347, image: "/img/demo/look.webp" },
    { id: "l2", name: "Summer Floral", items: 1, from: 1299, image: "/img/samples/dress-m.webp" }
  ]
};
