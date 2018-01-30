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

const getConsent = async (keys) => {
  const compositeKey = generateCompositeKey(keys);
  debug(`consent#id (compositeKey): ${compositeKey}`);
  return consentPayload(compositeKey);
};

const consent = async (keys) => {
  const payload = await getConsent(keys);
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

const hasConsent = async (keys) => {
  const payload = await getConsent(keys);
  return payload && payload.authorisationCode;
};

const filterConsented = async (username, scope, authorisationServerIds) => {
  const consented = [];
  await Promise.all(authorisationServerIds.map(async (authorisationServerId) => {
    const keys = { username, authorisationServerId, scope };
    if (await hasConsent(keys)) {
      consented.push(authorisationServerId);
    }
  }));
  return consented;
};

exports.generateCompositeKey = generateCompositeKey;
exports.setConsent = setConsent;
exports.consent = consent;
exports.consentAccessToken = consentAccessToken;
exports.filterConsented = filterConsented;
exports.AUTH_SERVER_USER_CONSENTS_COLLECTION = AUTH_SERVER_USER_CONSENTS_COLLECTION;
