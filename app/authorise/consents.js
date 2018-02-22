const { get, set, remove } = require('../storage');
const { accessTokenAndResourcePath } = require('./setup-request');
const { fapiFinancialIdFor } = require('../authorisation-servers');
const { getAccountRequest } = require('../setup-account-request/account-requests');
const uuidv4 = require('uuid/v4');
const debug = require('debug')('debug');
const error = require('debug')('error');

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

const deleteConsent = async (keys) => {
  debug(`#deleteConsent keys: [${JSON.stringify(keys)}]`);
  const compositeKey = generateCompositeKey(keys);
  await remove(AUTH_SERVER_USER_CONSENTS_COLLECTION, compositeKey);
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

const setConsent = async (keys, payload) => {
  debug(`#setConsent keys: [${JSON.stringify(keys)}]`);
  debug(`#setConsent payload: [${JSON.stringify(payload)}]`);
  const stored = await getConsent(keys);
  let toStore;
  if (stored && stored.accountRequestId === payload.accountRequestId) {
    toStore = Object.assign({}, payload, { permissions: stored.permissions });
  } else {
    toStore = payload;
  }
  const compositeKey = generateCompositeKey(keys);
  debug(`#setConsent compositeKey: [${compositeKey}]`);
  await set(AUTH_SERVER_USER_CONSENTS_COLLECTION, toStore, compositeKey);
};

const consentAccessToken = async (keys) => {
  const existing = await consent(keys);
  return existing.token.access_token;
};

const consentAccessTokenAndPermissions = async (keys) => {
  const existing = await consent(keys);
  const accessToken = existing.token.access_token;
  const { permissions } = existing;
  return { accessToken, permissions };
};

const getConsentStatus = async (accountRequestId, authorisationServerId, sessionId) => {
  const { accessToken, resourcePath } = await accessTokenAndResourcePath(authorisationServerId);
  debug(`getConsentStatus#accessToken: ${accessToken}`);
  debug(`getConsentStatus#resourcePath: ${resourcePath}`);

  const fapiFinancialId = await fapiFinancialIdFor(authorisationServerId);
  debug(`getConsentStatus#fapiFinancialId: ${fapiFinancialId}`);
  const interactionId = uuidv4();
  const headers = {
    accessToken, fapiFinancialId, interactionId, sessionId, authorisationServerId,
  };
  const response = await getAccountRequest(accountRequestId, resourcePath, headers);
  debug(`getConsentStatus#getAccountRequest: ${JSON.stringify(response)}`);

  if (!response || !response.Data) {
    const err = new Error(`Bad account request response: "${JSON.stringify(response)}"`);
    err.status = 500;
    throw err;
  }
  const result = response.Data.Status;
  debug(`getConsentStatus#Status: ${result}`);
  return result;
};

const hasConsent = async (keys, sessionId) => {
  const payload = await getConsent(keys);
  if (!payload || !payload.authorisationCode) return false;

  try {
    const status = await getConsentStatus(
      payload.accountRequestId,
      payload.authorisationServerId,
      sessionId,
    );
    return status === 'Authorised';
  } catch (e) {
    error(e);
    return false;
  }
};

const filterConsented = async (username, scope, sessionId, authorisationServerIds) => {
  const consented = [];
  await Promise.all(authorisationServerIds.map(async (authorisationServerId) => {
    const keys = { username, authorisationServerId, scope };
    if (await hasConsent(keys, sessionId)) {
      consented.push(authorisationServerId);
    }
  }));
  return consented;
};

const consentAccountRequestId = async (keys) => {
  const existing = await consent(keys);
  return existing.accountRequestId;
};

exports.generateCompositeKey = generateCompositeKey;
exports.setConsent = setConsent;
exports.getConsent = getConsent;
exports.consent = consent;
exports.consentAccessToken = consentAccessToken;
exports.consentAccessTokenAndPermissions = consentAccessTokenAndPermissions;
exports.filterConsented = filterConsented;
exports.getConsentStatus = getConsentStatus;
exports.consentAccountRequestId = consentAccountRequestId;
exports.deleteConsent = deleteConsent;
exports.AUTH_SERVER_USER_CONSENTS_COLLECTION = AUTH_SERVER_USER_CONSENTS_COLLECTION;
