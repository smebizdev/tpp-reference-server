const { setupAccountRequest } = require('./setup-account-request');
const { generateRedirectUri } = require('../authorise');
const uuidv4 = require('uuid/v4');
const error = require('debug')('error');
const debug = require('debug')('debug');

const accountRequestAuthoriseConsent = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const sessionId = req.headers['authorization'];
    const { authorisationServerId } = req.body;
    const fapiFinancialId = req.headers['x-fapi-financial-id'];
    debug(`authorisationServerId: ${authorisationServerId}`);
    const accountRequestId = await setupAccountRequest(authorisationServerId, fapiFinancialId);
    const idempotencyKey = uuidv4();
    const uri = await generateRedirectUri(authorisationServerId, accountRequestId, 'openid accounts', sessionId, idempotencyKey);

    debug(`authorize URL is: ${uri}`);
    return res.status(200).send({ uri }); // We can't intercept a 302 !
  } catch (err) {
    error(err);
    const status = err.status ? err.status : 500;
    return res.status(status).send({ message: err.message });
  }
};

exports.accountRequestAuthoriseConsent = accountRequestAuthoriseConsent;
