const uuidv4 = require('uuid/v4');
const { makeRequest } = require('../setup-request');
const { postPayments } = require('../setup-payments/payments');

const createRequest = (
  CreditorAccount,
  InstructedAmount,
) => async (resourcePath, accessToken, fapiFinancialId) => {
  const idempotencyKey = uuidv4();
  const response = await postPayments(
    resourcePath,
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
    if (status) {
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
  fapiFinancialId, CreditorAccount, InstructedAmount) => {
  const paymentId = await makeRequest(
    authorisationServerId,
    fapiFinancialId,
    createRequest(CreditorAccount, InstructedAmount),
  );
  return paymentId;
};

exports.setupPayment = setupPayment;
