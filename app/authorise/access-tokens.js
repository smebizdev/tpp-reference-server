const { get, set } = require('../storage');
const debug = require('debug')('debug');

const ACCESS_TOKENS_COLLECTION = 'accessTokens';

const tokenPayload = async sessionId => get(ACCESS_TOKENS_COLLECTION, sessionId);

const setTokenPayload = async (sessionId, payload) =>
  set(ACCESS_TOKENS_COLLECTION, payload, sessionId);

const accessToken = async (sessionId) => {
  const payload = await tokenPayload(sessionId);
  debug(`accessToken#sessionId: ${sessionId}`);
  debug(`accessToken#payload: ${JSON.stringify(payload)}`);
  if (payload && payload.access_token) {
    return payload.access_token;
  }
  const err = new Error(`access token for session ${sessionId} not found`);
  err.status = 500;
  throw err;
};

exports.setTokenPayload = setTokenPayload;
exports.accessToken = accessToken;
exports.ACCESS_TOKENS_COLLECTION = ACCESS_TOKENS_COLLECTION;
