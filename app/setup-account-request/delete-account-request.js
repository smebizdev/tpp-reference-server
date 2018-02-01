const { accessTokenAndResourcePath, consentAccountRequestId, deleteConsent } = require('../authorise');
const { deleteAccountRequest } = require('./account-requests');

const deleteRequest = async (username, authorisationServerId, headers) => {
  const { accessToken, resourcePath } = await accessTokenAndResourcePath(authorisationServerId);
  const headersWithToken = Object.assign(headers, { accessToken });
  const keys = { username, authorisationServerId, scope: 'accounts' };
  const accountRequestId = await consentAccountRequestId(keys);
  if (accountRequestId) {
    const success = await deleteAccountRequest(accountRequestId, resourcePath, headersWithToken);
    if (success) {
      await deleteConsent(keys);
      return 204;
    }
  }
  const error = new Error('Bad Request');
  error.status = 400;
  throw error;
};

exports.deleteRequest = deleteRequest;
