const { get, set } = require('../storage');
const debug = require('debug')('debug');

const AUTH_SERVER_USER_CONSENTS_COLLECTION = 'authorisationServerUserConsents';

const validateCompositeKey = (obj) => {
  if (!Object.keys(obj).includes('username', 'authorisationServerId', 'scope')) {
    const err = new Error(`Incorrect conset compositeKey [${obj}]`);
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
    const err = new Error(`consent for id ${JSON.stringify(keys)} not found`);
    err.status = 500;
    throw err;
  }
  return payload;
};


exports.generateCompositeKey = generateCompositeKey;
exports.setConsent = setConsent;
exports.consent = consent;
exports.AUTH_SERVER_USER_CONSENTS_COLLECTION = AUTH_SERVER_USER_CONSENTS_COLLECTION;
