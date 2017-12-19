const { accessTokenAndResourcePath } = require('../authorise');
const { postAccountRequests } = require('./account-requests');

const createRequest = async (resourcePath, accessToken, fapiFinancialId) => {
  const response = await postAccountRequests(resourcePath, accessToken, fapiFinancialId);
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

const setupAccountRequest = async (authorisationServerId, fapiFinancialId) => {
  const { accessToken, resourcePath } = await accessTokenAndResourcePath(authorisationServerId);
  const accountRequestId = await createRequest(
    resourcePath,
    accessToken,
    fapiFinancialId,
  );
  return accountRequestId;
};

exports.setupAccountRequest = setupAccountRequest;
