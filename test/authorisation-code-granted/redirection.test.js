const assert = require('assert');
const proxyquire = require('proxyquire');
const env = require('env-var');
const httpMocks = require('node-mocks-http');
const sinon = require('sinon');

const fakeRedirectionHost = 'http://localhost:999';
const authServerHost = 'http://example.com';
const clientId = 'id';
const clientSecret = 'secret';
const authorisationServerId = '123';
const accessToken = 'access-token';
const authorisationCode = '12345_67xxx';

const tokenPayload = {
  grant_type: 'authorization_code', // eslint-disable-line quote-props
  'authorization-code': authorisationCode,
  redirect_uri: `${fakeRedirectionHost}/tpp/authorized`, // eslint-disable-line quote-props
};

describe('Authorized Code Granted Redirection', () => {
  let redirection;
  let postTokenStub;
  let request;
  let response;

  beforeEach(() => {
    postTokenStub = sinon.stub().returns({ access_token: accessToken });
    redirection = proxyquire('../../app/authorisation-code-granted/redirection.js', {
      'env-var': env.mock({
        REGISTERED_REDIRECT_HOST: fakeRedirectionHost,
        ASPSP_AUTH_SERVER: authServerHost,
        ASPSP_AUTH_SERVER_CLIENT_ID: clientId,
        ASPSP_AUTH_SERVER_CLIENT_SECRET: clientSecret,
      }),
      '../obtain-access-token': { postToken: postTokenStub },
    });

    request = httpMocks.createRequest({
      method: 'GET',
      url: '/authorized',
      query: {
        'authorization-code': authorisationCode,
        state: authorisationServerId, // eslint-disable-line quote-props
      },
    });
    response = httpMocks.createResponse();
  });

  afterEach(() => {
    postTokenStub.reset();
  });

  describe('host configured', () => {
    it('handles the redirection route', async () => {
      await redirection.authorisationCodeGrantedHandler(request, response);
      assert.equal(response.statusCode, 204);
    });

    it('calls postToken to obtain an access token', async () => {
      await redirection.authorisationCodeGrantedHandler(request, response);
      assert(postTokenStub.calledWithExactly(authServerHost, clientId, clientSecret, tokenPayload));
    });

    describe('error handling', () => {
      const status = 403;
      const message = 'message';
      const error = new Error(message);
      error.status = status;

      beforeEach(() => {
        postTokenStub = sinon.stub().throws(error);
        redirection = proxyquire('../../app/authorisation-code-granted/redirection.js', {
          'env-var': env.mock({
            REGISTERED_REDIRECT_HOST: fakeRedirectionHost,
            ASPSP_AUTH_SERVER: authServerHost,
            ASPSP_AUTH_SERVER_CLIENT_ID: clientId,
            ASPSP_AUTH_SERVER_CLIENT_SECRET: clientSecret,
          }),
          '../obtain-access-token': { postToken: postTokenStub },
        });
      });

      it('relays errors including any upstream status', async () => {
        await redirection.authorisationCodeGrantedHandler(request, response);
        assert.equal(response.statusCode, status);
        // eslint-disable-next-line no-underscore-dangle
        assert.deepEqual(response._getData(), { message });
      });
    });
  });

  describe('host missing', () => {
    it('throws an error', () => {
      try {
        redirection = proxyquire('../../app/authorisation-code-granted/redirection.js', {});
      } catch (e) {
        assert(
          e.message.match(/"REGISTERED_REDIRECT_URL" is a required variable/),
          'error message should indicate REGISTERED_REDIRECT_URL is missing',
        );
      }
    });
  });
});
