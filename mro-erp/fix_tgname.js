const https = require('https');

const fixSQL = `
CREATE OR REPLACE FUNCTION set_order_no()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_NAME = 'trg_purchase_orders_no' THEN
    NEW.order_no := generate_order_no('PO');
  ELSIF TG_NAME = 'trg_sales_orders_no' THEN
    NEW.order_no := generate_order_no('SO');
  ELSIF TG_NAME = 'trg_purchase_return_orders_no' THEN
    NEW.order_no := generate_order_no('PR');
  ELSIF TG_NAME = 'trg_sales_return_orders_no' THEN
    NEW.order_no := generate_order_no('SR');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

const data = JSON.stringify({ query: fixSQL });

const options = {
  hostname: 'api.supabase.com',
  path: '/v1/projects/gzvymxcojrljkprkgoap/database/query',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sbp_e4a10b5061f27fda34457f2b0e6ff22d95202d5b',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('SUCCESS: SQL executed');
    } else {
      console.log('ERROR:', body);
    }
  });
});
req.on('error', e => console.error('Request failed:', e.message));
req.write(data);
req.end();
