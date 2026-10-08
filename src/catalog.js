// Editorial discovery is separate from retailer inventory: no fabricated offers.
const rows = [
 ['floral-maxi-dress','Floral Print Maxi Dress','hero-dress','women dresses western','SASSAFRAS Floral Print Maxi Dress'],
 ['linen-blend-shirt','Linen Blend Casual Shirt','deal-linen-shirt','men shirts','HIGHLANDER Men Linen Blend Casual Shirt'],
 ['white-sneakers','White Casual Sneakers','deal-sneakers','men women footwear sportswear','PUMA Unisex White Sneakers'],
 ['structured-handbag','Structured Satchel Handbag','compare-bag','women bags accessories','LAVIE Structured Satchel Handbag'],
 ['puff-sleeve-top','Puff Sleeve Crop Top','deal-crop-top','women tops western','SASSAFRAS Women Puff Sleeve Crop Top'],
 ['regular-linen-shirt','Regular Fit Linen Shirt','deal-linen-shirt','men shirts','H&M Men Regular Fit Linen Shirt'],
 ['straight-jeans','High Rise Straight Jeans','deal-jeans','women jeans western','Levi\'s Women High Rise Straight Jeans'],
 ['court-sneakers','Court Style Low Sneakers','deal-sneakers','men footwear sportswear','Nike Men Court Vision Low Sneakers'],
 ['tailored-blazer','Women’s Tailored Blazer','compare-blazer','women western office','MANGO Women Tailored Blazer'],
 ['chronograph-watch','Classic Chronograph Watch','compare-watch','men watches accessories','Fossil Men Chronograph Watch'],
 ['everyday-handbag','Everyday Handbag','compare-bag','women bags accessories','Lavie Women Handbag'],
 ['black-midi-dress','Black Midi Dress','style-alt1','women dresses western','black midi dress'],
 ['olive-dress','Olive Green Dress','style-alt2','women dresses western','olive green dress'],
 ['floral-day-dress','Yellow Floral Dress','style-alt3','women dresses western','yellow floral dress'],
 ['cotton-dress','Green Cotton Dress','style-alt4','women dresses western','green cotton dress'],
 ['festive-kurta','Festive Kurta Set','cat-ethnic','women ethnic festive','women embroidered kurta set'],
 ['classic-sunglasses','Classic Sunglasses','cat-sunglasses','men women accessories sunglasses','black sunglasses'],
 ['casual-outfit','Men’s Casual Outfit','trend-men','men casual','mens casual outfits'],
 ['beauty-essentials','Beauty Essentials','cat-beauty','beauty accessories','beauty essentials']
];
const products = rows.map(([id,title,image,tags,query]) => ({id,title,image:'/img/products/'+image+'.jpg',tags:tags.split(' '),query}));
const categories = ['women','men','dresses','tops','shirts','jeans','ethnic','western','footwear','accessories','bags','watches','sunglasses','sportswear','beauty'];
module.exports = {products,categories};
