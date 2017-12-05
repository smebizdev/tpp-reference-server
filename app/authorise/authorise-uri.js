const { createClaims, createJsonWebSignature } = require('./request-jws');
const { authorisationEndpoint, getClientCredentials, issuer } = require('../authorisation-servers');

const env = require('env-var');
const qs = require('qs');

const registeredRedirectUrl = env.get('SOFTWARE_STATEMENT_REDIRECT_URL').asString();

const statePayload = (authorisationServerId, sessionId, scope, idempotencyKey) => {
  const state = {
    authorisationServerId,
    idempotencyKey,
    sessionId,
    scope,
  };
  return Buffer.from(JSON.stringify(state)).toString('base64');
};

const generateRedirectUri = async (authorisationServerId, requestId, scope,
  sessionId, idempotencyKey) => {
  const { clientId } = await getClientCredentials(authorisationServerId);
  const state = statePayload(authorisationServerId, sessionId, scope, idempotencyKey);
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
