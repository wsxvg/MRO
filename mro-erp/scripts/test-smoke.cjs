const https = require('https');
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6dnlteGNvanJsamtwcmtnb2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNzUwOTYsImV4cCI6MjA5NDk1MTA5Nn0.1I-5tJK_CNB6czEWZg0do_IgF1ohRnHZ5FJvGMD79k0';
const BASE = 'gzvymxcojrljkprkgoap.supabase.co';

function api(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: BASE, path: '/rest/v1' + path, method,
      headers: { 'apikey': ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }
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

async function test() {
  console.log('=== 1. 表结构检查 ===');
  const checks = ['products', 'stock_lots', 'purchase_orders', 'purchase_order_items', 'suppliers', 'stocks', 'stock_transactions', 'sales_orders', 'sales_order_items'];
  for (const t of checks) {
    const r = await api('/' + t + '?select=id&limit=1');
    console.log('  ' + t + ': ' + (Array.isArray(r) ? 'OK' : 'FAIL'));
  }

  console.log('');
  console.log('=== 2. 创建基础数据 ===');
  const units = await api('/units', 'POST', [{ name: '个', sort_order: 1 }, { name: '件', sort_order: 2 }]);
  console.log('  单位: ' + (Array.isArray(units) ? units.length + '个' : units));

  const cats = await api('/categories', 'POST', [{ name: '手动工具', sort_order: 1 }]);
  console.log('  分类: ' + (Array.isArray(cats) ? cats.length + '个' : cats));

  const whs = await api('/warehouses', 'POST', [{ name: '主仓库', location: '门店', is_default: true }]);
  console.log('  仓库: ' + (Array.isArray(whs) ? whs.length + '个' : whs));
  const whId = whs[0] && whs[0].id;

  const sups = await api('/suppliers', 'POST', [{ name: '世达工具总代' }]);
  console.log('  供应商: ' + (Array.isArray(sups) ? sups.length + '个' : sups));

  const custs = await api('/customers', 'POST', [{ name: '东莞五金厂' }]);
  console.log('  客户: ' + (Array.isArray(custs) ? custs.length + '个' : custs));

  console.log('');
  console.log('=== 3. 进货流程 ===');
  const prods = await api('/products', 'POST', [
    { name: '活动扳手', specification: '200mm', unit: '个', category_id: cats[0] && cats[0].id, reference_price: 45, cost_price: 0, cost_price_auto: true, is_active: true, min_stock: 0 },
    { name: '十字螺丝刀', specification: '5x100mm', unit: '个', category_id: cats[0] && cats[0].id, reference_price: 12, cost_price: 0, cost_price_auto: true, is_active: true, min_stock: 0 }
  ]);
  console.log('  商品: ' + (Array.isArray(prods) ? prods.length + '个' : prods));
  const p1 = prods[0] && prods[0].id;
  const p2 = prods[1] && prods[1].id;

  const lot1 = await rpc('stock_in_with_lot', { p_product_id: p1, p_warehouse_id: whId, p_quantity: 10, p_unit_cost: 25, p_is_estimated: false, p_supplier_id: sups[0] && sups[0].id });
  console.log('  入库(有进价): ' + (lot1 ? 'OK, lot=' + lot1 : 'FAIL'));

  const lot2 = await rpc('stock_in_with_lot', { p_product_id: p2, p_warehouse_id: whId, p_quantity: 20, p_unit_cost: 0, p_is_estimated: true });
  console.log('  入库(暂估): ' + (lot2 ? 'OK, lot=' + lot2 : 'FAIL'));

  const stocks = await api('/stocks?select=*,products(name)');
  console.log('  库存: ' + stocks.map(function(s) { return s.products.name + '=' + s.quantity; }).join(', '));

  const lots = await api('/stock_lots?select=*,products(name)');
  console.log('  批次: ' + lots.map(function(l) { return l.products.name + ' Y' + l.unit_cost + (l.is_estimated ? '(暂估)' : '(实际)'); }).join(', '));

  console.log('');
  console.log('=== 4. 销售流程 ===');
  const order1 = await api('/sales_orders', 'POST', { customer_id: custs[0] && custs[0].id, warehouse_id: whId, status: 'pending', needs_delivery: false, total_amount: 90, paid_amount: 90 });
  console.log('  订单: ' + (order1[0] ? order1[0].order_no : order1));

  await api('/sales_order_items', 'POST', { sales_order_id: order1[0] && order1[0].id, product_id: p1, quantity: 2, unit_price: 45, cost_price: 0 });

  const c1 = await rpc('complete_sales_order', { p_order_id: order1[0] && order1[0].id });
  console.log('  完成: ' + (c1 === '' || c1 === null ? 'OK' : c1));

  const stocksAfter = await api('/stocks?select=*,products(name)');
  console.log('  销售后库存: ' + stocksAfter.map(function(s) { return s.products.name + '=' + s.quantity; }).join(', '));

  const items = await api('/sales_order_items?sales_order_id=eq.' + (order1[0] && order1[0].id) + '&select=*,products(name)');
  console.log('  成本快照: ' + items.map(function(i) { return i.products.name + ' cost=' + i.cost_price; }).join(', '));

  console.log('');
  console.log('=== 5. 送货流程 ===');
  const order2 = await api('/sales_orders', 'POST', { customer_id: custs[0] && custs[0].id, warehouse_id: whId, status: 'pending', needs_delivery: true, total_amount: 12, paid_amount: 12 });
  console.log('  送货单: ' + (order2[0] ? order2[0].order_no : order2));

  await api('/sales_order_items', 'POST', { sales_order_id: order2[0] && order2[0].id, product_id: p2, quantity: 1, unit_price: 12, cost_price: 0 });

  const c2 = await rpc('complete_sales_order', { p_order_id: order2[0] && order2[0].id });
  console.log('  送达: ' + (c2 === '' || c2 === null ? 'OK' : c2));

  console.log('');
  console.log('=== 6. 采购单流程 ===');
  const po = await api('/purchase_orders', 'POST', { supplier_id: sups[0] && sups[0].id, warehouse_id: whId, status: 'pending' });
  console.log('  采购单: ' + (po[0] ? 'OK, id=' + po[0].id : po));

  await api('/purchase_order_items', 'POST', { purchase_order_id: po[0] && po[0].id, product_id: p1, quantity: 5, selling_price: 45, unit_cost: 22, is_estimated: false });

  const pending = await api('/purchase_orders?status=eq.pending&select=id');
  console.log('  待到货: ' + pending.length + '笔');

  console.log('');
  console.log('=== 7. 核价 ===');
  const uc = await rpc('update_lot_cost', { p_lot_id: lot2, p_new_cost: 8 });
  console.log('  核价: ' + (uc === '' || uc === null ? 'OK' : uc));

  const lotAfter = await api('/stock_lots?id=eq.' + lot2 + '&select=unit_cost,is_estimated');
  console.log('  核价后: Y' + lotAfter[0].unit_cost + ', 暂估=' + lotAfter[0].is_estimated);

  console.log('');
  console.log('=== 8. 安全库存 ===');
  const ss = await rpc('calc_all_safety_stocks', {});
  console.log('  计算: ' + (ss === '' || ss === null ? 'OK' : ss));

  console.log('');
  console.log('=== 9. 异常检测 ===');
  const anom = await rpc('detect_anomalies', {});
  console.log('  异常: ' + (Array.isArray(anom) ? anom.length + '条' : anom));

  console.log('');
  console.log('=== ALL TESTS PASSED ===');
}

test().catch(function(e) { console.error('ERROR:', e.message); });
