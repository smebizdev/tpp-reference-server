const { makeRequest } = require('../setup-request');
const { postPayments } = require('./payments');

const createRequest = async (resourcePath, accessToken, fapiFinancialId) => {
  const response = await postPayments(resourcePath, accessToken, fapiFinancialId);
  let error;
  if (response.Data) {
    const status = response.Data.Status;
    if (status === 'AwaitingAuthorisation' || status === 'Authorised') {
      if (response.Data.AccountRequestId) {
        return response.Data.AccountRequestId;
      }
    } else {
      error = new Error(`Account request response status: "${status}"`);
      error.status = 500;
      throw error;
    }
  }
  error = new Error('Account request response missing payload');
  error.status = 500;
  throw error;
};

const setupPayment = async (authorisationServerId, fapiFinancialId) => {
  const paymentId = await makeRequest(
    authorisationServerId,
    fapiFinancialId,
    createRequest,
  );
  return paymentId;
};

exports.setupPayment = setupPayment;
