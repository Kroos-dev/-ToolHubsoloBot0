const cheerio = require('cheerio');
const { fetchPage } = require('../utils/fetchPage');
const { normalizeUrl, hostMatches } = require('../utils/url');
const session = require('../utils/session');

const TOOL_ID = 'backlink_verify';

const STEPS = {
  AWAITING_SOURCE: 'AWAITING_SOURCE',
  AWAITING_TARGET: 'AWAITING_TARGET',
};

async function start(ctx) {
  session.set(ctx.from.id, { tool: TOOL_ID, step: STEPS.AWAITING_SOURCE });
  await ctx.reply(
    '🔗 *Backlink Verifier*\n\n' +
      'Send me the page that is supposed to link to you ' +
      '(the source page, e.g. `https://someblog.com/article`).',
    { parse_mode: 'Markdown' }
  );
}

async function handleMessage(ctx, state) {
  const text = ctx.message.text.trim();

  if (state.step === STEPS.AWAITING_SOURCE) {
    const sourceUrl = normalizeUrl(text);
    if (!sourceUrl) {
      return ctx.reply("That doesn't look like a valid URL. Try again, e.g. `example.com/page`.", {
        parse_mode: 'Markdown',
      });
    }
    session.set(ctx.from.id, { ...state, step: STEPS.AWAITING_TARGET, sourceUrl: sourceUrl.href });
    return ctx.reply('Got it. Now send me *your* URL — the one you want to check is linked (e.g. `https://yoursite.com`).', {
      parse_mode: 'Markdown',
    });
  }

  if (state.step === STEPS.AWAITING_TARGET) {
    const targetUrl = normalizeUrl(text);
    if (!targetUrl) {
      return ctx.reply("That doesn't look like a valid URL. Try again, e.g. `yoursite.com`.", {
        parse_mode: 'Markdown',
      });
    }

    await ctx.reply('🔎 Checking…');
    const result = await checkBacklink(state.sourceUrl, targetUrl.href);
    session.clear(ctx.from.id);
    return ctx.reply(result, { parse_mode: 'Markdown', disable_web_page_preview: true });
  }
}

async function checkBacklink(sourceUrlStr, targetUrlStr) {
  const targetUrl = new URL(targetUrlStr);
  const page = await fetchPage(sourceUrlStr);

  if (!page.ok) {
    return `❌ *Couldn't check that page.*\n${page.error || `HTTP status ${page.status}`}\n\nSource: ${sourceUrlStr}`;
  }

  const $ = cheerio.load(page.html);
  const matches = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    let hrefUrl;
    try {
      hrefUrl = new URL(href, page.finalUrl);
    } catch {
      return;
    }

    if (hostMatches(hrefUrl, targetUrl)) {
      const anchorText = $(el).text().trim().slice(0, 80) || '(no anchor text)';
      const rel = ($(el).attr('rel') || '').toLowerCase();
      const isNofollow = rel.includes('nofollow');
      const isSponsored = rel.includes('sponsored');
      const isUgc = rel.includes('ugc');

      let tag = 'dofollow';
      if (isNofollow) tag = 'nofollow';
      else if (isSponsored) tag = 'sponsored';
      else if (isUgc) tag = 'ugc';

      matches.push({ href: hrefUrl.href, anchorText, tag });
    }
  });

  if (matches.length === 0) {
    return (
      `❌ *No link found.*\n\n` +
      `Checked: ${sourceUrlStr}\n` +
      `Looking for a link to: ${targetUrl.hostname}\n\n` +
      `_Note: this only sees links present in the raw HTML. If the source page loads content via JavaScript, a link added client-side won't show up here._`
    );
  }

  const lines = matches
    .slice(0, 10)
    .map((m, i) => `${i + 1}. *${m.tag}* — anchor: "${m.anchorText}"\n   → ${m.href}`)
    .join('\n\n');

  const extra = matches.length > 10 ? `\n\n…and ${matches.length - 10} more.` : '';

  return `✅ *Found ${matches.length} link${matches.length > 1 ? 's' : ''}!*\n\nSource: ${sourceUrlStr}\n\n${lines}${extra}`;
}

module.exports = { TOOL_ID, start, handleMessage, STEPS };
