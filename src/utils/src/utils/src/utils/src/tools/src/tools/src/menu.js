const backlinkChecker = require('./tools/backlinkChecker');
const backlinkDiscovery = require('./tools/backlinkDiscovery');

const TOOLS = [
  {
    id: backlinkChecker.TOOL_ID,
    label: '🔗 Backlink Verifier',
    description: 'Check if a specific page links to your site',
    module: backlinkChecker,
  },
  {
    id: backlinkDiscovery.TOOL_ID,
    label: '🌐 Full Backlink Discovery',
    description: 'Find all backlinks to your domain (needs API key)',
    module: backlinkDiscovery,
  },
];

function mainMenuKeyboard() {
  return {
    inline_keyboard: [
      ...TOOLS.map((tool) => [{ text: tool.label, callback_data: `tool:${tool.id}` }]),
    ],
  };
}

function findTool(id) {
  return TOOLS.find((t) => t.id === id) || null;
}

module.exports = { TOOLS, mainMenuKeyboard, findTool };
