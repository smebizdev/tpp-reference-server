const { accessTokenAndResourcePath } = require('../setup-request');
const { postPayments } = require('./payments');
const { retrievePaymentDetails } = require('./persistence');
const debug = require('debug')('debug');

const PAYMENT_SUBMISSION_ENDPOINT_URL = '/open-banking/v1.1/payment-submissions';

const makePayment = async (resourcePath, accessToken, fapiFinancialId,
  CreditorAccount, InstructedAmount, idempotencyKey, paymentId) => {
  const response = await postPayments(
    resourcePath,
    PAYMENT_SUBMISSION_ENDPOINT_URL,
    accessToken,
    {}, // headers
    {}, // opts
    {}, // risk
    CreditorAccount, InstructedAmount,
    fapiFinancialId, idempotencyKey, paymentId,
  );

  if (response && response.Data) {
    return response.Data.PaymentSubissionId;
  }
  const error = new Error('Payment failed');
  error.status = 500;
  throw error;
};

const submitPayment = async (authorisationServerId,
  fapiFinancialId, paymentId, idempotencyKey) => {
  const { accessToken, resourcePath } = await accessTokenAndResourcePath(
    authorisationServerId,
    fapiFinancialId,
  );

  const { CreditorAccount, InstructedAmount } =
    await retrievePaymentDetails(fapiFinancialId, paymentId);

  const response = await makePayment(
    resourcePath, accessToken, fapiFinancialId,
    CreditorAccount, InstructedAmount, idempotencyKey, paymentId,
  );

  return response;
};

exports.submitPayment = submitPayment;
