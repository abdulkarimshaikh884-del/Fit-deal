require('./helpers');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {products,categories} = require('../src/catalog');
const server = require('../server');
let base;
test.before(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;});
test.after(()=>new Promise(r=>server.close(r)));
test('every editorial product has a permanent detail page and local image',async()=>{
  assert.equal(new Set(products.map(p=>p.id)).size,products.length);
  for(const p of products){
    const res=await fetch(base+'/style/'+p.id+'/');assert.equal(res.status,200,p.id);
    const html=await res.text();assert.ok(html.includes('data-style-id="'+p.id+'"'));
    assert.match(html,/Editorial inspiration/);assert.doesNotMatch(html,/₹[0-9]|% OFF/);
    assert.ok(fs.existsSync(path.join(__dirname,'../public',p.image)));
  }
  for(const c of categories)assert.ok(products.some(p=>p.tags.includes(c)),'category '+c+' has content');
});
test('all built internal page links resolve without missing destinations',async()=>{
  const root=path.join(__dirname,'../public');const files=[];
  function walk(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const name=path.join(dir,f.name);if(f.isDirectory())walk(name);else if(name.endsWith('.html'))files.push(name);}}
  walk(root);const urls=new Set(['/shop/','/categories/','/collections/','/stores/']);
  for(const file of files)for(const match of fs.readFileSync(file,'utf8').matchAll(/href="(\/[^"#?]*)(?:[?#][^"]*)?"/g)){
    if(!/\.(css|png|svg|webmanifest|ico)$/.test(match[1]))urls.add(match[1]);
  }
  for(const url of urls){const res=await fetch(base+url);assert.equal(res.status,200,url);}
});
test('homepage product actions link to valid destinations',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
  for(const m of html.matchAll(/<a href="([^"]+)" class="(?:fd-btn-view-product|fd-link-view|fd-showcase-btn)"/g)) {
    assert.match(m[1],/^\/(?:style\/[a-z-]+|find\/\?q=|deals\/\?cat=)/);
  }
});
