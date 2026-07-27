const TOOL_ID = 'backlink_discover';

async function start(ctx) {
  await ctx.reply(
    '🌐 *Full Backlink Discovery*\n\n' +
      "This feature isn't wired up yet — finding *every* backlink to a domain " +
      'requires a paid data provider (Ahrefs, Moz, or SEMrush), since it means ' +
      'searching an index of the whole web, not just checking one page.\n\n' +
      'For now, try the *Backlink Verifier* to check a specific page.',
    { parse_mode: 'Markdown' }
  );
}

module.exports = { TOOL_ID, start };
