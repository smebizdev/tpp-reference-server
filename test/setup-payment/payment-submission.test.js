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

const setupApp = (submitPaymentStub) => {
  const { paymentSubmission } = proxyquire(
    '../../app/setup-payment/payment-submission.js',
    {
      './submit-payment': {
        submitPayment: submitPaymentStub,
      },
    },
  );
  const app = express();
  app.use(bodyParser.json());
  app.post('/payments/:paymentId/submissions', paymentSubmission);
  return app;
};

const fapiFinancialId = 'testFapiFinancialId';
const PAYMENT_ID = 'P123';
const PAYMENT_SUBMISSION_ID = 'PS456';

const doPost = app => request(app)
  .post(`/payments/${PAYMENT_ID}/submissions`)
  .set('x-fapi-financial-id', fapiFinancialId)
  .send();

describe('/payment-submission with successful submitPayment', () => {
  const submitPaymentStub = sinon.stub().returns(PAYMENT_SUBMISSION_ID);
  const app = setupApp(submitPaymentStub);

  // const expectedRedirectHost = 'http://example.com/authorize';
  // const expectedParams = {
  //   client_id: clientId,
  //   redirect_uri: redirectUrl,
  //   request: jsonWebSignature,
  //   response_type: 'code',
  //   scope: 'openid payments',
  //   state: 'eyJhdXRob3Jpc2F0aW9uU2VydmVySWQiOiIxMjMiLCJzY29wZSI6Im9wZW5pZCBwYXltZW50cyJ9',
  // };

  it('make payment submission and returns paymentSubmissionId', (done) => {
    doPost(app)
      .end((e, r) => {
        assert.equal(r.status, 201);
        const location = r.get('Location');

        assert.equal(location, `/payments/${PAYMENT_ID}/submissions/${PAYMENT_SUBMISSION_ID}`);
        const header = r.headers['access-control-allow-origin'];
        assert.equal(header, '*');
        done();
      });
  });
});

describe('/payment-submit with error thrown by submitPayment', () => {
  const status = 403;
  const message = 'message';
  const error = new Error(message);
  error.status = status;
  const submitPaymentStub = sinon.stub().throws(error);
  const app = setupApp(submitPaymentStub);

  it('returns status from error', (done) => {
    doPost(app)
      .end((e, r) => {
        assert.equal(r.status, status);
        assert.deepEqual(r.body, { message });
        const header = r.headers['access-control-allow-origin'];
        assert.equal(header, '*');
        done();
      });
  });
});
