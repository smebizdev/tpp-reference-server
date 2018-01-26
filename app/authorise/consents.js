const { get, set } = require('../storage');
const debug = require('debug')('debug');

const AUTH_SERVER_USER_CONSENTS_COLLECTION = 'authorisationServerUserConsents';

const validateCompositeKey = (obj) => {
  if (!Object.keys(obj).includes('username', 'authorisationServerId', 'scope')) {
    const err = new Error(`Incorrect consent compositeKey [${obj}]`);
    err.status = 500;
    throw err;
  }
};

const generateCompositeKey = (obj) => {
  validateCompositeKey(obj);
  return `${obj.username}:::${obj.authorisationServerId}:::${obj.scope}`;
};

const setConsent = async (keys, payload) => {
  debug(`#setConsent keys: [${JSON.stringify(keys)}]`);
  debug(`#setConsent payload: [${JSON.stringify(payload)}]`);
  const compositeKey = generateCompositeKey(keys);
  debug(`#setConsent compositeKey: [${compositeKey}]`);
  await set(AUTH_SERVER_USER_CONSENTS_COLLECTION, payload, compositeKey);
};

const consentPayload = async compositeKey =>
  get(AUTH_SERVER_USER_CONSENTS_COLLECTION, compositeKey);

const consent = async (keys) => {
  const compositeKey = generateCompositeKey(keys);
  const payload = await consentPayload(compositeKey);
  debug(`consent#id (compositeKey): ${compositeKey}`);
  debug(`consent#payload: ${JSON.stringify(payload)}`);
  if (!payload) {
    const err = new Error(`User [${keys.username}] has not yet given consent to access their ${keys.scope}`);
    err.status = 500;
    throw err;
  }
  return payload;
};

const consentAccessToken = async (keys) => {
  const existing = await consent(keys);
  return existing.token.access_token;
};

exports.generateCompositeKey = generateCompositeKey;
exports.setConsent = setConsent;
exports.consent = consent;
exports.consentAccessToken = consentAccessToken;
exports.AUTH_SERVER_USER_CONSENTS_COLLECTION = AUTH_SERVER_USER_CONSENTS_COLLECTION;
