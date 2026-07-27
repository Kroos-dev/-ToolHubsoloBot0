const store = new Map();

function get(userId) {
  return store.get(userId) || null;
}

function set(userId, data) {
  store.set(userId, data);
}

function clear(userId) {
  store.delete(userId);
}

module.exports = { get, set, clear };
