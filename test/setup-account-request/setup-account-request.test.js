const assert = require('assert');
const env = require('env-var');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const { setupAccountRequest } = require('../../app/setup-account-request/setup-account-request'); // eslint-disable-line

const authorisationServerId = 'testAuthorisationServerId';
const fapiFinancialId = 'testFinancialId';

describe('setupAccountRequest called with blank authorisationServerId', () => {
  it('throws error with 400 status set', async () => {
    try {
      await setupAccountRequest(null, fapiFinancialId);
      assert.ok(false);
    } catch (error) {
      assert.equal(error.message, 'authorisationServerId missing from request payload');
      assert.equal(error.status, 400);
    }
  });
});

describe('setupAccountRequest called with blank fapiFinancialId', () => {
  it('throws error with 400 status set', async () => {
    try {
      await setupAccountRequest(authorisationServerId, null);
      assert.ok(false);
    } catch (error) {
      assert.equal(error.message, 'fapiFinancialId missing from request payload');
      assert.equal(error.status, 400);
    }
  });
});

describe('setupAccountRequest called with authorisationServerId and fapiFinancialId', () => {
  const accessToken = 'access-token';
  const awaitingAuthorisation = 'AwaitingAuthorisation';
  const authServerHost = 'http://example.com';
  const resourceServerPath = 'http://example.com/resources';
  const clientId = 'id';
  const clientSecret = 'secret';
  const tokenPayload = {
    scope: 'accounts',
    grant_type: 'client_credentials',
  };
  const accountRequestId = '88379';

  let setupAccountRequestProxy;
  let postTokenStub;
  let postAccountRequestsStub;
  const tokenResponse = { access_token: accessToken };
  const accountRequestsResponse = {
    Data: {
      AccountRequestId: accountRequestId,
      Status: awaitingAuthorisation,
    },
  };

  before(() => {
    postTokenStub = sinon.stub().returns(tokenResponse);
    postAccountRequestsStub = sinon.stub().returns(accountRequestsResponse);
    setupAccountRequestProxy = proxyquire('../../app/setup-account-request/setup-account-request', {
      'env-var': env.mock({
        ASPSP_AUTH_SERVER: authServerHost,
        ASPSP_AUTH_SERVER_CLIENT_ID: clientId,
        ASPSP_AUTH_SERVER_CLIENT_SECRET: clientSecret,
        ASPSP_RESOURCE_SERVER: resourceServerPath,
      }),
      '../obtain-access-token': { postToken: postTokenStub },
      './account-requests': { postAccountRequests: postAccountRequestsStub },
    }).setupAccountRequest;
  });

  it('returns access-token from postToken call', async () => {
    const token = await setupAccountRequestProxy(authorisationServerId, fapiFinancialId);
    assert.equal(token, accessToken);
    assert(postTokenStub.calledWithExactly(authServerHost, clientId, clientSecret, tokenPayload));
    assert(postAccountRequestsStub.calledWithExactly(
      resourceServerPath,
      accessToken,
      fapiFinancialId,
    ));
  });
});
