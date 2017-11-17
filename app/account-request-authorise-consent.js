const { setupAccountRequest } = require('./setup-account-request');
const { createClaims, createJsonWebSignature } = require('./authorise');
const { authorisationEndpoint, getClientCredentials } = require('./authorisation-servers');
const error = require('debug')('error');
const debug = require('debug')('debug');
const env = require('env-var');

const registeredRedirectUrl = env.get('SOFTWARE_STATEMENT_REDIRECT_URL').asString();

const statePayload = (authorisationServerId, sessionId) => {
  const state = {
    authorisationServerId,
    sessionId,
  };
  return Buffer.from(JSON.stringify(state)).toString('base64');
};

const accountRequestAuthoriseConsent = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const sessionId = req.headers['authorization'];
    const { authorisationServerId } = req.body;
    const fapiFinancialId = req.headers['x-fapi-financial-id'];
    debug(`authorisationServerId: ${authorisationServerId}`);
    const accountRequestId = await setupAccountRequest(authorisationServerId, fapiFinancialId);
    const { clientId } = await getClientCredentials(authorisationServerId);

    const state = statePayload(authorisationServerId, sessionId);
    const scope = 'openid accounts';
    const authServerEndpoint = await authorisationEndpoint(authorisationServerId);
    const payload = createClaims(
      scope, accountRequestId, clientId, authServerEndpoint,
      registeredRedirectUrl, state, createClaims,
    );
    const signature = createJsonWebSignature(payload);
    const uri =
      `${authServerEndpoint}?` +
      `redirect_url=${registeredRedirectUrl}&` +
      `state=${state}&` +
      `clientId=${clientId}&` +
      'response_type=code&' +
      `request=${signature}&` +
      `scope=${scope}`;

    return res.redirect(302, uri);
  } catch (err) {
    error(err);
    const status = err.status ? err.status : 500;
    return res.status(status).send({ message: err.message });
  }
};

exports.statePayload = statePayload;
exports.accountRequestAuthoriseConsent = accountRequestAuthoriseConsent;
