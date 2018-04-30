const request = require('superagent');
const { setupMutualTLS } = require('../ob-util');
const { resourceServerPath } = require('../authorisation-servers');
const { consentAccessTokenAndPermissions } = require('../authorise');
const { extractHeaders } = require('../session');
const { setupResponseLogging } = require('../response-logger');
const debug = require('debug')('debug');
const error = require('debug')('error');
const util = require('util');
const { validate, validateResponseOn } = require('../validator');

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

const validateRequestResponse = async (validatorApp, kafkaStream, req, res, responseBody, details) => { // eslint-disable-line
  const { statusCode, headers, body } = await validate(validatorApp, kafkaStream, req, res, details); // eslint-disable-line
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
    const { accessToken, permissions } =
      await accessTokenAndPermissions(username, authorisationServerId, scope);
    debug({ proxiedUrl, scope, accessToken, fapiFinancialId }); // eslint-disable-line
    const call = setupMutualTLS(request.get(proxiedUrl))
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Accept', 'application/json')
      .set('x-fapi-financial-id', fapiFinancialId)
      .set('x-fapi-interaction-id', interactionId);
    const details = {
      interactionId,
      sessionId,
      permissions,
      authorisationServerId,
    };
    setupResponseLogging(call, details);

    let response;
    try {
      response = await call.send();
    } catch (err) {
      error(`error getting ${proxiedUrl}: ${err.message}`);
      throw err;
    }

    let result;
    if (validateResponseOn()) {
      result =
        await validateRequestResponse(
          req.validatorApp,
          req.kafkaStream, call, response.res, response.body, details,
        );
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
