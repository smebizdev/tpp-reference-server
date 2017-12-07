
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
  const PaymentId = '88379';
  const idempotencyKey = '2023klf';
  const idempotencyKey2 = 'ee15fea57';
  let submitPaymentProxy;
  let submitPaymentProxy2;
  let accessTokenAndResourcePathProxy;
  let paymentsSuccessStub;
  let paymentsRejectedStub;
  let retrievePaymentDetailsStub;
  let retrievePaymentRejectStub;

  const PaymentsSubmissionSuccessResponse = () => ({
    Data: {
      PaymentSubissionId: PAYMENT_SUBMISSION_ID,
      Status: 'AcceptedSettlementInProcess',
    },
  });

  const PaymentsSubmissionRejectedResponse = () => ({
    Data: {
      PaymentSubissionId: PAYMENT_SUBMISSION_ID,
      Status: 'Rejected',
    },
  });

  const CreditorAccount = {
    SchemeName: 'SortCodeAccountNumber',
    Identification: '01122313235478',
    Name: 'Mr Kevin',
    SecondaryIdentification: '002',
  };
  const InstructedAmount = {
    Amount: '100.45',
    Currency: 'GBP',
  };

  const setupForSuccess = () => () => {
    paymentsSuccessStub = sinon.stub().returns(PaymentsSubmissionSuccessResponse());
    accessTokenAndResourcePathProxy = sinon.stub().returns({ accessToken, resourcePath });
    retrievePaymentDetailsStub = sinon.stub().returns({
      PaymentId,
      CreditorAccount,
      InstructedAmount,
    });

    submitPaymentProxy = proxyquire('../../app/setup-payment/submit-payment', {
      '../setup-request': { accessTokenAndResourcePath: accessTokenAndResourcePathProxy },
      './payments': { postPayments: paymentsSuccessStub },
      './persistence': { retrievePaymentDetails: retrievePaymentDetailsStub },
    }).submitPayment;
  };

  describe('When Submitted Payment is in status AcceptedSettlementInProcess', () => {
    before(setupForSuccess());

    it('Returns PaymentSubmissionId from postPayments call', async () => {
      const id = await submitPaymentProxy(
        authorisationServerId, fapiFinancialId,
        idempotencyKey, fapiInteractionId,
      );
      assert.equal(id, PAYMENT_SUBMISSION_ID);
      assert.ok(paymentsSuccessStub.calledWithExactly(
        resourcePath,
        '/open-banking/v1.1/payment-submissions',
        {
          accessToken, fapiFinancialId, idempotencyKey, fapiInteractionId,
        },
        {
          PaymentId,
          CreditorAccount,
          InstructedAmount,
        },
      ));
    });
  });


  const setupForRejected = () => () => {
    paymentsRejectedStub = sinon.stub().returns(PaymentsSubmissionRejectedResponse());
    accessTokenAndResourcePathProxy = sinon.stub().returns({ accessToken, resourcePath });
    retrievePaymentRejectStub = sinon.stub().returns({
      PaymentId: paymentId,
      CreditorAccount: creditorAccount,
      InstructedAmount: instructedAmount,
    });
    submitPaymentProxy2 = proxyquire('../../app/setup-payment/submit-payment', {
      '../setup-request': { accessTokenAndResourcePath: accessTokenAndResourcePathProxy },
      './payments': { postPayments: paymentsRejectedStub },
      './persistence': { retrievePaymentDetails: retrievePaymentRejectStub },
    }).submitPayment;
  };

  describe('When Payment Submission Rejected', () => {
    before(setupForRejected());
    it('returns an error from postPayments call', async () => {
      try {
        await submitPaymentProxy2(
          authorisationServerId, fapiFinancialId,
          idempotencyKey2, fapiInteractionId,
        );
      } catch (err) {
        assert.equal(err.status, 500);
        assert.ok(paymentsRejectedStub.calledWithExactly(
          resourcePath,
          '/open-banking/v1.1/payment-submissions',
          accessToken,
          {}, // headers
          {}, // opts
          {}, // risk
          creditorAccount,
          instructedAmount,
          fapiFinancialId,
          idempotencyKey2,
          paymentId,
        ));
      }
    });
  });
});
