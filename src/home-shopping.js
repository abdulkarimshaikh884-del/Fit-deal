// Editable homepage merchandising. Editorial searches are not live inventory.
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const arrow = '<svg aria-hidden="true"><use href="#i-arrow"/></svg>';
const asset = n => `<span class="fd-asset fd-a${n}" aria-hidden="true"></span>`;
const search = (query, max) => '/find/?q=' + encodeURIComponent(query) + (max ? '&amp;max=' + max : '');
const item = (title, note, image, query) => ({ title, note, image, query });

const edits = [
  { id: 'women-edit', title: 'The women’s edit', subtitle: 'Everyday favourites. A little main-character energy.', query: 'women clothing', tag: 'YOUR EVERYDAY, ELEVATED', items: [
    item('Pretty in pink', 'Ruched tops', 12, 'women pink ruched top'),
    item('Easy layers', 'Relaxed shirts', 3, 'women purple relaxed shirt'),
    item('A floral moment', 'Day-out dresses', 4, 'women floral midi dress'),
    item('Denim days', 'Wide-leg jeans', 6, 'women blue wide leg jeans'),
    item('Everyday ethnic', 'Printed kurtas', 2, 'women pink printed kurta'),
    item('The finishing touch', 'Shoulder bags', 9, 'women black shoulder bag')
  ] },
  { id: 'men-edit', title: 'The men’s edit', subtitle: 'Build a wardrobe that works, all week long.', query: 'men clothing', tag: 'GOOD STYLE, ZERO OVERTHINKING', items: [
    item('Keep it relaxed', 'Casual shirts', 5, 'men sage green casual shirt'),
    item('Back to basics', 'Everyday T-shirts', 7, 'men black cotton t shirt'),
    item('Off-duty uniform', 'Oversized shirts', 13, 'men black oversized shirt'),
    item('Layer up', 'Hoodies', 1, 'men grey hoodie'),
    item('Weekend ready', 'Sweatshirts', 15, 'men navy blue sweatshirt'),
    item('Go-to sneakers', 'Clean white kicks', 8, 'men white sneakers')
  ] }
];

function productTile(p) {
  return `<a class="shop-tile" href="${search(p.query)}"><span class="shop-tile-image">${asset(p.image)}</span><span class="shop-tile-copy"><small>${esc(p.note)}</small><b>${esc(p.title)}</b><span>Explore styles ${arrow}</span></span></a>`;
}
function heading(id, title, subtitle, href, label = 'Explore all') {
  return `<div class="shop-heading"><div><h2 id="${id}">${esc(title)}</h2><p>${esc(subtitle)}</p></div><a href="${href}">${label} ${arrow}</a></div>`;
}
function shelf(edit) {
  return `<section class="shop-section" id="${edit.id}" aria-labelledby="${edit.id}-title"><p class="shop-kicker">${edit.tag}</p>${heading(edit.id + '-title', edit.title, edit.subtitle, search(edit.query))}<div class="shop-rail">${edit.items.map(productTile).join('\n')}</div></section>`;
}

function navigation() {
  return `<nav class="shop-jump" aria-label="Shopping departments"><div>${[['categories','All categories'],['home-deals','Deals & discoveries'],['women-edit','Women'],['men-edit','Men'],['ethnic-edit','Ethnic wear'],['budget-edit','Shop by budget'],['extras-edit','Shoes & accessories'],['store-edit','Explore stores']].map(([id,label]) => `<a href="#${id}">${label}</a>`).join('')}</div></nav>`;
}

function campaigns() {
  return `<section class="shop-campaigns" aria-label="Featured fashion collections">
    <a class="shop-campaign campaign-lilac" href="${search('women lilac oversized shirt')}"><span class="campaign-copy"><small>THE EVERYDAY EDIT</small><b>A fresh take<br>on your usual.</b><span>Find your next favourite ${arrow}</span></span><span class="campaign-photo campaign-photo-2" aria-hidden="true"></span></a>
    <a class="shop-campaign campaign-sage" href="${search('men relaxed linen shirt')}"><span class="campaign-copy"><small>LESS EFFORT. MORE STYLE.</small><b>Relaxed fits.<br>Refined taste.</b><span>Explore men’s styles ${arrow}</span></span><span class="campaign-photo campaign-photo-1" aria-hidden="true"></span></a>
    <a class="shop-campaign campaign-rose" href="${search('women embroidered kurta set')}"><span class="campaign-copy"><small>A LITTLE CELEBRATION</small><b>Make every<br>day an occasion.</b><span>Discover ethnic wear ${arrow}</span></span><span class="campaign-photo campaign-photo-0" aria-hidden="true"></span></a>
  </section>`;
}

function expansion() {
  const budgets = [
    ['Tops & tees',499,12,'women tops under 499 rupees'], ['Everyday shirts',799,5,'casual shirts under 799 rupees'],
    ['Ethnic favourites',999,2,'women kurtas under 999 rupees'], ['Denim refresh',1499,6,'blue jeans under 1499 rupees'],
    ['Sneaker search',1999,8,'white sneakers under 1999 rupees'], ['Finishing touches',999,9,'shoulder bags under 999 rupees']
  ];
  const occasions = [
    ['College days','Easy layers, all-day comfort','navy sweatshirt blue jeans',0],
    ['Office hours','A sharper everyday wardrobe','women beige tailored blazer',1],
    ['Dinner plans','Dress for your kind of evening','women burgundy evening dress',2],
    ['Weekend mode','Relaxed fits, ready to go','men black oversized shirt',3]
  ];
  const stores = [
    ['amazon','Amazon','Everyday basics & accessories','https://www.amazon.in/s?k=fashion+clothing'],
    ['flipkart','Flipkart','Casual styles & wardrobe staples','https://www.flipkart.com/search?q=fashion%20clothing'],
    ['myntra','Myntra','Fashion, footwear & personal style','https://www.myntra.com/clothing'],
    ['ajio','AJIO','Fresh labels & outfit discoveries','https://www.ajio.com/shop/women']
  ];
  return `<div class="shopping-floor">
    <div class="shopping-wrap">
      <section class="shop-section budget-section" id="budget-edit" aria-labelledby="budget-title">
        ${heading('budget-title','Big style. Your budget.','Pick a price ceiling and start exploring.', '/find/', 'Find a style')}
        <div class="budget-grid">${budgets.map(([name,max,img,query]) => `<a class="budget-card" href="${search(query,max)}"><span><small>${name}</small><b>Under <strong>₹${max.toLocaleString('en-IN')}</strong></b><em>Search this budget ${arrow}</em></span>${asset(img)}</a>`).join('')}</div>
        <p class="shop-fineprint">Budget searches, not advertised offers. Available matches depend on store listings.</p>
      </section>
      ${shelf(edits[0])}
      <section class="shop-section ethnic-section" id="ethnic-edit" aria-labelledby="ethnic-title">
        <div class="ethnic-story"><span class="campaign-photo campaign-photo-0" aria-hidden="true"></span><div><p class="shop-kicker">ROOTED IN STYLE</p><h2 id="ethnic-title">A little tradition.<br>A lot of you.</h2><p>From everyday kurtas to getting-ready-for-something-special sets.</p><a class="fd-button fd-secondary" href="${search('women ethnic kurta sets')}">Explore ethnic wear ${arrow}</a></div></div>
        <div class="ethnic-links">${[['Everyday kurtas','Comfort, colour, repeat.','cotton printed kurta'],['Coordinated sets','An outfit, already together.','women kurta pant dupatta set'],['Celebration wear','For moments worth dressing up.','women embroidered festive kurta'],['Modern ethnic','Your own take on tradition.','women contemporary ethnic wear']].map(([t,s,q],i) => `<a href="${search(q)}"><span>0${i+1}</span><div><b>${t}</b><small>${s}</small></div>${arrow}</a>`).join('')}</div>
      </section>
      ${shelf(edits[1])}
      <section class="shop-section occasion-section" id="occasion-edit" aria-labelledby="occasion-title">
        ${heading('occasion-title','What’s on your calendar?','Find a look for wherever the day takes you.', '/find/', 'Find my look')}
        <div class="occasion-grid">${occasions.map(([title,note,query,n]) => `<a class="occasion-card" href="${search(query)}"><span class="occasion-photo fd-look-photo fd-look-${n}" aria-hidden="true"></span><span class="occasion-copy"><small>THE OUTFIT EDIT</small><b>${title}</b><span>${note}</span><em>Recreate the look ${arrow}</em></span></a>`).join('')}</div>
      </section>
      <div class="extras-grid" id="extras-edit">
        <section class="shop-section" aria-labelledby="shoe-title">${heading('shoe-title','Good shoes. Great plans.','Start your next outfit from the ground up.',search('shoes sneakers'),'Explore shoes')}<div class="extras-tiles">${[
          item('The white sneaker','An everyday classic',8,'white casual sneakers'),item('Sport mode','For your active days',8,'running sports shoes'),item('Easy weekends','Slip into comfort',8,'casual slip on sneakers'),item('Find your pair','Discover more footwear',8,'women men casual shoes')
        ].map(productTile).join('')}</div></section>
        <section class="shop-section" aria-labelledby="accessories-title">${heading('accessories-title','Small details. Big difference.','Bags, watches and those finishing touches.',search('fashion accessories'),'Explore accessories')}<div class="extras-tiles">${[
          item('Carry it all','Everyday bags',9,'women shoulder bags'),item('On your time','Classic watches',10,'gold analog watch'),item('A sunny outlook','Sunglasses',10,'black sunglasses'),item('Workday polish','Smart layers',14,'women beige blazer')
        ].map(productTile).join('')}</div></section>
      </div>
      <section class="shop-section store-section" id="store-edit" aria-labelledby="store-title">
        ${heading('store-title','Your favourite stores, a little closer.','Explore fashion directly on the retailer’s website.','/how-it-works/','How it works')}
        <div class="store-grid">${stores.map(([key,name,note,url])=>`<a class="store-destination" href="${url}" target="_blank" rel="noopener noreferrer"><span class="store-wordmark store-wordmark-${key}">${name}</span><p>${note}</p><span>Explore ${name} <span aria-hidden="true">↗</span></span><small>Opens official store</small></a>`).join('')}</div>
      </section>
      <section class="shop-section shop-recent" id="homeRecent" hidden aria-labelledby="recent-home-title">${heading('recent-home-title','Pick up where you left off','Your recent searches, saved on this device.','/saved/','Saved items')}<div id="homeRecentList" class="recent-home-list"></div></section>
      <section class="find-your-look" aria-labelledby="find-your-look-title"><div><p class="shop-kicker">SPOTTED IT. LOVED IT. FIND IT.</p><h2 id="find-your-look-title">Your next outfit might<br>already be in your screenshots.</h2><p>Bring us the inspiration. Explore similar pieces and compare available prices.</p><a class="fd-button fd-primary" href="/find/?mode=photo">Upload a screenshot ${arrow}</a></div><ol><li><span>01</span><div><b>Show us your style</b><p>A screenshot, a product link, or a few words.</p></div></li><li><span>02</span><div><b>Explore your options</b><p>See similar styles. Exact matches need verified evidence.</p></div></li><li><span>03</span><div><b>Make it yours</b><p>Save your favourites and buy on the retailer’s website.</p></div></li></ol></section>
      <section class="shop-section browse-section" aria-labelledby="browse-title">
        ${heading('browse-title','Still exploring? Start here.','A few more routes to your next great find.','/find/','Search anything')}
        <div class="browse-chips">${['Oversized T-shirts','Linen shirts','Cotton kurtas','Floral dresses','Wide-leg jeans','White sneakers','Shoulder bags','Co-ord sets','Workwear blazers','Minimal watches','Party dresses','Printed shirts','Everyday tops','Denim jackets','Casual hoodies','Sunglasses'].map(q=>`<a href="${search(q.toLowerCase())}">${q} ${arrow}</a>`).join('')}</div>
      </section>
      <section class="shop-section home-questions" aria-labelledby="questions-title"><h2 id="questions-title">A little clarity before you shop.</h2><div>
        <details><summary>Can I buy directly from Fit Deal?</summary><p>Fit Deal helps you discover and compare fashion. Your purchase, payment, delivery and returns are handled by the retailer you choose.</p></details>
        <details><summary>Are the pictures actual products for sale?</summary><p>Our style collections use editorial inspiration images. Cards with verified prices use the available retailer listing data. Always check the final product, price and stock on the retailer’s page.</p></details>
        <details><summary>How does screenshot search work?</summary><p>Upload a clothing screenshot, choose the item and explore similar options. A visual resemblance alone is never labelled an exact match.</p></details>
        <details><summary>Does Fit Deal earn from store links?</summary><p>Some retailer links may earn us a commission at no extra cost to you. Commission does not decide the order of results. <a href="/affiliate-disclosure/">Read our affiliate disclosure.</a></p></details>
      </div></section>
    </div>
  </div>`;
}
module.exports = { navigation, campaigns, expansion };
