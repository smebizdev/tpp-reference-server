const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const { checkErrorThrown } = require('../utils');
const { setupAccountRequest } = require('../../app/setup-account-request'); // eslint-disable-line

const authorisationServerId = 'testAuthorisationServerId';
const fapiFinancialId = 'testFinancialId';

describe('setupAccountRequest called with blank authorisationServerId', () => {
  it('throws error with 400 status set', async () => {
    await checkErrorThrown(
      async () => setupAccountRequest(null, fapiFinancialId),
      400, 'authorisationServerId missing from request payload',
    );
  });
});

describe('setupAccountRequest called with blank fapiFinancialId', () => {
  it('throws error with 400 status set', async () => {
    await checkErrorThrown(
      async () => setupAccountRequest(authorisationServerId, null),
      400, 'fapiFinancialId missing from request payload',
    );
  });
});

describe('setupAccountRequest called with authorisationServerId and fapiFinancialId', () => {
  const accessToken = 'access-token';
  const resourceServer = 'http://resource-server.com';
  const clientId = 'id';
  const clientSecret = 'secret';
  const tokenPayload = {
    scope: 'accounts payments',
    grant_type: 'client_credentials',
  };
  const accountRequestId = '88379';
  let setupAccountRequestProxy;
  let makeRequestProxy;
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
    makeRequestProxy = proxyquire('../../app/setup-request/setup-request', {
      '../obtain-access-token': { postToken: tokenStub },
      '../authorisation-servers': {
        getClientCredentials: getClientCredentialsStub,
        resourceServerHost: resourceServerHostStub,
      },
    }).makeRequest;
    setupAccountRequestProxy = proxyquire('../../app/setup-account-request/setup-account-request', {
      '../setup-request': { makeRequest: makeRequestProxy },
      './account-requests': { postAccountRequests: accountRequestsStub },
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
      await checkErrorThrown(
        async () => setupAccountRequestProxy(authorisationServerId, fapiFinancialId),
        500, 'Account request response status: "Rejected"',
      );
    });
  });

  describe('when Revoked', () => {
    before(setup('Revoked'));

    it('throws error for now', async () => {
      await checkErrorThrown(
        async () => setupAccountRequestProxy(authorisationServerId, fapiFinancialId),
        500, 'Account request response status: "Revoked"',
      );
    });
  });

  describe('when AccountRequestId not found in payload', () => {
    before(setup(null));

    it('throws error', async () => {
      await checkErrorThrown(
        async () => setupAccountRequestProxy(authorisationServerId, fapiFinancialId),
        500, 'Account request response missing payload',
      );
    });
  });
});
