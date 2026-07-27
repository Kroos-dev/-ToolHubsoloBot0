const axios = require('axios');

async function fetchPage(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      maxContentLength: 5 * 1024 * 1024,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ToolHubSoloBot/1.0; +https://t.me/ToolHubsoloBot)',
        Accept: 'text/html,application/xhtml+xml',
      },
      validateStatus: (status) => status < 500,
    });

    return {
      ok: response.status >= 200 && response.status < 400,
      status: response.status,
      html: typeof response.data === 'string' ? response.data : '',
      finalUrl: response.request?.res?.responseUrl || url,
    };
  } catch (err) {
    let reason = 'Could not fetch that page.';
    if (err.code === 'ECONNABORTED') reason = 'The page took too long to respond (timeout).';
    else if (err.code === 'ENOTFOUND') reason = "That domain doesn't seem to exist.";
    else if (err.response) reason = `Server responded with status ${err.response.status}.`;

    return { ok: false, status: null, html: '', error: reason };
  }
}

module.exports = { fetchPage };
