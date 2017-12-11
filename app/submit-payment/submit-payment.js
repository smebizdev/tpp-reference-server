const { accessTokenAndResourcePath } = require('../setup-request');
const { verifyHeaders, postPayments } = require('../setup-payment/payments');
const { retrievePaymentDetails } = require('../setup-payment/persistence');

const PAYMENT_SUBMISSION_ENDPOINT_URL = '/open-banking/v1.1/payment-submissions';

const makePayment = async (resourcePath, headers, paymentData) => {
  verifyHeaders(headers);
  const response = await postPayments(
    resourcePath,
    PAYMENT_SUBMISSION_ENDPOINT_URL,
    headers,
    paymentData,
  );

  if (response && response.Data && response.Data.Status !== 'Rejected') {
    return response.Data.PaymentSubmissionId;
  }
  const error = new Error('Payment submission failed');
  error.status = 500;
  throw error;
};

const submitPayment = async (authorisationServerId,
  fapiFinancialId, idempotencyKey, fapiInteractionId) => {
  const { accessToken, resourcePath } = await accessTokenAndResourcePath(authorisationServerId);
  const paymentData = await retrievePaymentDetails(fapiInteractionId);
  const headers = {
    accessToken,
    fapiFinancialId,
    fapiInteractionId,
    idempotencyKey,
  };
  const response = await makePayment(resourcePath, headers, paymentData);
  return response;
};

exports.submitPayment = submitPayment;
