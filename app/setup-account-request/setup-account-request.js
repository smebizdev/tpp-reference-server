const { accessTokenAndResourcePath, consentAccountRequestId } = require('../authorise');
const { postAccountRequests, deleteAccountRequest } = require('./account-requests');
const { session } = require('../session');

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


const deleteRequest = async (
  sessionId,
  authorisationServerId,
  fapiFinancialId,
  fapiInteractionId,
) => {
  const fail = () => {
    const error = new Error('Bad Request');
    error.status = 400;
    throw error;
  };
  const username = await session.getUsername(sessionId);
  const { accessToken, resourcePath } = await accessTokenAndResourcePath(authorisationServerId);
  const keys = { username, authorisationServerId, scope: 'accounts' };
  const accountRequestId = await consentAccountRequestId(keys);
  if (!accountRequestId) return fail();
  const responseHeaders = await deleteAccountRequest(
    resourcePath,
    accessToken,
    fapiFinancialId,
    accountRequestId,
    fapiInteractionId,
  );
  if (responseHeaders) {
    const interactionId = responseHeaders['x-fapi-interaction-id'];
    if (fapiInteractionId === interactionId) {
      return 204;
    }
    return fail();
  }
  return fail();
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
exports.deleteRequest = deleteRequest;
