const { setupAccountRequest } = require('./setup-account-request');
const { deleteRequest } = require('./delete-account-request');
const { generateRedirectUri } = require('../authorise');
const { extractHeaders } = require('../session');

const uuidv4 = require('uuid/v4');
const error = require('debug')('error');
const debug = require('debug')('debug');

const accountRequestAuthoriseConsent = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const { authorisationServerId, headers } = await extractHeaders(req.headers);
    const accountRequestId = await setupAccountRequest(authorisationServerId, headers);
    const interactionId2 = uuidv4();
    const uri = await generateRedirectUri(authorisationServerId, accountRequestId, 'openid accounts', headers.sessionId, interactionId2);

    debug(`authorize URL is: ${uri}`);
    return res.status(200).send({ uri }); // We can't intercept a 302 !
  } catch (err) {
    error(err);
    const status = err.status ? err.status : 500;
    return res.status(status).send({ message: err.message });
  }
};

const accountRequestRevokeConsent = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const { authorisationServerId, headers } = await extractHeaders(req.headers);
    const status = await deleteRequest(headers.username, authorisationServerId, headers);
    return res.sendStatus(status);
  } catch (err) {
    return res.sendStatus(400);
  }
};

exports.accountRequestAuthoriseConsent = accountRequestAuthoriseConsent;
exports.accountRequestRevokeConsent = accountRequestRevokeConsent;
