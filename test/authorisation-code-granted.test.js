const assert = require('assert');
const proxyquire = require('proxyquire');
const env = require('env-var');
const httpMocks = require('node-mocks-http');
const sinon = require('sinon');

const redirectionUrl = 'http://localhost:9999/tpp/authorized';
const authServerHost = 'http://example.com';
const clientId = 'id';
const clientSecret = 'secret';
const authorisationServerId = '123';
const accessToken = 'access-token';
const authorisationCode = '12345_67xxx';

const tokenPayload = {
  grant_type: 'authorization_code', // eslint-disable-line quote-props
  code: authorisationCode,
  redirect_uri: redirectionUrl, // eslint-disable-line quote-props
};

describe('Authorized Code Granted', () => {
  let redirection;
  let postTokenStub;
  let getClientCredentialsStub;
  let request;
  let response;

  beforeEach(() => {
    postTokenStub = sinon.stub().returns({ access_token: accessToken });
    getClientCredentialsStub = sinon.stub().returns({ clientId, clientSecret });
    redirection = proxyquire('../app/authorisation-code-granted.js', {
      'env-var': env.mock({
        SOFTWARE_STATEMENT_REDIRECT_URL: redirectionUrl,
        ASPSP_AUTH_SERVER: authServerHost,
      }),
      './obtain-access-token': { postToken: postTokenStub },
      './authorisation-servers': { getClientCredentials: getClientCredentialsStub },
    });

    request = httpMocks.createRequest({
      method: 'GET',
      url: '/tpp/authorized',
      query: {
        code: authorisationCode,
        authorisationServerId,
      },
    });
    response = httpMocks.createResponse();
  });

  afterEach(() => {
    postTokenStub.reset();
  });

  describe('redirect url configured', () => {
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
        getClientCredentialsStub = sinon.stub().returns({ clientId, clientSecret });
        redirection = proxyquire('../app/authorisation-code-granted.js', {
          'env-var': env.mock({
            SOFTWARE_STATEMENT_REDIRECT_URL: redirectionUrl,
            ASPSP_AUTH_SERVER: authServerHost,
          }),
          './obtain-access-token': { postToken: postTokenStub },
          './authorisation-servers': { getClientCredentials: getClientCredentialsStub },
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
});
