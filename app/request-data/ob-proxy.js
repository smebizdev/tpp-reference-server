const request = require('superagent');
const { createRequest, obtainResult } = require('../ob-util');
const { resourceServerPath } = require('../authorisation-servers');
const { consentAccessTokenAndPermissions } = require('../authorise');
const { extractHeaders } = require('../session');
const debug = require('debug')('debug');
const error = require('debug')('error');

const accessTokenAndPermissions = async (username, authorisationServerId, scope) => {
  let accessToken;
  let permissions;
  try {
    const consentKeys = { username, authorisationServerId, scope };
    ({ accessToken, permissions } = await consentAccessTokenAndPermissions(consentKeys));
  } catch (err) {
    accessToken = null;
    permissions = null;
  }
  return { accessToken, permissions };
};

const scopeAndUrl = (req, host) => {
  const path = `/open-banking${req.path}`;
  const proxiedUrl = `${host}${path}`;
  const scope = path.split('/')[3];
  return { proxiedUrl, scope };
};

const resourceRequestHandler = async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const reqHeaders = await extractHeaders(req.headers);
    const host = await resourceServerPath(reqHeaders.authorisationServerId);
    const { proxiedUrl, scope } = scopeAndUrl(req, host);
    const { accessToken, permissions } =
      await accessTokenAndPermissions(reqHeaders.username, reqHeaders.authorisationServerId, scope);
    const headers = Object.assign({ accessToken, permissions }, reqHeaders);
    debug({
      proxiedUrl, scope, accessToken, fapiFinancialId: headers.fapiFinancialId,
    });
    const call = createRequest(request.get(proxiedUrl), headers);

    let response;
    try {
      response = await call.send();
    } catch (err) {
      error(`error getting ${proxiedUrl}: ${err.message}`);
      throw err;
    }

    const result = await obtainResult(call, response, headers);

    return res.status(response.status).json(result);
  } catch (err) {
    const status = err.response ? err.response.status : 500;
    return res.status(status).send(err.message);
  }
};

exports.resourceRequestHandler = resourceRequestHandler;
