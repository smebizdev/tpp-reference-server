const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const { checkErrorThrown } = require('../utils');
const { makeRequest } = require('../../app/setup-request'); // eslint-disable-line

const authorisationServerId = 'testAuthorisationServerId';
const fapiFinancialId = 'testFinancialId';
const requestId = 'testRequestId';
const createRequestFn = sinon.stub().returns(requestId);

describe('makeRequest called with blank authorisationServerId', () => {
  it('throws error with 400 status set', async () => {
    await checkErrorThrown(
      async () => makeRequest(null, fapiFinancialId, createRequestFn),
      400, 'authorisationServerId missing from request payload',
    );
  });
});

describe('makeRequest called with blank fapiFinancialId', () => {
  it('throws error with 400 status set', async () => {
    await checkErrorThrown(
      async () => makeRequest(authorisationServerId, null, createRequestFn),
      400, 'fapiFinancialId missing from request payload',
    );
  });
});

describe('makeRequest called with valid parameters', () => {
  const accessToken = 'access-token';
  const resourceServer = 'http://resource-server.com';
  const clientId = 'testClientId';
  const clientSecret = 'testClientSecret';
  const tokenPayload = {
    scope: 'accounts payments',
    grant_type: 'client_credentials',
  };
  const tokenResponse = { access_token: accessToken };
  const tokenStub = sinon.stub().returns(tokenResponse);
  const getClientCredentialsStub = sinon.stub().returns({ clientId, clientSecret });
  const resourceServerHostStub = sinon.stub().returns(resourceServer);
  const makeRequestProxy = proxyquire('../../app/setup-request/setup-request', {
    '../obtain-access-token': { postToken: tokenStub },
    '../authorisation-servers': {
      getClientCredentials: getClientCredentialsStub,
      resourceServerHost: resourceServerHostStub,
    },
  }).makeRequest;

  it('calls createRequest function with token and resource path returning requestId', async () => {
    const id = await makeRequestProxy(authorisationServerId, fapiFinancialId, createRequestFn);
    assert(tokenStub.calledWithExactly(
      authorisationServerId,
      clientId, clientSecret, tokenPayload,
    ), 'postToken called correctly');

    assert(createRequestFn.calledWithExactly(
      `${resourceServer}/open-banking/v1.1`,
      accessToken,
      fapiFinancialId,
    ), 'createRequestFn called correctly');

    assert.equal(id, requestId);
  });
});
