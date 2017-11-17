const request = require('supertest');
const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const express = require('express');
const bodyParser = require('body-parser');
const env = require('env-var');

const authorisationServerId = '123';

const setupApp = (setupAccountRequestStub, authorisationEndpointStub) => {
  const clientCredentialsStub = sinon.stub().returns({ clientId: 'testClientId', clientSecret: 'testClientSecret' });
  const createJsonWebSignatureStub = sinon.stub().returns('testSignedPayload');
  const { accountRequestAuthoriseConsent } = proxyquire(
    '../app/account-request-authorise-consent',
    {
      'env-var': env.mock({
        SOFTWARE_STATEMENT_REDIRECT_URL: 'http://example.com/redirect',
      }),
      './setup-account-request': {
        setupAccountRequest: setupAccountRequestStub,
      },
      './authorise': {
        createJsonWebSignature: createJsonWebSignatureStub,
      },
      './authorisation-servers': {
        authorisationEndpoint: authorisationEndpointStub,
        getClientCredentials: clientCredentialsStub,
      },
    },
  );
  const app = express();
  app.use(bodyParser.json());
  app.post('/account-request-authorise-consent', accountRequestAuthoriseConsent);
  return app;
};

const fapiFinancialId = 'testFapiFinancialId';

const doPost = app => request(app)
  .post('/account-request-authorise-consent')
  .set('x-fapi-financial-id', fapiFinancialId)
  .send({ authorisationServerId });

describe('/account-request-authorise-consent with successful setupAccountRequest', () => {
  const setupAccountRequestStub = sinon.stub();
  const authorisationEndpointStub = sinon.stub().returns('http://example.com/authorize');
  const app = setupApp(setupAccountRequestStub, authorisationEndpointStub);

  const expectedRedirectUrl =
    'http://example.com/authorize?' +
    'redirect_url=http://example.com/redirect&' +
    'state=eyJhdXRob3Jpc2F0aW9uU2VydmVySWQiOiIxMjMifQ==&' +
    'clientId=testClientId&' +
    'response_type=code&' +
    'request=testSignedPayload&' +
    'scope=openid%20accounts';

  it('returns 302 redirect to /authorize endpoint', (done) => {
    doPost(app)
      .end((e, r) => {
        assert.equal(r.status, 302);
        const { location } = r.headers;
        assert.equal(location, expectedRedirectUrl);
        const header = r.headers['access-control-allow-origin'];
        assert.equal(header, '*');
        assert(setupAccountRequestStub.calledWithExactly(authorisationServerId, fapiFinancialId));
        done();
      });
  });
});

describe('/account-request-authorise-consent with no AuthorisationEndpoint found', () => {
  const setupAccountRequestStub = sinon.stub();
  const authorisationEndpointStub = sinon.stub().returns(null);
  const app = setupApp(setupAccountRequestStub, authorisationEndpointStub);

  it('returns 500', (done) => {
    doPost(app)
      .end((e, r) => {
        assert.equal(r.status, 500);
        done();
      });
  });
});

describe('/account-request-authorise-consent with error thrown by setupAccountRequest', () => {
  const status = 403;
  const message = 'message';
  const error = new Error(message);
  error.status = status;
  const setupAccountRequestStub = sinon.stub().throws(error);
  const authorisationEndpointStub = sinon.stub();
  const app = setupApp(setupAccountRequestStub, authorisationEndpointStub);

  it('returns status from error', (done) => {
    doPost(app)
      .end((e, r) => {
        assert.equal(r.status, status);
        assert.deepEqual(r.body, { message });
        const header = r.headers['access-control-allow-origin'];
        assert.equal(header, '*');
        assert(setupAccountRequestStub.calledWithExactly(authorisationServerId, fapiFinancialId));
        done();
      });
  });
});
