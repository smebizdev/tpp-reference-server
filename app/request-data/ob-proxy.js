const request = require('superagent');
const { setupMutualTLS } = require('../certs-util');
const { resourceServerPath } = require('../authorisation-servers');
const { consentAccessTokenAndPermissions } = require('../authorise');
const { extractHeaders } = require('../session');
const { setupResponseLogging } = require('../response-logger');
const debug = require('debug')('debug');
const error = require('debug')('error');

const resourceRequestHandler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { authorisationServerId, headers } = await extractHeaders(req.headers);
  const {
    interactionId, fapiFinancialId, sessionId, username,
  } = headers;
  let host;
  let accessToken;
  let permissions;
  try {
    host = await resourceServerPath(authorisationServerId);
  } catch (err) {
    const status = err.response ? err.response.status : 500;
    return res.status(status).send(err.message);
  }
  const path = `/open-banking${req.path}`;
  const proxiedUrl = `${host}${path}`;
  const scope = path.split('/')[3];
  try {
    const consentKeys = { username, authorisationServerId, scope };
    const data = await consentAccessTokenAndPermissions(consentKeys);
    accessToken = data.accessToken; // eslint-disable-line
    permissions = data.permissions; // eslint-disable-line
  } catch (err) {
    accessToken = null;
    permissions = null;
  }
  const bearerToken = `Bearer ${accessToken}`;

  debug(`proxiedUrl: ${proxiedUrl}`);
  debug(`scope: ${scope}`);
  debug(`bearerToken ${bearerToken}`);
  debug(`fapiFinancialId ${fapiFinancialId}`);

  try {
    const call = setupMutualTLS(request.get(proxiedUrl))
      .set('Authorization', bearerToken)
      .set('Accept', 'application/json')
      .set('x-fapi-financial-id', fapiFinancialId)
      .set('x-fapi-interaction-id', interactionId);
    setupResponseLogging(call, { interactionId, sessionId, permissions });
    const response = await call.send();
    debug(`response.status ${response.status}`);
    debug(`response.body ${JSON.stringify(response.body)}`);

    return res.status(response.status).json(response.body);
  } catch (err) {
    error(`error getting ${proxiedUrl}: ${err.message}`);
    const status = err.response ? err.response.status : 500;
    return res.status(status).send(err.message);
  }
};

exports.resourceRequestHandler = resourceRequestHandler;
