const assert = require('assert');
const env = require('env-var');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

describe('setupAccountRequest called with null authorisationServerId', () => {
  it('throws error with 400 status set', async () => {
    try {
      const {
        setupAccountRequest,
      } = require('../../app/setup-account-request/setup-account-request'); // eslint-disable-line
      await setupAccountRequest(null);
      assert.ok(false);
    } catch (error) {
      assert.equal(error.message, 'authorisationServerId missing from request payload');
      assert.equal(error.name, 'Error');
      assert.equal(error.status, 400);
    }
  });
});

describe('setupAccountRequest called with authorisationServerId', () => {
  const accessToken = 'access-token';
  const authServerHost = 'http://example.com';
  const clientId = 'id';
  const clientSecret = 'secret';
  const tokenPayload = {
    scope: 'accounts',
    grant_type: 'client_credentials',
  };

  let setupAccountRequest;
  let postTokenStub;

  before(() => {
    postTokenStub = sinon.stub().returns({ access_token: accessToken });
    // eslint-disable-next-line prefer-destructuring
    setupAccountRequest = proxyquire('../../app/setup-account-request/setup-account-request', {
      'env-var': env.mock({
        ASPSP_AUTH_SERVER: authServerHost,
        ASPSP_AUTH_SERVER_CLIENT_ID: clientId,
        ASPSP_AUTH_SERVER_CLIENT_SECRET: clientSecret,
      }),
      '../obtain-access-token': { postToken: postTokenStub },
    }).setupAccountRequest;
  });

  it('returns access-token from postToken call', async () => {
    const token = await setupAccountRequest('authorisationServerId');
    assert.equal(token, accessToken);
    assert(postTokenStub.calledWithExactly(authServerHost, clientId, clientSecret, tokenPayload));
  });
});
