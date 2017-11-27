const { createClaims, createJsonWebSignature } = require('./request-jws');
const { setTokenPayload, accessToken } = require('./access-tokens');
const { authorisationCodeGrantedHandler } = require('./authorisation-code-granted');

exports.accessToken = accessToken;
exports.authorisationCodeGrantedHandler = authorisationCodeGrantedHandler;
exports.createClaims = createClaims;
exports.createJsonWebSignature = createJsonWebSignature;
exports.setTokenPayload = setTokenPayload;
