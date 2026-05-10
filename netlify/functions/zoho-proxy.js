exports.handler = async function(event) {
  const orderId = event.queryStringParameters?.order_id;
  const tokenResp = await fetch("https://accounts.zoho.eu/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `refresh_token=1000.917e36def72f0ef19c3fbb1a7a0cd69d.7f0ee9b4dc7c1a230ebc11b8d44c3c52&client_id=1000.EEKJG69ZDBY9OPWSREE0XJPP0IN80R&client_secret=cc2b2c0189e839c6f173e4cdc66f5cd577c6ea9ed2&grant_type=refresh_token`
  });
  const tokenData = await tokenResp.json();
  const accessToken = tokenData.access_token;
  if(!accessToken) {
    return { statusCode: 500, body: JSON.stringify({ error: "Auth failed" }) };
  }
  const url = `https://creator.zoho.eu/api/v2/calikebab/cali-kebab/report/Courier_Location_Report?criteria=Order_ID==${orderId}`;
  const resp = await fetch(url, {
    headers: { "Authorization": "Zoho-oauthtoken " + accessToken }
  });
  const data = await resp.json();
  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(data)
  };
};
