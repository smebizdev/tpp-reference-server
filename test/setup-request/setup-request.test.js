const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const { checkErrorThrown } = require('../utils');
const { accessTokenAndResourcePath } = require('../../app/setup-request'); // eslint-disable-line

const authorisationServerId = 'testAuthorisationServerId';
const fapiFinancialId = 'testFinancialId';

describe('accessTokenAndResourcePath called with blank authorisationServerId', () => {
  it('throws error with 400 status set', async () => {
    await checkErrorThrown(
      async () => accessTokenAndResourcePath(null, fapiFinancialId),
      400, 'authorisationServerId missing from request payload',
    );
  });
});

describe('accessTokenAndResourcePath called with blank fapiFinancialId', () => {
  it('throws error with 400 status set', async () => {
    await checkErrorThrown(
      async () => accessTokenAndResourcePath(authorisationServerId, null),
      400, 'fapiFinancialId missing from request payload',
    );
  });
});

describe('accessTokenAndResourcePath called with valid parameters', () => {
  const token = 'access-token';
  const resourceServer = 'http://resource-server.com';
  const clientId = 'testClientId';
  const clientSecret = 'testClientSecret';
  const tokenPayload = {
    scope: 'accounts payments',
    grant_type: 'client_credentials',
  };
  const tokenResponse = { access_token: token };
  const tokenStub = sinon.stub().returns(tokenResponse);
  const getClientCredentialsStub = sinon.stub().returns({ clientId, clientSecret });
  const resourceServerHostStub = sinon.stub().returns(resourceServer);
  const accessTokenAndResourcePathProxy = proxyquire('../../app/setup-request/setup-request', {
    '../obtain-access-token': { postToken: tokenStub },
    '../authorisation-servers': {
      getClientCredentials: getClientCredentialsStub,
      resourceServerHost: resourceServerHostStub,
    },
  }).accessTokenAndResourcePath;

  it('returns accessToken and resourcePath', async () => {
    const { accessToken, resourcePath } =
      await accessTokenAndResourcePathProxy(authorisationServerId, fapiFinancialId);
    assert(tokenStub.calledWithExactly(
      authorisationServerId,
      clientId, clientSecret, tokenPayload,
    ), 'postToken called correctly');

    assert.equal(resourcePath, `${resourceServer}/open-banking/v1.1`);
    assert.equal(accessToken, token);
  });
});
