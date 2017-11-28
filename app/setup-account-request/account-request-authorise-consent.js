const { setupAccountRequest } = require('./setup-account-request');
const { createClaims, createJsonWebSignature } = require('../authorise');
const { authorisationEndpoint, getClientCredentials, issuer } = require('../authorisation-servers');
const error = require('debug')('error');
const debug = require('debug')('debug');
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
  const authServerEndpoint = await authorisationEndpoint(authorisationServerId);
  const authServerIssuer = await issuer(authorisationServerId);
  const payload = createClaims(
    scope, requestId, clientId, authServerIssuer,
    registeredRedirectUrl, state, createClaims,
  );
  const signature = createJsonWebSignature(payload);
  const uri =
    `${authServerEndpoint}?${qs.stringify({
      redirect_uri: registeredRedirectUrl,
      state,
      client_id: clientId,
      response_type: 'code',
      request: signature,
      scope,
    })}`;
  return uri;
};

const accountRequestAuthoriseConsent = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const sessionId = req.headers['authorization'];
    const { authorisationServerId } = req.body;
    const fapiFinancialId = req.headers['x-fapi-financial-id'];
    debug(`authorisationServerId: ${authorisationServerId}`);
    const requestId = await setupAccountRequest(authorisationServerId, fapiFinancialId);

    const uri = await generateRedirectUri(authorisationServerId, requestId, 'openid accounts', sessionId);

    debug(`authorize URL is: ${uri}`);
    return res.send(200, { uri }); // We can't intercept a 302 !
  } catch (err) {
    error(err);
    const status = err.status ? err.status : 500;
    return res.status(status).send({ message: err.message });
  }
};

exports.statePayload = statePayload;
exports.accountRequestAuthoriseConsent = accountRequestAuthoriseConsent;
