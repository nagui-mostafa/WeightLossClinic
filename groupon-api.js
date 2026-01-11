const crypto = require('crypto');
const https = require('https');
const zlib = require('zlib');

const SECRET = process.env.GROUPON_API_KEY ||
  'GAAmwY/AnoNrZPwpe8FcdP/DsNbuCpEykTS04qeHvZG2EInqpbq2ATjgL+5cjyBZ2+4UjXumucsairDi9N9SUQ';
const CLIENT_ID = process.env.GROUPON_CLIENT_ID || '8dafde799b86f91b92e5b60a7ef4c2cf';
const CONFIG_NAME = process.env.GROUPON_CONFIG_NAME || 'joey-med';
const REDEMPTION_CODE = 'WY2QM8CYUHWD';

// Build URL
const BASE_URL = `https://offer-api.groupon.com/partners/${CONFIG_NAME}/v1/units`;
const QUERY_PARAMS = `redemptionCodes=${REDEMPTION_CODE}&show=deal_info,option_info`;
const FULL_URL = `${BASE_URL}?${QUERY_PARAMS}`;

// KEY FIX: Use same value for nonce and X-Request-ID (like Groupon's example)
// Also use 33 characters to match their format
const nonceAndRequestId = crypto.randomBytes(16).toString('hex') + '1';

/**
 * Build signature following Groupon's exact algorithm
 */
function buildSignature(httpVerb, nonce, baseUrl, paramString, body, secret) {
  const sortedEncodedParams = paramString
    .split('&')
    .sort()
    .map(pair => {
      const [key, value] = pair.split('=');
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');

  const bodyHash = crypto.createHash('sha256').update(body.trim()).digest('hex');

  const inputString = [
    httpVerb.toUpperCase(),
    encodeURIComponent(nonce),
    encodeURIComponent(baseUrl),
    encodeURIComponent(sortedEncodedParams),
    bodyHash
  ].join('&');

  const hmac = crypto.createHmac('sha1', secret).update(inputString).digest('base64');
  const signature = encodeURIComponent(hmac);

  return signature;
}

// Generate signature
const signature = buildSignature('GET', nonceAndRequestId, BASE_URL, QUERY_PARAMS, '', SECRET);

// Build authorization header
const authHeader = `groupon-third-party version="1.1",digest="HMAC-SHA1",nonce="${nonceAndRequestId}",signature="${signature}"`;

console.log('='.repeat(60));
console.log('GROUPON API REQUEST (v2 - Fixed)');
console.log('='.repeat(60));
console.log('URL:', FULL_URL);
console.log('Nonce/RequestID:', nonceAndRequestId, `(${nonceAndRequestId.length} chars)`);
console.log('Authorization:', authHeader);
console.log('='.repeat(60));
console.log('');

const url = new URL(FULL_URL);

const req = https.request({
  hostname: url.hostname,
  path: url.pathname + url.search,
  method: 'GET',
  headers: {
    'Authorization': authHeader,
    'X-Request-ID': nonceAndRequestId,  // SAME as nonce
    'X-Client-ID': CLIENT_ID,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  }
}, (res) => {
  let chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    let buffer = Buffer.concat(chunks);
    let data;

    if (res.headers['content-encoding'] === 'gzip') {
      data = zlib.gunzipSync(buffer).toString();
    } else if (res.headers['content-encoding'] === 'deflate') {
      data = zlib.inflateSync(buffer).toString();
    } else {
      data = buffer.toString();
    }

    console.log('Status:', res.statusCode);
    console.log('');

    try {
      const parsed = JSON.parse(data);
      console.log('Response:');
      console.log(JSON.stringify(parsed, null, 2));

      console.log('');
      console.log('='.repeat(60));
      if (parsed.data && parsed.data.length > 0) {
        parsed.data.forEach(unit => {
          console.log(`✅ Voucher ${unit.redemptionCode}: ${unit.status.toUpperCase()}`);
          if (unit.attributes) {
            console.log(`   Deal: ${unit.attributes.dealTitle || 'N/A'}`);
            console.log(`   Option: ${unit.attributes.optionTitle || 'N/A'}`);
          }
        });
      }
      if (parsed.errors && parsed.errors.length > 0) {
        parsed.errors.forEach(err => {
          console.log(`❌ Error: ${err.code} - ${err.message || 'No message'}`);
        });
      }
      console.log('='.repeat(60));
    } catch (e) {
      console.log('Response (raw):', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();