const sinon = require('sinon');
const proxyquire = require('proxyquire');
const assert = require('assert');

const InstructedAmount = {
  Amount: '100.45',
  Currency: 'GBP',
};

const CreditorAccount = {
  SchemeName: 'SortCodeAccountNumber',
  Identification: '01122313235478',
  Name: 'Mr Kevin',
  SecondaryIdentification: '002',
};

const paymentId = '44673';
const paymentIdemId = 'ABCD';

describe('persist payment details and retrieve it', () => {
  let setSpy;
  let getSpy;
  let persistence;

  beforeEach(() => {
    setSpy = sinon.spy();
    getSpy = sinon.spy();
    persistence = proxyquire('../../app/setup-payment/persistence', {
      '../storage': { set: setSpy, get: getSpy },
    });
  });
  it('verify valid payment details persistence', async () => {
    const { persistPaymentDetails } = persistence;
    await persistPaymentDetails(
      paymentIdemId, paymentId,
      CreditorAccount, InstructedAmount,
    );
    assert.ok(setSpy.called);
    assert.ok(setSpy.calledOnce);
    assert.ok(setSpy.calledWithExactly('payments', { PaymentId: paymentId, CreditorAccount, InstructedAmount }, paymentIdemId));
  });

  it('verify valid payment details retrieval', async () => {
    const { retrievePaymentDetails } = persistence;

    await retrievePaymentDetails(paymentIdemId, paymentId);
    assert.ok(getSpy.called);
    assert.ok(getSpy.calledOnce);
    assert.ok(getSpy.calledWithExactly('payments', paymentIdemId));
  });

  it('verify error when paymentId not provided for payment details retrieval', async () => {
    const { retrievePaymentDetails } = persistence;

    try {
      await retrievePaymentDetails(null);
    } catch (e) {
      assert.ok(e instanceof assert.AssertionError);
    }
    assert.ok(getSpy.notCalled);
  });
});
