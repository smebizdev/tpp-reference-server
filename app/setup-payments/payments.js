const request = require('superagent');
const { setupMutualTLS } = require('../certs-util');
const { URL } = require('url');
const log = require('debug')('log');
const debug = require('debug')('debug');
const uuidv4 = require('uuid/v4'); // Used for AccountRequestIDs
const error = require('debug')('error');

const allowedCurrencies = ['GBP', 'EUR']; // TODO - refactor out of here

// For detailed spec see
// https://openbanking.atlassian.net/wiki/spaces/WOR/pages/23266217/Payment+Initiation+API+Specification+-+v1.1.1#PaymentInitiationAPISpecification-v1.1.1-POST/paymentsrequest

const buildPaymentstData = (opts, risk, creditorAccount, instructedAmount) => {
  const {
    paymentId,
    instructionIdentification,
    endToEndIdentification,
    // amount,
    // currency,
    // identification,
    // name,
    // secondaryIdentification,
    reference,
    unstructured,
  } = opts;
  const currency = instructedAmount.Currency;

  if (allowedCurrencies.indexOf(currency) === -1) throw new Error('Disallowed currency');

  const payload = {
    Data: {
      PaymentId: paymentId,
      Initiation: {
        InstructionIdentification: instructionIdentification || uuidv4().slice(0, 34),
        EndToEndIdentification: endToEndIdentification || uuidv4().slice(0, 34),
        InstructedAmount: {
          Amount: instructedAmount.Amount,
          Currency: instructedAmount.Currency,
        },
        CreditorAccount: {
          SchemeName: creditorAccount.SchemeName,
          Identification: creditorAccount.Identification,
          Name: creditorAccount.Name,
        },
      },
    },
    Risk: risk || {},
  };

  // Optional Fields
  let remittanceInformation;
  if (reference || unstructured) {
    remittanceInformation = {};
    if (reference) remittanceInformation.Reference = reference;
    if (unstructured) remittanceInformation.Unstructured = unstructured;
  }
  if (remittanceInformation) payload.Data.Initiation.RemittanceInformation = remittanceInformation;

  return payload;
};

const postPayments = async (resourceServerPath, accessToken,
  headers, opts, risk, CreditorAccount, InstructedAmount, fapiFinancialId) => {
  try {
    const body = buildPaymentstData(opts, risk, CreditorAccount, InstructedAmount);
      const host = resourceServerPath.split('/open-banking')[0]; // eslint-disable-line

    const paymentsUri = new URL('/open-banking/v1.1/payments', host);
    log(`POST to ${paymentsUri}`);
    const payment = setupMutualTLS(request.post(paymentsUri))
      .set('authorization', `Bearer ${accessToken}`)
      .set('x-idempotency-key', uuidv4())
      .set('x-jws-signature', 'not-required-swagger-to-be-changed')
      .set('x-fapi-financial-id', fapiFinancialId)
      .set('content-type', 'application/json; charset=utf-8')
      .set('accept', 'application/json; charset=utf-8');
    if (headers.customerLastLogged) payment.set('x-fapi-customer-last-logged-time', headers.customerLastLogged);
    if (headers.customerIp) payment.set('x-fapi-customer-ip-address', headers.customerIp);
    if (headers.interactionId) payment.set('x-fapi-interaction-id', headers.interactionId);
    payment.send(body);
    const response = await payment;
    debug(`${response.status} response for ${paymentsUri}`);
    return response.body;
  } catch (err) {
    if (err.response && err.response.text) {
      error(err.response.text);
    }
    const e = new Error(err.message);
    e.status = err.response ? err.response.status : 500;
    throw e;
  }
};

exports.buildPaymentstData = buildPaymentstData;
exports.postPayments = postPayments;
