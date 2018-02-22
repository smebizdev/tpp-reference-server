const { setupAccountRequest } = require('./setup-account-request');
const { deleteRequest } = require('./delete-account-request');
const { generateRedirectUri, setConsent } = require('../authorise');
const { extractHeaders } = require('../session');

const uuidv4 = require('uuid/v4');
const error = require('debug')('error');
const debug = require('debug')('debug');

const DefaultPermissions = [
  'ReadAccountsDetail',
  'ReadBalances',
  'ReadBeneficiariesDetail',
  'ReadDirectDebits',
  'ReadProducts',
  'ReadStandingOrdersDetail',
  'ReadTransactionsCredits',
  'ReadTransactionsDebits',
  'ReadTransactionsDetail',
];
// ExpirationDateTime: // not populated - the permissions will be open ended
// TransactionFromDateTime: // not populated - request from the earliest available transaction
// TransactionToDateTime: // not populated - request to the latest available transactions

const storePermissions = async (username, authorisationServerId, accountRequestId, permissions) => {
  const keys = { username, authorisationServerId, scope: 'accounts' };
  const accountRequest = { accountRequestId, permissions };
  await setConsent(keys, accountRequest);
};

const accountRequestAuthoriseConsent = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    // const { authorisationServerId, headers } = await extractHeaders(req.headers);
    const headers = await extractHeaders(req.headers);
    const { authorisationServerId, username, sessionId } = headers;
    const headersWithPermissions = Object.assign({ permissions: DefaultPermissions }, headers);
    // const { accountRequestId, permissions } = await setupAccountRequest( // eslint-disable-line
    //   authorisationServerId,
    //   headersWithPermissions,
    // );
    const { accountRequestId, permissions } = await setupAccountRequest(headersWithPermissions);
    const interactionId2 = uuidv4();
    const uri = await generateRedirectUri(authorisationServerId, accountRequestId, 'openid accounts', sessionId, interactionId2);

    debug(`authorize URL is: ${uri}`);
    await storePermissions(username, authorisationServerId, accountRequestId, permissions);
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
    // const { authorisationServerId, headers } = await extractHeaders(req.headers);
    const headers = await extractHeaders(req.headers);
    // const status = await deleteRequest(authorisationServerId, headers);
    const status = await deleteRequest(headers);
    return res.sendStatus(status);
  } catch (err) {
    return res.sendStatus(400);
  }
};

exports.accountRequestAuthoriseConsent = accountRequestAuthoriseConsent;
exports.accountRequestRevokeConsent = accountRequestRevokeConsent;
exports.DefaultPermissions = DefaultPermissions;
