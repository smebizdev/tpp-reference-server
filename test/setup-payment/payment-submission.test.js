const request = require('supertest');
const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const express = require('express');
const bodyParser = require('body-parser');

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
  app.post('/payment-submissions', paymentSubmission);
  return app;
};

const fapiFinancialId = 'testFapiFinancialId';
const fapiInteractionId = 'testInteractionId';
const PAYMENT_SUBMISSION_ID = 'PS456';

const doPost = app => request(app)
  .post('/payment-submissions')
  .set('x-fapi-financial-id', fapiFinancialId)
  .set('x-fapi-interaction-id', fapiInteractionId)
  .send();

describe('/payment-submission with successful submitPayment', () => {
  const submitPaymentStub = sinon.stub().returns(PAYMENT_SUBMISSION_ID);
  const app = setupApp(submitPaymentStub);

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
