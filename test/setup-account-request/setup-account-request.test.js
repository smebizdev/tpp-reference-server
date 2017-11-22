const assert = require('assert');
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
  const resourceServer = 'http://resource-server.com';
  const clientId = 'id';
  const clientSecret = 'secret';
  const tokenPayload = {
    scope: 'accounts',
    grant_type: 'client_credentials',
  };
  const accountRequestId = '88379';
  let setupAccountRequestProxy;
  let tokenStub;
  let accountRequestsStub;
  let getClientCredentialsStub;
  let resourceServerHostStub;
  const tokenResponse = { access_token: accessToken };
  const accountRequestsResponse = status => ({
    Data: {
      AccountRequestId: accountRequestId,
      Status: status,
    },
  });

  const setup = status => () => {
    tokenStub = sinon.stub().returns(tokenResponse);
    if (status) {
      accountRequestsStub = sinon.stub().returns(accountRequestsResponse(status));
    } else {
      accountRequestsStub = sinon.stub().returns({});
    }
    getClientCredentialsStub = sinon.stub().returns({ clientId, clientSecret });
    resourceServerHostStub = sinon.stub().returns(resourceServer);
    setupAccountRequestProxy = proxyquire('../../app/setup-account-request/setup-account-request', {
      '../obtain-access-token': { postToken: tokenStub },
      './account-requests': { postAccountRequests: accountRequestsStub },
      '../authorisation-servers': {
        getClientCredentials: getClientCredentialsStub,
        resourceServerHost: resourceServerHostStub,
      },
    }).setupAccountRequest;
  };

  describe('when AwaitingAuthorisation', () => {
    before(setup('AwaitingAuthorisation'));

    it('returns accountRequestId from postAccountRequests call', async () => {
      const id = await setupAccountRequestProxy(authorisationServerId, fapiFinancialId);
      assert.equal(id, accountRequestId);

      assert(tokenStub.calledWithExactly(
        authorisationServerId,
        clientId, clientSecret, tokenPayload,
      ));
      const resourcePath = `${resourceServer}/open-banking/v1.1`;
      assert(accountRequestsStub.calledWithExactly(resourcePath, accessToken, fapiFinancialId));
    });
  });

  describe('when Authorised', () => {
    before(setup('Authorised'));

    it('returns accountRequestId from postAccountRequests call', async () => {
      const id = await setupAccountRequestProxy(authorisationServerId, fapiFinancialId);
      assert.equal(id, accountRequestId);
    });
  });

  describe('when Rejected', () => {
    before(setup('Rejected'));

    it('throws error for now', async () => {
      try {
        await setupAccountRequestProxy(authorisationServerId, fapiFinancialId);
        assert.ok(false);
      } catch (err) {
        if (err.code && err.code === 'ERR_ASSERTION') throw err;
        assert.equal(err.message, 'account request response status: "Rejected"');
        assert.equal(err.status, 500);
      }
    });
  });

  describe('when Revoked', () => {
    before(setup('Revoked'));

    it('throws error for now', async () => {
      try {
        await setupAccountRequestProxy(authorisationServerId, fapiFinancialId);
        assert.ok(false);
      } catch (err) {
        if (err.code && err.code === 'ERR_ASSERTION') throw err;
        assert.equal(err.message, 'account request response status: "Revoked"');
        assert.equal(err.status, 500);
      }
    });
  });

  describe('when AccountRequestId not found in payload', () => {
    before(setup(null));

    it('throws error', async () => {
      try {
        await setupAccountRequestProxy(authorisationServerId, fapiFinancialId);
        assert.ok(false);
      } catch (err) {
        if (err.code && err.code === 'ERR_ASSERTION') throw err;
        assert.equal(err.message, 'Account request response missing payload');
        assert.equal(err.status, 500);
      }
    });
  });
});
