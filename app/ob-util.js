const { setupResponseLogging } = require('./response-logger');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0; // To enable use of self signed certs

const APPLICATION_JSON = 'application/json; charset=utf-8';

const mtlsEnabled = process.env.MTLS_ENABLED === 'true';
const ca = Buffer.from(process.env.OB_ISSUING_CA || '', 'base64').toString();
const cert = Buffer.from(process.env.TRANSPORT_CERT || '', 'base64').toString();
const key = () => Buffer.from(process.env.TRANSPORT_KEY || '', 'base64').toString();

const setupMutualTLS = agent => (mtlsEnabled ? agent.key(key()).cert(cert).ca(cert) : agent);

const setHeaders = (requestObj, headers) => requestObj
  .set('authorization', `Bearer ${headers.accessToken}`)
  .set('content-type', APPLICATION_JSON)
  .set('accept', APPLICATION_JSON)
  .set('x-fapi-interaction-id', headers.interactionId)
  .set('x-fapi-financial-id', headers.fapiFinancialId);

const createRequest = (requestObj, headers) => {
  const req = setHeaders(setupMutualTLS(requestObj), headers);
  const { interactionId, sessionId, authorisationServerId } = headers;
  setupResponseLogging(req, { interactionId, sessionId, authorisationServerId });
  return req;
};

exports.setupMutualTLS = setupMutualTLS;
exports.createRequest = createRequest;
exports.caCert = ca;
exports.clientCert = cert;
exports.clientKey = key;
exports.mtlsEnabled = mtlsEnabled;
