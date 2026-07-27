function normalizeUrl(input) {
  let raw = input.trim();
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`;
  }
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

function hostMatches(hrefUrl, targetUrl) {
  const a = hrefUrl.hostname.replace(/^www\./, '').toLowerCase();
  const b = targetUrl.hostname.replace(/^www\./, '').toLowerCase();
  return a === b;
}

module.exports = { normalizeUrl, hostMatches };
