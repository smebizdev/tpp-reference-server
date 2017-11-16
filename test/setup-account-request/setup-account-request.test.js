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
  const authServerHost = 'http://example.com';
  const resourceServer = 'http://example.com/resources';
  const clientId = 'id';
  const clientSecret = 'secret';
  const tokenPayload = {
    scope: 'accounts',
    grant_type: 'client_credentials',
  };
  const accountRequestId = '88379';
  const envStub = env.mock({
    ASPSP_RESOURCE_SERVER: resourceServer,
  });
  let setupAccountRequestProxy;
  let tokenStub;
  let accountRequestsStub;
  let getClientCredentialsStub;
  let authorisationServerEndpointStub;
  const tokenResponse = { access_token: accessToken };
  const accountRequestsResponse = status => ({
    Data: {
      AccountRequestId: accountRequestId,
      Status: status,
    },
  });

  const setup = status => () => {
    tokenStub = sinon.stub().returns(tokenResponse);
    accountRequestsStub = sinon.stub().returns(accountRequestsResponse(status));
    getClientCredentialsStub = sinon.stub().returns({ clientId, clientSecret });
    authorisationServerEndpointStub = sinon.stub().returns(authServerHost);
    setupAccountRequestProxy = proxyquire('../../app/setup-account-request/setup-account-request', {
      'env-var': envStub,
      '../obtain-access-token': { postToken: tokenStub },
      './account-requests': { postAccountRequests: accountRequestsStub },
      '../authorisation-servers': { getClientCredentials: getClientCredentialsStub },
      '../account-request-authorise-consent': { authorisationServerEndpoint: authorisationServerEndpointStub },
    }).setupAccountRequest;
  };

  describe('when AwaitingAuthorisation', () => {
    before(setup('AwaitingAuthorisation'));

    it('returns accountRequestId from postAccountRequests call', async () => {
      const id = await setupAccountRequestProxy(authorisationServerId, fapiFinancialId);
      assert.equal(id, accountRequestId);

      assert(tokenStub.calledWithExactly(authServerHost, clientId, clientSecret, tokenPayload));
      const resourcePath = `${resourceServer}/open-banking/v1.1`;
      assert(accountRequestsStub.calledWithExactly(resourcePath, accessToken, fapiFinancialId));
    });
  });

  describe('when Rejected', () => {
    before(setup('Rejected'));

    it('returns null', async () => {
      const id = await setupAccountRequestProxy(authorisationServerId, fapiFinancialId);
      assert.equal(id, null);
    });
  });
});
