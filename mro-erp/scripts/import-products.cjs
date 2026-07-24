const XLSX = require('xlsx-js-style');
const https = require('https');

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnlteGNvanJsamtwcmtnb2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNzUwOTYsImV4cCI6MjA5NDk1MTA5Nn0.1I-5tJK_CNB6czEWZg0do_IgF1ohRnHZ5FJvGMD79k0';
const BASE = 'gzvymxcojrljkprkgoap.supabase.co';

function api(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: BASE, path: '/rest/v1' + path, method,
      headers: {
        'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY,
        'Content-Type': 'application/json', 'Prefer': 'return=representation'
      }
    };
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function rpc(name, args = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: BASE, path: '/rest/v1/rpc/' + name, method: 'POST',
      headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY, 'Content-Type': 'application/json' }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    req.write(JSON.stringify(args));
    req.end();
  });
}

async function main() {
  // 1. Read Excel
  const wb = XLSX.readFile('C:/项目/MRO/商品数据_导入用.xlsx');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log('Excel rows:', rows.length - 1);

  // 2. Get existing categories
  const existingCats = await api('/categories?select=id,name');
  const catMap = {};
  for (const c of existingCats) catMap[c.name] = c.id;

  // 3. Get existing products (by name+spec dedup)
  const existingProds = await api('/products?select=id,name,specification&limit=10000');
  const dedupMap = new Map();
  for (const p of existingProds) {
    dedupMap.set(p.name + '|' + (p.specification || ''), p.id);
  }

  // 4. Process rows
  const products = [];
  const categoriesToCreate = new Set();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;

    const name = String(row[0] || '').trim();
    const category = String(row[1] || '').trim();
    const spec = String(row[2] || '').trim() || null;
    const unit = String(row[3] || '个').trim() || '个';
    const costPrice = parseFloat(row[4]) || 0;
    const sellingPrice = parseFloat(row[5]) || 0;

    if (!name) continue;

    const costPriceAuto = costPrice <= 0 && sellingPrice > 0;
    const finalCost = costPrice > 0 ? costPrice : (sellingPrice > 0 ? Math.round((sellingPrice / 1.3) * 100) / 100 : 0);

    if (category && !catMap[category]) {
      categoriesToCreate.add(category);
    }

    products.push({
      name, category, spec, unit,
      reference_price: sellingPrice,
      cost_price: finalCost,
      cost_price_auto: costPriceAuto,
      has_real_cost: costPrice > 0,
    });
  }

  console.log('Products to import:', products.length);
  console.log('New categories:', [...categoriesToCreate]);

  // 5. Create missing categories
  for (const catName of categoriesToCreate) {
    const result = await api('/categories', 'POST', { name: catName, sort_order: 0 });
    if (Array.isArray(result) && result[0]) {
      catMap[catName] = result[0].id;
      console.log('  Created category:', catName, 'id=' + result[0].id);
    }
  }

  // 6. Create/update products in batches
  let created = 0, updated = 0, errors = 0;

  for (const p of products) {
    const dedupKey = p.name + '|' + (p.spec || '');
    const existingId = dedupMap.get(dedupKey);

    const data = {
      name: p.name,
      category_id: catMap[p.category] || null,
      specification: p.spec,
      unit: p.unit,
      reference_price: p.reference_price,
      cost_price: p.cost_price,
      cost_price_auto: p.cost_price_auto,
      is_active: true,
      min_stock: 0,
    };

    let productId;
    if (existingId) {
      // Update existing
      const res = await api('/products?id=eq.' + existingId, 'PATCH', data);
      productId = existingId;
      if (Array.isArray(res)) updated++;
      else { errors++; console.log('  Update error:', p.name, res); }
    } else {
      // Create new
      const res = await api('/products', 'POST', data);
      if (Array.isArray(res) && res[0]) {
        productId = res[0].id;
        created++;
      } else {
        errors++;
        console.log('  Create error:', p.name, res);
        continue;
      }
    }

    // 7. If real cost price, update estimated lots (reconciliation)
    if (p.has_real_cost && existingId) {
      await api('/stock_lots?product_id=eq.' + productId + '&is_estimated=eq.true&quantity=gt.0', 'PATCH', {
        unit_cost: p.cost_price,
        is_estimated: false,
      });
    }
  }

  console.log('');
  console.log('=== Import Complete ===');
  console.log('Created:', created);
  console.log('Updated:', updated);
  console.log('Errors:', errors);

  // 8. Recalculate safety stock for all products
  console.log('Recalculating safety stocks...');
  const ssResult = await rpc('calc_all_safety_stocks', {});
  console.log('Safety stock recalc:', ssResult === '' || ssResult === null ? 'OK' : ssResult);
}

main().catch(e => console.error('FATAL:', e.message));
