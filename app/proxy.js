if (!process.env.DEBUG) process.env.DEBUG = 'error,log';

const proxy = require('express-http-proxy');
const {
  caCert, clientCert, clientKey, mtlsEnabled,
} = require('./certs-util');
const { getAuthFromSession } = require('./authorization');

const { ASPSP_READWRITE_HOST } = process.env;
const xFapiFinancialId = process.env.X_FAPI_FINANCIAL_ID;
const log = require('debug')('log');
const debug = require('debug')('debug');

const proxyReqPathResolver = (request) => {
  log(request.path);
  return `/open-banking${request.path}`;
};

const proxyReqOptDecorator = (options, req) => {
  const newOptions = options;
  const sid = req.headers.authorization;
  return new Promise((resolve) => {
    getAuthFromSession(sid, (auth) => {
      newOptions.headers['authorization'] = auth;
      newOptions.headers['x-fapi-financial-id'] = xFapiFinancialId;
      if (mtlsEnabled) {
        newOptions.key = clientKey();
        newOptions.cert = clientCert;
        newOptions.ca = caCert;
      }
      debug(`  session: ${sid}`);
      debug(`  authorization: ${auth}`);
      debug(`  x-fapi-financial-id: ${xFapiFinancialId}`);
      resolve(newOptions);
    });
  });
};

// Set body to empty string to avoid this error on r/w server:
// `Error: GET /open-banking/v1.1/accounts does not allow body content`
const proxyReqBodyDecorator = (bodyContent, srcReq) => { // eslint-disable-line
  const body = '';
  return body;
};

const proxyMiddleware = proxy(ASPSP_READWRITE_HOST, {
  proxyReqPathResolver,
  proxyReqOptDecorator,
  proxyReqBodyDecorator,
  https: mtlsEnabled,
});

exports.proxyMiddleware = proxyMiddleware;
