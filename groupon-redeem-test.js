const crypto = require('crypto');
const https = require('https');
const zlib = require('zlib');

// PRE-PROD TEST CREDENTIALS
const SECRET = process.env.GROUPON_API_KEY ||
  '1hbiu1Llg8+W1m87SeUvZBRE/uY8vPr/aECIWTRRHJvUQtY6kA+rFm+/qr1AEFsOEA4UL00/oYIQ0mFaQ4wHzg';
const CLIENT_ID = process.env.GROUPON_CLIENT_ID || '8dafde799b86f91b92e5b60a7ef4c2cf';
const CONFIG_NAME = process.env.GROUPON_CONFIG_NAME || 'joey-med-preprod';
const REDEMPTION_CODE = process.env.REDEMPTION_CODE || 'TFZ3D9F9';

// Build URL (no query params for PATCH)
const BASE_URL = `https://offer-api.groupon.com/partners/${CONFIG_NAME}/v1/units`;

// Build request body
const requestBody = JSON.stringify({
  data: [{
    redemptionCode: REDEMPTION_CODE,
    status: 'redeemed',
    updatedAt: new Date().toISOString()
  }]
});

// Generate nonce (33 chars to match Groupon's format)
const nonceAndRequestId = crypto.randomBytes(16).toString('hex') + '1';

/**
 * Build signature following Groupon's exact algorithm
 */
function buildSignature(httpVerb, nonce, baseUrl, paramString, body, secret) {
  // Sort and encode query parameters (empty for this request)
  let sortedEncodedParams = '';
  if (paramString && paramString.length > 0) {
    sortedEncodedParams = paramString
      .split('&')
      .filter(p => p.length > 0)
      .sort()
      .map(pair => {
        const [key, value] = pair.split('=');
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      })
      .join('&');
  }

  // Hash the body (trimmed) with SHA256
  const bodyHash = crypto.createHash('sha256').update(body.trim()).digest('hex');

  // Build input string
  const inputString = [
    httpVerb.toUpperCase(),
    encodeURIComponent(nonce),
    encodeURIComponent(baseUrl),
    encodeURIComponent(sortedEncodedParams),
    bodyHash
  ].join('&');

  // HMAC-SHA1 + Base64
  const hmac = crypto.createHmac('sha1', secret).update(inputString).digest('base64');
  const signature = encodeURIComponent(hmac);

  // Debug info
  console.log('--- Signature Debug ---');
  console.log('Body Hash:', bodyHash);
  console.log('Input String:', inputString);
  console.log('HMAC Base64:', hmac);
  console.log('Signature:', signature);
  console.log('-----------------------');
  console.log('');

  return signature;
}

// Generate signature (empty query params, but body is included)
const signature = buildSignature('PATCH', nonceAndRequestId, BASE_URL, '', requestBody, SECRET);

// Build authorization header
const authHeader = `groupon-third-party version="1.1",digest="HMAC-SHA1",nonce="${nonceAndRequestId}",signature="${signature}"`;

console.log('='.repeat(60));
console.log('GROUPON REDEEM VOUCHER TEST (PRE-PROD)');
console.log('='.repeat(60));
console.log('Environment:    PRE-PRODUCTION');
console.log('Config:        ', CONFIG_NAME);
console.log('Code:          ', REDEMPTION_CODE);
console.log('URL:           ', BASE_URL);
console.log('Method:         PATCH');
console.log('Nonce/RequestID:', nonceAndRequestId, `(${nonceAndRequestId.length} chars)`);
console.log('');
console.log('Request Body:');
console.log(JSON.stringify(JSON.parse(requestBody), null, 2));
console.log('');
console.log('Authorization:', authHeader);
console.log('='.repeat(60));
console.log('');

const url = new URL(BASE_URL);

const req = https.request({
  hostname: url.hostname,
  path: url.pathname,
  method: 'PATCH',
  headers: {
    'Authorization': authHeader,
    'X-Request-ID': nonceAndRequestId,
    'X-Client-ID': CLIENT_ID,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(requestBody),
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

      // Success cases
      if (parsed.data && parsed.data.length > 0) {
        parsed.data.forEach(unit => {
          const statusIcon = unit.status === 'redeemed' ? '✅' : '⚠️';
          console.log(`${statusIcon} Voucher ${unit.redemptionCode}: ${unit.status.toUpperCase()}`);
        });
      }

      // Error cases
      if (parsed.errors && parsed.errors.length > 0) {
        parsed.errors.forEach(err => {
          let icon = '❌';
          let description = '';

          switch(err.code) {
            case 'INVALID_STATE_TRANSITION':
              description = '(Voucher may already be redeemed or in invalid state)';
              break;
            case 'UNIT_NOT_FOUND':
              description = '(Voucher code not found)';
              break;
            case 'UNKNOWN_ERROR':
              description = '(Check signature or request format)';
              break;
            case 'MALFORMED_REQUEST':
              description = '(Check request body format)';
              break;
          }

          console.log(`${icon} Error: ${err.code} ${description}`);
          if (err.redemptionCode) {
            console.log(`   Code: ${err.redemptionCode}`);
          }
          if (err.message) {
            console.log(`   Message: ${err.message}`);
          }
        });
      }

      // Summary based on HTTP status
      console.log('');
      if (res.statusCode === 200) {
        console.log('🎉 SUCCESS! All vouchers redeemed successfully.');
      } else if (res.statusCode === 207) {
        console.log('⚠️  PARTIAL SUCCESS! Some vouchers redeemed, some failed.');
      } else if (res.statusCode === 400) {
        console.log('❌ FAILED! Check errors above.');
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

// Write the body and send request
req.write(requestBody);
req.end();