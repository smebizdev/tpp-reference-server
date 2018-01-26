const { get, set } = require('../storage');
const debug = require('debug')('debug');

const ACCESS_TOKENS_COLLECTION = 'accessTokens';

const tokenPayload = async username => get(ACCESS_TOKENS_COLLECTION, username);

const setTokenPayload = async (username, payload) =>
  set(ACCESS_TOKENS_COLLECTION, payload, username);

const accessToken = async (username) => {
  const payload = await tokenPayload(username);
  debug(`accessToken#username: ${username}`);
  debug(`accessToken#payload: ${JSON.stringify(payload)}`);
  if (payload && payload.access_token) {
    return payload.access_token;
  }
  const err = new Error(`access token for username ${username} not found`);
  err.status = 500;
  throw err;
};

exports.setTokenPayload = setTokenPayload;
exports.accessToken = accessToken;
exports.ACCESS_TOKENS_COLLECTION = ACCESS_TOKENS_COLLECTION;
