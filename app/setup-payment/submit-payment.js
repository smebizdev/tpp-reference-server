const { accessTokenAndResourcePath } = require('../setup-request');
const { postPayments } = require('./payments');
const { retrievePaymentDetails } = require('./persistence');

const PAYMENT_SUBMISSION_ENDPOINT_URL = '/open-banking/v1.1/payment-submissions';

const makePayment = async (
  resourcePath,
  accessToken,
  fapiFinancialId,
  fapiInteractionId,
  idempotencyKey,
  paymentData,
) => {
  const headers = {
    accessToken,
    fapiFinancialId,
    fapiInteractionId,
    idempotencyKey,
  };

  const response = await postPayments(
    resourcePath,
    PAYMENT_SUBMISSION_ENDPOINT_URL,
    headers,
    paymentData,
  );

  if (response && response.Data && response.Data.Status !== 'Rejected') {
    return response.Data.PaymentSubissionId;
  }
  const error = new Error('Payment failed');
  error.status = 500;
  throw error;
};

const submitPayment = async (authorisationServerId,
  fapiFinancialId, idempotencyKey, fapiInteractionId) => {
  const { accessToken, resourcePath } = await accessTokenAndResourcePath(authorisationServerId);
  const paymentData = await retrievePaymentDetails(fapiInteractionId);

  const response = await makePayment(
    resourcePath,
    accessToken,
    fapiFinancialId,
    fapiInteractionId,
    idempotencyKey,
    paymentData,
  );

  return response;
};

exports.submitPayment = submitPayment;
