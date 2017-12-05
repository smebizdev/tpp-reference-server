const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const { checkErrorThrown } = require('../utils');
const { setupPayment } = require('../../app/setup-account-request'); // eslint-disable-line

const authorisationServerId = 'testAuthorisationServerId';
const fapiFinancialId = 'testFinancialId';

describe('setupPayment called with authorisationServerId and fapiFinancialId', () => {
  const accessToken = 'access-token';
  const resourceServer = 'http://resource-server.com';
  const resourcePath = `${resourceServer}/open-banking/v1.1`;
  const paymentId = '88379';
  const idempotencyKey = '2023klf';
  let setupPaymentProxy;
  let accessTokenAndResourcePathProxy;
  let paymentsStub;
  const PaymentsResponse = status => ({
    Data: {
      PaymentId: paymentId,
      Status: status,
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

  const setup = status => () => {
    if (status) {
      paymentsStub = sinon.stub().returns(PaymentsResponse(status));
    } else {
      paymentsStub = sinon.stub().returns({});
    }
    accessTokenAndResourcePathProxy = sinon.stub().returns({ accessToken, resourcePath });
    setupPaymentProxy = proxyquire('../../app/setup-payment/setup-payment', {
      '../setup-request': { accessTokenAndResourcePath: accessTokenAndResourcePathProxy },
      './payments': { postPayments: paymentsStub },
    }).setupPayment;
  };

  describe('when AcceptedTechnicalValidation', () => {
    before(setup('AcceptedTechnicalValidation'));

    it('returns PaymentId from postPayments call', async () => {
      const id = await setupPaymentProxy(
        authorisationServerId, fapiFinancialId,
        creditorAccount, instructedAmount, idempotencyKey,
      );
      assert.equal(id, paymentId);

      assert(paymentsStub.calledWithExactly(
        resourcePath,
        '/open-banking/v1.1/payments',
        accessToken,
        {}, // headers
        {}, // opts
        {}, // risk
        creditorAccount, instructedAmount,
        fapiFinancialId, idempotencyKey,
      ));
    });
  });

  describe('when AcceptedCustomerProfile', () => {
    before(setup('AcceptedCustomerProfile'));

    it('returns PaymentId from postPayments call', async () => {
      const id = await setupPaymentProxy(
        authorisationServerId, fapiFinancialId,
        creditorAccount, instructedAmount,
      );
      assert.equal(id, paymentId);
    });
  });

  describe('when Rejected', () => {
    before(setup('Rejected'));

    it('throws error for now', async () => {
      await checkErrorThrown(
        async () => setupPaymentProxy(authorisationServerId, fapiFinancialId, creditorAccount, instructedAmount), // eslint-disable-line
        500, 'Payment response status: "Rejected"',
      );
    });
  });

  describe('when Pending', () => {
    before(setup('Pending'));

    it('throws error for now', async () => {
      await checkErrorThrown(
        async () => setupPaymentProxy(authorisationServerId, fapiFinancialId, creditorAccount, instructedAmount), // eslint-disable-line
        500, 'Payment response status: "Pending"',
      );
    });
  });

  describe('when PaymentId not found in payload', () => {
    before(setup(null));

    it('throws error', async () => {
      await checkErrorThrown(
        async () => setupPaymentProxy(authorisationServerId, fapiFinancialId, creditorAccount, instructedAmount), // eslint-disable-line
        500, 'Payment response missing payload',
      );
    });
  });
});
