// Azure Function: /api/chat
// Securely proxies requests from the RAKA HR Assistant widget to the
// Anthropic API, so the API key never has to live in browser JS.
//
// Set your key as an Application Setting in the Azure Portal:
//   Static Web App -> Configuration -> Application settings
//   Name:  ANTHROPIC_API_KEY
//   Value: sk-ant-...   (your real key)
//
// Then redeploy / restart. Do NOT hardcode the key here.

module.exports = async function (context, req) {
  // Basic CORS (same-origin on Static Web Apps, but harmless to include)
  context.res = {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  };

  if (req.method === 'OPTIONS') {
    context.res.status = 204;
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    context.res.status = 500;
    context.res.body = { error: 'Server is missing ANTHROPIC_API_KEY. Set it in Static Web App > Configuration.' };
    return;
  }

  try {
    const { system, messages } = req.body || {};
    if (!messages) {
      context.res.status = 400;
      context.res.body = { error: 'Missing "messages" in request body.' };
      return;
    }

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: system || '',
        messages: messages
      })
    });

    const data = await upstream.json();
    context.res.status = upstream.status;
    context.res.body = data;
  } catch (err) {
    context.log.error('RAKA HR proxy error:', err);
    context.res.status = 502;
    context.res.body = { error: 'Upstream request to Anthropic API failed.' };
  }
};
