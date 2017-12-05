
const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const { setupPayment } = require('../../app/setup-account-request'); // eslint-disable-line

const authorisationServerId = 'testAuthorisationServerId';
const fapiFinancialId = 'testFinancialId';
const fapiInteractionId = 'interaction-1234';

const PAYMENT_SUBMISSION_ID = 'PS456';

describe('submitPayment called with authorisationServerId and fapiFinancialId', () => {
  const accessToken = 'access-token';
  const resourceServer = 'http://resource-server.com';
  const resourcePath = `${resourceServer}/open-banking/v1.1`;
  const paymentId = '88379';
  const idempotencyKey = '2023klf';
  let submitPaymentProxy;
  let accessTokenAndResourcePathProxy;
  let paymentsStub;
  let retrievePaymentDetailsStub;

  const PaymentsSubmissionResponse = () => ({
    Data: {
      PaymentSubissionId: PAYMENT_SUBMISSION_ID,
    },
  });

  const creditorAccount = {
    SchemeName: 'SortCodeAccountNumber',
    Identification: '01122313235478',
    Name: 'Mr Kevin',
    SecondaryIdentification: '002',
  };
  const instructedAmount = {
    Amount: '100.45',
    Currency: 'GBP',
  };

  const setup = () => () => {
    paymentsStub = sinon.stub().returns(PaymentsSubmissionResponse());

    accessTokenAndResourcePathProxy = sinon.stub().returns({ accessToken, resourcePath });
    retrievePaymentDetailsStub = sinon.stub().returns({
      PaymentId: paymentId,
      CreditorAccount: creditorAccount,
      InstructedAmount: instructedAmount,
    });

    submitPaymentProxy = proxyquire('../../app/setup-payment/submit-payment', {
      '../setup-request': { accessTokenAndResourcePath: accessTokenAndResourcePathProxy },
      './payments': { postPayments: paymentsStub },
      './persistence': { retrievePaymentDetails: retrievePaymentDetailsStub },
    }).submitPayment;
  };

  describe('when AcceptedTechnicalValidation', () => {
    before(setup());

    it('returns PaymentSubmissionId from postPayments call', async () => {
      const id = await submitPaymentProxy(
        authorisationServerId, fapiFinancialId,
        idempotencyKey, fapiInteractionId,
      );
      assert.equal(id, PAYMENT_SUBMISSION_ID);
      assert.ok(paymentsStub.calledWithExactly(
        resourcePath,
        '/open-banking/v1.1/payment-submissions',
        accessToken,
        {}, // headers
        {}, // opts
        {}, // risk
        creditorAccount,
        instructedAmount,
        fapiFinancialId,
        idempotencyKey,
        paymentId,
      ));
    });
  });
});
