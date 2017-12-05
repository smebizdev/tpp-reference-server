const { accessTokenAndResourcePath } = require('../setup-request');
const { postPayments } = require('./payments');
const { persistPaymentDetails } = require('./persistence');
const debug = require('debug')('debug');

const PAYMENT_REQUEST_ENDPOINT_URL = '/open-banking/v1.1/payments';

const createRequest = async (resourcePath, accessToken, fapiFinancialId,
  CreditorAccount, InstructedAmount, idempotencyKey) => {
  const response = await postPayments(
    resourcePath,
    PAYMENT_REQUEST_ENDPOINT_URL,
    accessToken,
    {}, // headers
    {}, // opts
    {}, // risk
    CreditorAccount, InstructedAmount,
    fapiFinancialId, idempotencyKey,
  );
  let error;
  if (response.Data) {
    const status = response.Data.Status;
    debug(`/payments repsonse Data: ${JSON.stringify(response.Data)}`);
    if (status === 'AcceptedTechnicalValidation' || status === 'AcceptedCustomerProfile') {
      if (response.Data.PaymentId) {
        return response.Data.PaymentId;
      }
    } else {
      error = new Error(`Payment response status: "${status}"`);
      error.status = 500;
      throw error;
    }
  }
  error = new Error('Payment response missing payload');
  error.status = 500;
  throw error;
};

const setupPayment = async (authorisationServerId,
  fapiFinancialId, CreditorAccount, InstructedAmount, idempotencyKey) => {
  const { accessToken, resourcePath } = await accessTokenAndResourcePath(
    authorisationServerId,
    fapiFinancialId,
  );

  const paymentId = await createRequest(
    resourcePath, accessToken, fapiFinancialId,
    CreditorAccount, InstructedAmount, idempotencyKey,
  );

  persistPaymentDetails(fapiFinancialId, paymentId, CreditorAccount, InstructedAmount);

  return paymentId;
};

exports.setupPayment = setupPayment;
