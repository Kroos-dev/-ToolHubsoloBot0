require('dotenv').config();
const { Telegraf } = require('telegraf');
const session = require('./utils/session');
const { mainMenuKeyboard, findTool, TOOLS } = require('./menu');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('Missing BOT_TOKEN env var. Set it in .env locally or in Railway → Variables.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  session.clear(ctx.from.id);
  return ctx.reply(
    `👋 Welcome to *ToolHubSoloBot*.\n\nPick a tool to get started:`,
    { parse_mode: 'Markdown', reply_markup: mainMenuKeyboard() }
  );
});

bot.help((ctx) => {
  const list = TOOLS.map((t) => `• ${t.label} — ${t.description}`).join('\n');
  return ctx.reply(`Available tools:\n\n${list}\n\nSend /start any time to see the menu again, or /cancel to stop whatever you're doing.`);
});

bot.command('cancel', (ctx) => {
  session.clear(ctx.from.id);
  return ctx.reply('Cancelled. Send /start to see the menu.');
});

bot.command('menu', (ctx) => {
  return ctx.reply('Pick a tool:', { reply_markup: mainMenuKeyboard() });
});

bot.action(/^tool:(.+)$/, async (ctx) => {
  const toolId = ctx.match[1];
  const tool = findTool(toolId);
  await ctx.answerCbQuery();

  if (!tool) {
    return ctx.reply("That tool isn't available right now.");
  }
  return tool.module.start(ctx);
});

bot.on('text', async (ctx) => {
  if (ctx.message.text.startsWith('/')) return;

  const state = session.get(ctx.from.id);
  if (!state) {
    return ctx.reply('Not sure what you mean — send /start to see the tool menu.');
  }

  const tool = findTool(state.tool);
  if (!tool || !tool.module.handleMessage) {
    session.clear(ctx.from.id);
    return ctx.reply('Something went wrong with that flow. Send /start to try again.');
  }

  return tool.module.handleMessage(ctx, state);
});

bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('Something went wrong on my end. Try again, or /cancel and start over.').catch(() => {});
});

bot.launch().then(() => {
  console.log('ToolHubSoloBot is running (long polling).');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
