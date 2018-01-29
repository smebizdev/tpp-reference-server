const { createClaims, createJsonWebSignature } = require('./request-jws');
const { generateRedirectUri } = require('./authorise-uri');
const {
  setConsent, consent, consentAccessToken, filterConsented, consentAccountRequestId,
} = require('./consents');
const { authorisationCodeGrantedHandler } = require('./authorisation-code-granted');
const { createAccessToken } = require('./obtain-access-token');
const { accessTokenAndResourcePath } = require('./setup-request');

exports.accessTokenAndResourcePath = accessTokenAndResourcePath;
exports.authorisationCodeGrantedHandler = authorisationCodeGrantedHandler;
exports.createClaims = createClaims;
exports.createJsonWebSignature = createJsonWebSignature;
exports.filterConsented = filterConsented;
exports.generateRedirectUri = generateRedirectUri;
exports.createAccessToken = createAccessToken;
exports.setConsent = setConsent;
exports.consent = consent;
exports.consentAccountRequestId = consentAccountRequestId;
exports.consentAccessToken = consentAccessToken;
