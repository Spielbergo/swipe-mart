/**
 * Netlify Function: ebay-token
 *
 * Exchanges your eBay app credentials for a client-credentials OAuth token.
 * Runs server-side so EBAY_CLIENT_SECRET is never exposed to the browser.
 *
 * Endpoint (after deploy): GET /.netlify/functions/ebay-token
 *
 * Required Netlify environment variables (set in Netlify dashboard,
 * NOT in your .env — you don't want the secret in your repo):
 *   EBAY_CLIENT_ID      — your eBay Production App ID (Client ID)
 *   EBAY_CLIENT_SECRET  — your eBay Production Cert ID (Client Secret)
 */

exports.handler = async () => {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'eBay credentials not configured. Add EBAY_CLIENT_ID and EBAY_CLIENT_SECRET to Netlify environment variables.',
      }),
    };
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: data.error_description ?? 'eBay auth failed' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // Allow the Netlify-hosted frontend to call this function
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        access_token: data.access_token,
        expires_in: data.expires_in, // typically 7200 (2 hours)
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
