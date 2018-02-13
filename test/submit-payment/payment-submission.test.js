const request = require('supertest');
const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const express = require('express');
const bodyParser = require('body-parser');

const fapiFinancialId = 'testFapiFinancialId';
const authServerId = 'testAuthServerId';
const username = 'testUsername';

const setupApp = (submitPaymentStub, consentAccessTokenStub) => {
  const { paymentSubmission } = proxyquire(
    '../../app/submit-payment/payment-submission.js',
    {
      './submit-payment': {
        submitPayment: submitPaymentStub,
      },
      '../authorisation-servers': {
        fapiFinancialIdFor: () => fapiFinancialId,
      },
      '../authorise': {
        consentAccessToken: consentAccessTokenStub,
      },
      '../session': {
        getUsername: () => username,
      },
    },
  );
  const app = express();
  app.use(bodyParser.json());
  app.post('/payment-submissions', paymentSubmission);
  return app;
};


const interactionId = 'testInteractionId';
const PAYMENT_SUBMISSION_ID = 'PS456';
const accessToken = 'testAccessToken';

const doPost = app => request(app)
  .post('/payment-submissions')
  .set('x-authorization-server-id', authServerId)
  .set('x-fapi-interaction-id', interactionId)
  .send();

describe('/payment-submission with successful submitPayment', () => {
  const submitPaymentStub = sinon.stub().returns(PAYMENT_SUBMISSION_ID);
  const consentAccessTokenStub = sinon.stub().returns(accessToken);
  const app = setupApp(submitPaymentStub, consentAccessTokenStub);

  it('make payment submission and returns paymentSubmissionId', (done) => {
    doPost(app)
      .end((e, r) => {
        assert.equal(r.status, 201);

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
  const consentAccessTokenStub = sinon.stub().returns(accessToken);
  const app = setupApp(submitPaymentStub, consentAccessTokenStub);

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
