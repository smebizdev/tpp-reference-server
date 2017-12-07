const { accessTokenAndResourcePath } = require('../setup-request');
const { postPayments } = require('./payments');
const { retrievePaymentDetails } = require('./persistence');

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
  fapiFinancialId, idempotencyKey, fapiInteractionId) => {
  const { accessToken, resourcePath } = await accessTokenAndResourcePath(authorisationServerId);
  const r =
    await retrievePaymentDetails(fapiInteractionId);

  const response = await makePayment(
    resourcePath, accessToken, fapiFinancialId,
    r.CreditorAccount, r.InstructedAmount, idempotencyKey, r.PaymentId,
  );

  return response;
};

exports.submitPayment = submitPayment;
