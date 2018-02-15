const { submitPayment } = require('./submit-payment');
const { consentAccessToken } = require('../authorise');
const { extractHeaders } = require('../session');
const uuidv4 = require('uuid/v4');
const error = require('debug')('error');
const debug = require('debug')('debug');

const paymentSubmission = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const { authorisationServerId, headers } = await extractHeaders(req.headers);
    const { username } = headers;
    const idempotencyKey = uuidv4();
    const keys = { username, authorisationServerId, scope: 'payments' };
    const accessToken = await consentAccessToken(keys);
    const headersWithToken = Object.assign(headers, { idempotencyKey, accessToken });
    const paymentSubmissionId = await submitPayment(authorisationServerId, headersWithToken);

    debug(`Payment Submission succesfully completed. Id: ${paymentSubmissionId}`);
    return res.status(201).send(); // We can't intercept a 302 !
  } catch (err) {
    error(err);
    const status = err.status ? err.status : 500;
    return res.status(status).send({ message: err.message });
  }
};

exports.paymentSubmission = paymentSubmission;
