const { buildPaymentsData, postPayments } = require('../../app/setup-payment/payments');
const assert = require('assert');
const nock = require('nock');

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

const amount = instructedAmount.Amount;
const currency = instructedAmount.Currency;
const identification = creditorAccount.Identification;
const name = creditorAccount.Name;
const secondaryIdentification = creditorAccount.SecondaryIdentification;

const paymentId = '44673';
const paymentSubmissionId = '44673-001';

describe('buildPaymentstData and then postPayments', () => {
  const instructionIdentification = 'ghghg';
  const endToEndIdentification = 'XXXgHTg';
  const reference = 'Things';
  const unstructured = 'XXX';

  const opts = {
    instructionIdentification,
    endToEndIdentification,
    reference,
    unstructured,
  };

  const risk = {
    foo: 'bar',
  };

  const accessToken = '2YotnFZFEjr1zCsicMWpAA';
  const fapiFinancialId = 'abc';
  const idempotencyKey = 'id-key-blah';
  const interactionId = 'xyz';
  const customerIp = '10.10.0.1';
  const customerLastLogged = 'Sun, 10 Sep 2017 19:43:31 UTC';
  const jwsSignature = 'not-required-swagger-to-be-changed';

  const headers = {
    interactionId,
    customerIp,
    customerLastLogged,
  };

  const paymentData = {
    Initiation: {
      InstructionIdentification: instructionIdentification,
      EndToEndIdentification: endToEndIdentification,
      InstructedAmount: {
        Amount: amount,
        Currency: currency,
      },
      CreditorAccount: {
        SchemeName: 'SortCodeAccountNumber',
        Identification: identification,
        Name: name,
        SecondaryIdentification: secondaryIdentification,
      },
      RemittanceInformation: {
        Reference: reference,
        Unstructured: unstructured,
      },
    },
  };

  const paymentSubmissionData = Object.assign({}, paymentData);
  paymentSubmissionData.PaymentId = paymentId;

  const expectedPaymentResponse = {
    Data: {
      PaymentId: paymentId,
      Initiation: paymentData.Initiation,
    },
    Risk: risk,
    Links: {
      self: `/open-banking/v1.1/payments/${paymentId}`,
    },
    Meta: {
      'total-pages': 1,
    },
  };

  const expectedPaymentSubmissionResponse = {
    Data: {
      PaymentId: paymentId,
      PaymentSubmissionId: paymentSubmissionId,
    },
    Links: {
      self: `/open-banking/v1.1/payment-submissions/${paymentSubmissionId}`,
    },
    Meta: {},
  };


  // Request / response Mocks
  // Payment
  nock(/example\.com/)
    .post('/open-banking/v1.1/payments')
    .matchHeader('authorization', `Bearer ${accessToken}`) // required
    .matchHeader('x-fapi-financial-id', fapiFinancialId) // required
    .matchHeader('x-idempotency-key', idempotencyKey) // required
    .matchHeader('x-fapi-interaction-id', interactionId)
    .matchHeader('x-fapi-customer-ip-address', customerIp)
    .matchHeader('x-fapi-customer-last-logged-time', customerLastLogged)
    .matchHeader('x-jws-signature', jwsSignature) // required in v1.1.0 ( not v1.1.1 )
    .reply(201, expectedPaymentResponse);

  nock(/example\.com/)
    .post('/open-banking/v1.1/payment-submissions')
    .matchHeader('authorization', `Bearer ${accessToken}`) // required
    .matchHeader('x-fapi-financial-id', fapiFinancialId) // required
    .matchHeader('x-idempotency-key', idempotencyKey) // required
    .matchHeader('x-fapi-interaction-id', interactionId)
    .matchHeader('x-fapi-customer-ip-address', customerIp)
    .matchHeader('x-fapi-customer-last-logged-time', customerLastLogged)
    .matchHeader('x-jws-signature', jwsSignature) // required in v1.1.0 ( not v1.1.1 )
    .reply(201, expectedPaymentSubmissionResponse);


  describe(' For the /payments endpoint', () => {
    it('returns a body payload of the correct shape', async () => {
      const paymentsPayload = buildPaymentsData(opts, risk, creditorAccount, instructedAmount);
      const expectedPayload = {
        Data: paymentData,
        Risk: risk,
      };
      assert.deepEqual(paymentsPayload, expectedPayload);
    });

    it('returns data when 201 OK', async () => {
      const resourceServerPath = 'http://example.com/open-banking/v1.1';
      const result = await postPayments(
        resourceServerPath,
        '/open-banking/v1.1/payments',
        accessToken,
        headers,
        opts,
        risk,
        creditorAccount, instructedAmount, fapiFinancialId, idempotencyKey, null, interactionId,
      );
      assert.deepEqual(result, expectedPaymentResponse);
    });
  });

  describe(' For the /payment-submissions endpoint', () => {
    it('returns a body payload of the correct shape', async () => {
      const paymentSubmissionsPayload = buildPaymentsData(
        opts, risk,
        creditorAccount, instructedAmount, paymentId,
      );
      const expectedPayload = {
        Data: paymentSubmissionData,
        Risk: risk,
      };
      assert.deepEqual(paymentSubmissionsPayload, expectedPayload);
    });

    it('returns data when 201 OK', async () => {
      const resourceServerPath = 'http://example.com/open-banking/v1.1';
      const result = await postPayments(
        resourceServerPath,
        '/open-banking/v1.1/payment-submissions',
        accessToken,
        headers,
        opts,
        risk,
        creditorAccount,
        instructedAmount,
        fapiFinancialId,
        idempotencyKey,
        paymentId,
        interactionId,
      );
      assert.deepEqual(result, expectedPaymentSubmissionResponse);
    });
  });
});

describe('buildPaymentstData with optionality', () => {
  const instructionIdentification = 'ttttt';
  const endToEndIdentification = 'RRR';
  const reference = 'Ref2';

  const opts = {
    instructionIdentification,
    endToEndIdentification,
    reference,
  };

  const risk = {
    foo: 'bar',
  };

  const data = {
    Initiation: {
      InstructionIdentification: instructionIdentification,
      EndToEndIdentification: endToEndIdentification,
      InstructedAmount: {
        Amount: amount,
        Currency: currency,
      },
      CreditorAccount: {
        SchemeName: 'SortCodeAccountNumber',
        Identification: identification,
        Name: name,
        SecondaryIdentification: secondaryIdentification,
      },
      RemittanceInformation: {
        Reference: reference,
      },
    },
  };

  it('returns a body payload of the correct shape: with missing unstructured field', () => {
    const paymentsPayload = buildPaymentsData(opts, risk, creditorAccount, instructedAmount);
    const expectedPayload = {
      Data: {
        Initiation: data.Initiation,
      },
      Risk: risk,
    };
    assert.deepEqual(paymentsPayload, expectedPayload);
  });

  it('returns a body payload of the correct shape: with missing reference field', () => {
    opts.unstructured = 'blah';
    delete opts.reference;
    data.Initiation.RemittanceInformation = {
      Unstructured: opts.unstructured,
    };
    const paymentsPayload = buildPaymentsData(opts, risk, creditorAccount, instructedAmount);
    const expectedPayload = {
      Data: data,
      Risk: risk,
    };
    assert.deepEqual(paymentsPayload, expectedPayload);
  });

  it('returns a body payload of the correct shape: with missing reference AND unstructured fields', () => {
    delete opts.reference;
    delete opts.unstructured;
    delete data.Initiation.RemittanceInformation;
    const paymentsPayload = buildPaymentsData(opts, risk, creditorAccount, instructedAmount);
    const expectedPayload = {
      Data: data,
      Risk: risk,
    };
    assert.deepEqual(paymentsPayload, expectedPayload);
  });
});
