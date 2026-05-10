const https = require('https');

// Кэш токена — живёт пока функция "тёплая"
let cachedToken = null;
let tokenExpiry = 0;

function httpsPost(url, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(JSON.parse(data)); });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpsGet(url, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: { 'Authorization': 'Zoho-oauthtoken ' + token }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(JSON.parse(data)); });
    });
    req.on('error', reject);
    req.end();
  });
}

async function getToken() {
  // Если токен есть и ещё не истёк — возвращаем его
  if (cachedToken && Date.now() < tokenExpiry) {
    console.log('Using cached token');
    return cachedToken;
  }

  console.log('Requesting new token...');
  const tokenData = await httpsPost(
    'https://accounts.zoho.eu/oauth/v2/token',
    'refresh_token=1000.917e36def72f0ef19c3fbb1a7a0cd69d.7f0ee9b4dc7c1a230ebc11b8d44c3c52' +
    '&client_id=1000.EEKJG69ZDBY9OPWSREE0XJPP0IN80R' +
    '&client_secret=cc2b2c0189e839c6f173e4cdc66f5cd577c6ea9ed2' +
    '&grant_type=refresh_token'
  );

  if (!tokenData.access_token) {
    throw new Error('Auth failed: ' + JSON.stringify(tokenData));
  }

  // Сохраняем токен на 55 минут (Zoho выдаёт на 60)
  cachedToken = tokenData.access_token;
  tokenExpiry = Date.now() + 55 * 60 * 1000;

  return cachedToken;
}

exports.handler = async function(event) {
  const orderId = event.queryStringParameters && event.queryStringParameters.order_id;

  if (!orderId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'order_id is required' }) };
  }

  try {
    const token = await getToken();

    const data = await httpsGet(
      `https://creator.zoho.eu/api/v2/calikebab/calikebab/report/Courier_Location%20Report?criteria=Order_ID==${orderId}`,
      token
    );

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data)
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
