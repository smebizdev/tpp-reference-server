const sinon = require('sinon');
const proxyquire = require('proxyquire');
const assert = require('assert');

const instructedAmount = {
  Amount: '100.45',
  Currency: 'GBP',
};

const creditorAccount = {
  SchemeName: 'SortCodeAccountNumber',
  Identification: '01122313235478',
  Name: 'Mr Kevin',
  SecondaryIdentification: '002',
};

const paymentId = '44673';
const authorisationServerId = 'ABCD';

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
      authorisationServerId, paymentId,
      creditorAccount, instructedAmount,
    );
    assert.ok(setSpy.called);
    assert.ok(setSpy.calledOnce);
    assert.equal(`${authorisationServerId}-${paymentId}`, setSpy.lastCall.args[2]);
    assert.deepEqual(
      Object.assign(
        {}, { CreditorAccount: creditorAccount },
        { InstructedAmount: instructedAmount },
      ),
      setSpy.lastCall.args[1],
    );
  });

  it('verify valid payment details retrieval', async () => {
    const { retrievePaymentDetails } = persistence;

    await retrievePaymentDetails(authorisationServerId, paymentId);
    assert.ok(getSpy.called);
    assert.ok(getSpy.calledOnce);
    assert.equal(`${authorisationServerId}-${paymentId}`, getSpy.lastCall.args[1]);
  });

  it('verify error when paymentId not provided for payment details retrieval', async () => {
    const { retrievePaymentDetails } = persistence;

    try {
      await retrievePaymentDetails(authorisationServerId, null);
    } catch (e) {
      assert.ok(e instanceof assert.AssertionError);
      assert.equal(e.message, 'Payment id not provided');
    }
    assert.ok(getSpy.notCalled);
  });
});
