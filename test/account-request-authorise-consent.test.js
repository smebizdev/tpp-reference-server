const request = require('supertest');
const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const express = require('express');
const bodyParser = require('body-parser');
const env = require('env-var');
const qs = require('qs');

const authorisationServerId = '123';
const clientId = 'testClientId';
const clientSecret = 'testClientSecret';
const redirectUrl = 'http://example.com/redirect';
const issuer = 'http://example.com';
const jsonWebSignature = 'testSignedPayload';

const setupApp = (setupAccountRequestStub, authorisationEndpointStub) => {
  const clientCredentialsStub = sinon.stub().returns({ clientId, clientSecret });
  const createJsonWebSignatureStub = sinon.stub().returns(jsonWebSignature);
  const issuerStub = sinon.stub().returns(issuer);
  const { accountRequestAuthoriseConsent } = proxyquire(
    '../app/account-request-authorise-consent',
    {
      'env-var': env.mock({
        SOFTWARE_STATEMENT_REDIRECT_URL: redirectUrl,
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
        issuer: issuerStub,
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

  const expectedRedirectHost = 'http://example.com/authorize';
  const expectedParams = {
    client_id: clientId,
    redirect_uri: redirectUrl,
    request: jsonWebSignature,
    response_type: 'code',
    scope: 'openid accounts',
    state: 'eyJhdXRob3Jpc2F0aW9uU2VydmVySWQiOiIxMjMifQ==',
  };

  it('returns 302 redirect to /authorize endpoint', (done) => {
    doPost(app)
      .end((e, r) => {
        assert.equal(r.status, 302);
        const { location } = r.headers;
        const parts = location.split('?');
        const host = parts[0];
        const params = qs.parse(parts[1]);
        assert.equal(host, expectedRedirectHost);
        assert.deepEqual(params, expectedParams);
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
