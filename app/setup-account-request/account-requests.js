const request = require('superagent');
const { setupMutualTLS } = require('../certs-util');
const { URL } = require('url');
const log = require('debug')('log');
const debug = require('debug')('debug');

const buildAccountRequestData = () => ({
  Data: {
    Permissions: [
      'ReadAccountsDetail',
      'ReadBalances',
      'ReadBeneficiariesDetail',
      'ReadDirectDebits',
      'ReadProducts',
      'ReadStandingOrdersDetail',
      'ReadTransactionsCredits',
      'ReadTransactionsDebits',
      'ReadTransactionsDetail',
    ],
    // ExpirationDateTime: // not populated - the permissions will be open ended
    // TransactionFromDateTime: // not populated - request from the earliest available transaction
    // TransactionToDateTime: // not populated - request to the latest available transactions
  },
  Risk: {},
});

/*
 * For now only support Client Credentials Grant Type (OAuth 2.0).
 * @resourceServerPath e.g. http://example.com/open-banking/v1.1
 */
const postAccountRequests = async (resourceServerPath, accessToken,
  fapiFinancialId) => {
  try {
    const body = buildAccountRequestData();
    const host = resourceServerPath.split('/open-banking')[0]; // eslint-disable-line
    const accountRequestsUri = new URL('/open-banking/v1.1/account-requests', host);
    log(`POST to ${accountRequestsUri}`);
    const response = await setupMutualTLS(request.post(accountRequestsUri))
      .set('authorization', `Bearer ${accessToken}`)
      .set('content-type', 'application/json; charset=utf-8')
      .set('accept', 'application/json; charset=utf-8')
      .set('x-fapi-financial-id', fapiFinancialId)
      .set('x-jws-signature', 'not-required-swagger-to-be-changed')
      .send(body);
    debug(`${response.status} response for ${accountRequestsUri}`);
    return response.body;
  } catch (err) {
    const error = new Error(err.message);
    error.status = err.response ? err.response.status : 500;
    throw error;
  }
};

exports.buildAccountRequestData = buildAccountRequestData;
exports.postAccountRequests = postAccountRequests;
