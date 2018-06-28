const assert = require('assert');
const { setupResponseLogging } = require('./response-logger');
const { validate, validateResponseOn } = require('./validator');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0; // To enable use of self signed certs

const APPLICATION_JSON = 'application/json; charset=utf-8';

const mtlsEnabled = process.env.MTLS_ENABLED === 'true';
const ca = Buffer.from(process.env.OB_ISSUING_CA || '', 'base64').toString();
const cert = Buffer.from(process.env.TRANSPORT_CERT || '', 'base64').toString();
const key = () => Buffer.from(process.env.TRANSPORT_KEY || '', 'base64').toString();

const setupMutualTLS = agent => (mtlsEnabled ? agent.key(key()).cert(cert).ca(cert) : agent);

const setOptionalHeader = (header, value, requestObj) => {
  if (value) requestObj.set(header, value);
};

const setHeaders = (requestObj, headers) => {
  requestObj
    .set('authorization', `Bearer ${headers.accessToken}`)
    .set('content-type', APPLICATION_JSON)
    .set('accept', APPLICATION_JSON)
    .set('x-fapi-interaction-id', headers.interactionId)
    .set('x-fapi-financial-id', headers.fapiFinancialId);

  setOptionalHeader('x-idempotency-key', headers.idempotencyKey, requestObj);
  setOptionalHeader('x-fapi-customer-last-logged-time', headers.customerLastLogged, requestObj);
  setOptionalHeader('x-fapi-customer-ip-address', headers.customerIp, requestObj);
  setOptionalHeader('x-jws-signature', headers.jwsSignature, requestObj);
  setOptionalHeader('x-validation-run-id', headers.validationRunId, requestObj);
  return requestObj;
};

const verifyHeaders = (headers) => {
  assert.ok(headers.accessToken, 'accessToken missing from headers');
  assert.ok(headers.fapiFinancialId, 'fapiFinancialId missing from headers');
  assert.ok(headers.interactionId, 'interactionId missing from headers');
};

const createRequest = (requestObj, headers) => {
  verifyHeaders(headers);
  const req = setHeaders(setupMutualTLS(requestObj), headers);
  const {
    interactionId,
    sessionId,
    authorisationServerId,
    validationRunId,
  } = headers;
  setupResponseLogging(req, {
    validationRunId,
    interactionId,
    sessionId,
    authorisationServerId,
  });
  return req;
};

const validateRequestResponse = async (req, res, responseBody, details) => {
  const { failedValidation } = await validate(req, res, details);
  return Object.assign(responseBody, { failedValidation });
};

const obtainResult = async (call, response, headers) => {
  let result;
  if (validateResponseOn()) {
    result =
      await validateRequestResponse(call, response.res, response.body, {
        interactionId: headers.interactionId,
        sessionId: headers.sessionId,
        permissions: headers.permissions,
        authorisationServerId: headers.authorisationServerId,
        validationRunId: headers.validationRunId,
        scope: headers.scope,
      });
  } else {
    result = response.body;
  }
  return result;
};

exports.setupMutualTLS = setupMutualTLS;
exports.createRequest = createRequest;
exports.obtainResult = obtainResult;
exports.caCert = ca;
exports.clientCert = cert;
exports.clientKey = key;
exports.mtlsEnabled = mtlsEnabled;
exports.validateRequestResponse = validateRequestResponse;
