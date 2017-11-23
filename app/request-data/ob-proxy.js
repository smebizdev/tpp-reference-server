const request = require('superagent');
const { setupMutualTLS } = require('../certs-util');
const { resourceServerHost } = require('../authorisation-servers');
const { URL } = require('url');
const { accessToken } = require('../authorise');
const debug = require('debug')('debug');
const error = require('debug')('error');

const resourceRequestHandler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const authServerId = req.headers['x-authorization-server-id'];
  const xFapiFinancialId = req.headers['x-fapi-financial-id'];
  const sessionId = req.headers.authorization;

  const path = `/open-banking${req.path}`;
  let host = await resourceServerHost(authServerId);
  host = host.split('/open-banking')[0]; // eslint-disable-line
  const proxiedUrl = new URL(path, host);
  const token = await accessToken(sessionId);
  const bearerToken = `Bearer ${token}`;

  debug(`proxiedUrl ${proxiedUrl}`);
  debug(`bearerToken ${bearerToken}`);
  debug(`xFapiFinancialId ${xFapiFinancialId}`);

  try {
    const response = await setupMutualTLS(request.get(proxiedUrl))
      .set('Authorization', bearerToken)
      .set('Accept', 'application/json')
      .set('x-fapi-financial-id', xFapiFinancialId)
      .send();
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
