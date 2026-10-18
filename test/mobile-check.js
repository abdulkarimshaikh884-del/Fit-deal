const http = require('http');

const PAGES = [
  '/',
  '/find/',
  '/deals/',
  '/saved/',
  '/profile/',
  '/login/',
  '/signup/',
  '/try-on/',
  '/how-it-works/',
  '/faq/',
  '/about/',
  '/contact/',
  '/privacy/',
  '/terms/',
  '/affiliate-disclosure/',
  '/categories/',
  '/shop/',
  '/collections/',
  '/stores/',
  '/brands/',
  '/cookie-policy/',
  '/grievance-redressal/',
  '/careers/',
  '/press/',
  '/product/deals/deal-libas-anarkali/',
  '/404'
];

async function checkPage(path) {
  const port = process.env.PORT || 5173;
  return new Promise((resolve) => {
    http.get(`http://localhost:${port}` + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const issues = [];
        if (res.statusCode !== 200 && path !== '/404') {
          issues.push(`Status: ${res.statusCode}`);
        }
        if (!data.includes('name="viewport"')) {
          issues.push('Missing viewport meta tag');
        }
        if (!data.includes('class="tabs"')) {
          issues.push('Missing bottom tabs navigation');
        }
        if (!data.includes('class="m-head') && !data.includes('class="fd-home-mobile-head"')) {
          issues.push('Missing mobile header');
        }
        if (!data.includes('id="sidebarBackdrop"') || !data.includes('id="fdSidebar"')) {
          issues.push('Missing Left Sidebar panel');
        }
        resolve({ path, status: res.statusCode, length: data.length, issues });
      });
    }).on('error', (err) => {
      resolve({ path, error: err.message });
    });
  });
}

async function run() {
  console.log('Testing all Fit Deal pages for mobile readiness...\n');
  for (const p of PAGES) {
    const res = await checkPage(p);
    if (res.issues && res.issues.length > 0) {
      console.log(`❌ ${p}: ${res.issues.join(', ')}`);
    } else if (res.error) {
      console.log(`❌ ${p}: Error - ${res.error}`);
    } else {
      console.log(`✅ ${p} (Status ${res.status}, ${res.length} bytes) - Mobile layout present`);
    }
  }
}

run();
