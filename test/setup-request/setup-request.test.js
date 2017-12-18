const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const { accessTokenAndResourcePath } = require('../../app/setup-request'); // eslint-disable-line

const authorisationServerId = 'testAuthorisationServerId';

describe('accessTokenAndResourcePath called with valid parameters', () => {
  const token = 'access-token';
  const resourceServerPath = 'http://resource-server.com/open-banking/v1.1';
  const clientId = 'testClientId';
  const clientSecret = 'testClientSecret';
  const tokenPayload = {
    scope: 'accounts payments',
    grant_type: 'client_credentials',
  };
  const tokenResponse = { access_token: token };
  const tokenStub = sinon.stub().returns(tokenResponse);
  const getClientCredentialsStub = sinon.stub().returns({ clientId, clientSecret });
  const resourceServerPathStub = sinon.stub().returns(resourceServerPath);
  const accessTokenAndResourcePathProxy = proxyquire('../../app/setup-request/setup-request', {
    '../obtain-access-token': { postToken: tokenStub },
    '../authorisation-servers': {
      getClientCredentials: getClientCredentialsStub,
      resourceServerPath: resourceServerPathStub,
    },
  }).accessTokenAndResourcePath;

  it('returns accessToken and resourcePath', async () => {
    const { accessToken, resourcePath } =
      await accessTokenAndResourcePathProxy(authorisationServerId);
    assert(tokenStub.calledWithExactly(
      authorisationServerId,
      clientId, clientSecret, tokenPayload,
    ), 'postToken called correctly');

    assert.equal(resourcePath, resourceServerPath);
    assert.equal(accessToken, token);
  });
});
