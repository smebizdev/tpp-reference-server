const { submitPayment } = require('./submit-payment');
const { consentAccessToken } = require('../authorise');
const { fapiFinancialIdFor } = require('../authorisation-servers');
const { getUsername } = require('../session');
const uuidv4 = require('uuid/v4');
const error = require('debug')('error');
const debug = require('debug')('debug');

const paymentSubmission = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const authorisationServerId = req.headers['x-authorization-server-id'];
    const fapiFinancialId = await fapiFinancialIdFor(authorisationServerId);
    const interactionId = req.headers['x-fapi-interaction-id'];
    const idempotencyKey = uuidv4();
    const sessionId = req.headers['authorization'];
    const username = await getUsername(sessionId);
    const keys = { username, authorisationServerId, scope: 'payments' };
    const accessToken = await consentAccessToken(keys);
    const headers = {
      fapiFinancialId, idempotencyKey, interactionId, accessToken, sessionId,
    };
    const paymentSubmissionId = await submitPayment(authorisationServerId, headers);

    debug(`Payment Submission succesfully completed. Id: ${paymentSubmissionId}`);
    return res.status(201).send(); // We can't intercept a 302 !
  } catch (err) {
    error(err);
    const status = err.status ? err.status : 500;
    return res.status(status).send({ message: err.message });
  }
};

exports.paymentSubmission = paymentSubmission;
