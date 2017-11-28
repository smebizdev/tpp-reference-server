const { buildPaymentstData, postPayments } = require('../../app/setup-payments/payments');
const assert = require('assert');
const nock = require('nock');

describe('buildPaymentstData and then postPayments', () => {
  const paymentId = '44673';
  const instructionIdentification = 'ghghg';
  const endToEndIdentification = 'XXXgHTg';
  const amount = 100.45;
  const currency = 'GBP';
  const identification = '01122313235478';
  const name = 'Mr Kevin';
  const secondaryIdentification = 'Bills';
  const reference = 'Things';
  const unstructured = 'XXX';

  const opts = {
    paymentId,
    instructionIdentification,
    endToEndIdentification,
    amount,
    currency,
    identification,
    name,
    secondaryIdentification,
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
    idempotencyKey,
    fapiFinancialId,
    interactionId,
    customerIp,
    customerLastLogged,
  };

  const data = {
    PaymentId: paymentId,
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

  const expectedResponse = {
    Data: data,
    Risk: risk,
    Links: {
      self: `/open-banking/v1.1/payments/${paymentId}`,
    },
    Meta: {
      'total-pages': 1,
    },
  };

  nock(/example\.com/)
    .post('/open-banking/v1.1/payments')
    .matchHeader('authorization', `Bearer ${accessToken}`) // required
    .matchHeader('x-fapi-financial-id', fapiFinancialId) // required
    .matchHeader('x-idempotency-key', idempotencyKey) // required
    .matchHeader('x-fapi-interaction-id', interactionId)
    .matchHeader('x-fapi-customer-ip-address', customerIp)
    .matchHeader('x-fapi-customer-last-logged-time', customerLastLogged)
    .matchHeader('x-jws-signature', jwsSignature) // required in v1.1.0 ( not v1.1.1 )
    .reply(201, expectedResponse);

  it('returns a body payload of the correct shape', async () => {
    const paymentsPayload = buildPaymentstData(opts, risk);
    const expectedPayload = {
      Data: data,
      Risk: risk,
    };
    assert.deepEqual(paymentsPayload, expectedPayload);
  });

  it('returns data when 201 OK', async () => {
    const resourceServerPath = 'http://example.com/open-banking/v1.1';
    const result = await postPayments(
      resourceServerPath,
      accessToken,
      headers,
      opts,
      risk,
    );

    assert.deepEqual(result, expectedResponse);
  });
});

describe('buildPaymentstData with optionality', () => {
  const paymentId = '33776';
  const instructionIdentification = 'ttttt';
  const endToEndIdentification = 'RRR';
  const amount = 333.22;
  const currency = 'GBP';
  const identification = '01122313235478';
  const name = 'Ms Lidell';
  const secondaryIdentification = 'household';
  const reference = 'Ref2';

  const opts = {
    paymentId,
    instructionIdentification,
    endToEndIdentification,
    amount,
    currency,
    identification,
    name,
    secondaryIdentification,
    reference,
  };

  const risk = {
    foo: 'bar',
  };

  const data = {
    PaymentId: paymentId,
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
    const paymentsPayload = buildPaymentstData(opts, risk);
    const expectedPayload = {
      Data: data,
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
    const paymentsPayload = buildPaymentstData(opts, risk);
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
    const paymentsPayload = buildPaymentstData(opts, risk);
    const expectedPayload = {
      Data: data,
      Risk: risk,
    };
    assert.deepEqual(paymentsPayload, expectedPayload);
  });
});
