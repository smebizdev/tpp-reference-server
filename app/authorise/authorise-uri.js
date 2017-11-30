const { createClaims, createJsonWebSignature } = require('./request-jws');
const { authorisationEndpoint, getClientCredentials, issuer } = require('../authorisation-servers');

const env = require('env-var');
const qs = require('qs');

const registeredRedirectUrl = env.get('SOFTWARE_STATEMENT_REDIRECT_URL').asString();

const statePayload = (authorisationServerId, sessionId) => {
  const state = {
    authorisationServerId,
    sessionId,
  };
  return Buffer.from(JSON.stringify(state)).toString('base64');
};

const generateRedirectUri = async (authorisationServerId, requestId, scope, sessionId) => {
  const { clientId } = await getClientCredentials(authorisationServerId);
  const state = statePayload(authorisationServerId, sessionId);
  const authEndpoint = await authorisationEndpoint(authorisationServerId);
  const authServerIssuer = await issuer(authorisationServerId);
  const payload = createClaims(
    scope, requestId, clientId, authServerIssuer,
    registeredRedirectUrl, state, createClaims,
  );
  const signature = createJsonWebSignature(payload);
  const uri =
    `${authEndpoint}?${qs.stringify({
      redirect_uri: registeredRedirectUrl,
      state,
      client_id: clientId,
      response_type: 'code',
      request: signature,
      scope,
    })}`;
  return uri;
};

exports.generateRedirectUri = generateRedirectUri;
exports.statePayload = statePayload;
