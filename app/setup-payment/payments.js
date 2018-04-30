const request = require('superagent');
const { createRequest } = require('../ob-util');
const log = require('debug')('log');
const debug = require('debug')('debug');
const error = require('debug')('error');
const assert = require('assert');

const verifyHeaders = (headers) => {
  assert.ok(headers.idempotencyKey, 'idempotencyKey missing from headers');
  assert.ok(headers.sessionId, 'sessionId missing from headers');
};

/**
 * @description Dual purpose: payments and payment-submissions
 */
const postPayments = async (resourceServerPath, paymentPathEndpoint, headers, paymentData) => {
  try {
    verifyHeaders(headers);
    const paymentsUri = `${resourceServerPath}${paymentPathEndpoint}`;
    log(`POST to ${paymentsUri}`);
    const payment = createRequest(request.post(paymentsUri), headers);
    payment.send(paymentData);
    const response = await payment;
    debug(`${response.status} response for ${paymentsUri}`);

    return response.body;
  } catch (err) {
    if (err.response && err.response.text) {
      error(err.response.text);
    }
    const e = new Error(err.message);
    e.status = err.response ? err.response.status : 500;
    throw e;
  }
};

exports.postPayments = postPayments;
exports.verifyHeaders = verifyHeaders;
