const request = require('superagent');
const { setupMutualTLS } = require('../certs-util');
const { resourceServerPath } = require('../authorisation-servers');
const { consentAccessTokenAndPermissions } = require('../authorise');
const { extractHeaders } = require('../session');
const { setupResponseLogging } = require('../response-logger');
const debug = require('debug')('debug');
const error = require('debug')('error');
const util = require('util');
const url = require('url');
const objectSize = require('object.size');
const { validate, validateResponseOn } = require('../validator');

const getRawQs = req => (
  req.qsRaw && req.qsRaw.length
    ? req.qsRaw.join('&')
    : undefined);

const getQs = req => (
  objectSize(req.qs)
    ? req.qs
    : getRawQs(req));

const reqSerializer = req => (
  {
    method: req.method,
    url: req.url,
    qs: getQs(req),
    path: req.url && url.parse(req.url).pathname,
    body: req._data, // eslint-disable-line
    headers: req.header,
  }
);

const resSerializer = res => (
  {
    statusCode: res.statusCode,
    headers: res.headers,
    body: objectSize(res.body) ? res.body : res.text,
  }
);

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
  const bearerToken = `Bearer ${accessToken}`;
  return { bearerToken, permissions };
};

const scopeAndUrl = (req, host) => {
  const path = `/open-banking${req.path}`;
  const proxiedUrl = `${host}${path}`;
  const scope = path.split('/')[3];
  return { proxiedUrl, scope };
};

const validateRequestResponse = (validatorApp, req, res, responseBody) => {
  const theReq = reqSerializer(req);
  const theRes = resSerializer(res);
  const { statusCode, headers, body } = validate(validatorApp, theReq, theRes);
  debug(`validationResponse: ${util.inspect({ statusCode, headers, body })}`);
  const failedValidation = body.failedValidation || false;
  return Object.assign(responseBody, { failedValidation });
};

const resourceRequestHandler = async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const {
      interactionId, fapiFinancialId, sessionId, username, authorisationServerId,
    } = await extractHeaders(req.headers);
    const host = await resourceServerPath(authorisationServerId);
    const { proxiedUrl, scope } = scopeAndUrl(req, host);
    const { bearerToken, permissions } =
      await accessTokenAndPermissions(username, authorisationServerId, scope);
    debug({ proxiedUrl, scope, bearerToken, fapiFinancialId }); // eslint-disable-line
    const call = setupMutualTLS(request.get(proxiedUrl))
      .set('Authorization', bearerToken)
      .set('Accept', 'application/json')
      .set('x-fapi-financial-id', fapiFinancialId)
      .set('x-fapi-interaction-id', interactionId);
    setupResponseLogging(call, {
      interactionId,
      sessionId,
      permissions,
      authorisationServerId,
    });

    let response;
    try {
      response = await call.send();
    } catch (err) {
      error(`error getting ${proxiedUrl}: ${err.message}`);
      throw err;
    }

    let result;
    if (validateResponseOn()) {
      result = validateRequestResponse(req.validatorApp, call, response.res, response.body);
    } else {
      result = response.body;
    }
    return res.status(response.status).json(result);
  } catch (err) {
    const status = err.response ? err.response.status : 500;
    return res.status(status).send(err.message);
  }
};

exports.resourceRequestHandler = resourceRequestHandler;
