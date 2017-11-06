const { postAccountRequests, buildAccountRequestData } = require('../../app/setup-account-request/account-requests');
const assert = require('assert');

const nock = require('nock');

describe('Setup account request POST /account-requests 201 response', () => {
  const requestBody = buildAccountRequestData();
  const accountRequestId = '88379';
  const response = {
    Data: {
      AccountRequestId: accountRequestId,
      Status: 'AwaitingAuthentication',
      CreationDateTime: (new Date()).toISOString(),
      Permissions: requestBody.Data.Permissions,
    },
    Risk: {},
    Links: {
      self: `/account-requests/${accountRequestId}`,
    },
    Meta: {
      'total-pages': 1,
    },
  };

  const accessToken = '2YotnFZFEjr1zCsicMWpAA';
  const fapiFinancialId = 'abc';
  const jwsSignature = 'sig';

  nock(/example\.com/)
    .post('/open-banking/v1.1/account-requests')
    .matchHeader('authorization', `Bearer ${accessToken}`) // required
    .matchHeader('x-fapi-financial-id', fapiFinancialId) // required
    .matchHeader('x-jws-signature', jwsSignature) // required
    // optional x-fapi-customer-last-logged-time
    // optional x-fapi-customer-ip-address
    // optional x-fapi-interaction-id
    .reply(201, response);

  it('returns data when 201 OK', async () => {
    const resourceServerPath = 'http://example.com/open-banking/v1.1';
    const result = await postAccountRequests(
      resourceServerPath,
      accessToken,
      fapiFinancialId,
      jwsSignature,
    );
    assert.deepEqual(result, response);
  });
});
