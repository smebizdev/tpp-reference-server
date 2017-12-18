const { createClaims, createJsonWebSignature } = require('./request-jws');
const { generateRedirectUri } = require('./authorise-uri');
const { setTokenPayload, accessToken } = require('./access-tokens');
const { authorisationCodeGrantedHandler } = require('./authorisation-code-granted');
const { createAccessToken } = require('./obtain-access-token');

exports.accessToken = accessToken;
exports.authorisationCodeGrantedHandler = authorisationCodeGrantedHandler;
exports.createClaims = createClaims;
exports.createJsonWebSignature = createJsonWebSignature;
exports.generateRedirectUri = generateRedirectUri;
exports.createAccessToken = createAccessToken;
exports.setTokenPayload = setTokenPayload;
