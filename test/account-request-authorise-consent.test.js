const request = require('supertest');
const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const express = require('express');
const bodyParser = require('body-parser');

const authorisationServerId = '123';

const setupApp = (setupAccountRequestStub) => {
  const clientCredentialsStub = sinon.stub().returns({ clientId: 'testClientId' });
  const createJsonWebSignatureStub = sinon.stub().returns('testSignedPayload');
  const { accountRequestAuthoriseConsent } = proxyquire(
    '../app/account-request-authorise-consent',
    {
      './setup-account-request': {
        setupAccountRequest: setupAccountRequestStub,
        clientCredentials: clientCredentialsStub,
      },
      './authorise': {
        createJsonWebSignature: createJsonWebSignatureStub,
      },
    },
  );
  const app = express();
  app.use(bodyParser.json());
  app.post('/account-request-authorise-consent', accountRequestAuthoriseConsent);
  return app;
};

const fapiFinancialId = 'testFapiFinancialId';

describe('/account-request-authorise-consent with successful setupAccountRequest', () => {
  const setupAccountRequestStub = sinon.stub();
  const app = setupApp(setupAccountRequestStub);

  const expectedRedirectUrl =
    'http://example.com/authorize?' +
    'redirect_url=http://example.com/redirect&' +
    'state=eyJhdXRob3Jpc2F0aW9uU2VydmVySWQiOiIxMjMifQ==&' +
    'clientId=testClientId&' +
    'response_type=code&' +
    'request=testSignedPayload&' +
    'scope=openid%20accounts';

  before(() => {
    process.env.ASPSP_AUTH_SERVER = 'http://example.com';
    process.env.REGISTERED_REDIRECT_URL = 'http://example.com/redirect';
  });
  after(() => {
    process.env.ASPSP_AUTH_SERVER = null;
    process.env.REGISTERED_REDIRECT_URL = null;
  });

  it('returns 302 redirect to /authorize endpoint', (done) => {
    request(app)
      .post('/account-request-authorise-consent')
      .set('x-fapi-financial-id', fapiFinancialId)
      .send({ authorisationServerId })
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

describe('/account-request-authorise-consent with error thrown by setupAccountRequest', () => {
  const status = 403;
  const message = 'message';
  const error = new Error(message);
  error.status = status;
  const setupAccountRequestStub = sinon.stub().throws(error);
  const app = setupApp(setupAccountRequestStub);

  it('returns status from error', (done) => {
    request(app)
      .post('/account-request-authorise-consent')
      .set('x-fapi-financial-id', fapiFinancialId)
      .send({ authorisationServerId })
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
