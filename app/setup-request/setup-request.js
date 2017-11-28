const { postToken } = require('../obtain-access-token');
const {
  getClientCredentials,
  resourceServerHost,
} = require('../authorisation-servers');

const resourceServerPath = async (authorisationServerId) => {
  if (authorisationServerId) {
    const host = await resourceServerHost(authorisationServerId);
    if (host.indexOf('/open-banking/') > 0) {
      return host;
    }
    const apiVersion = 'v1.1';
    return `${host}/open-banking/${apiVersion}`;
  }
  return null;
};

const validateParameters = (authorisationServerId, fapiFinancialId) => {
  let error;
  if (!fapiFinancialId) {
    error = new Error('fapiFinancialId missing from request payload');
    error.status = 400;
  }
  if (!authorisationServerId) {
    error = new Error('authorisationServerId missing from request payload');
    error.status = 400;
  }
  if (error) {
    throw error;
  }
};

// Returns access-token when request successful
const createAccessToken = async (authorisationServerId) => {
  const { clientId, clientSecret } = await getClientCredentials(authorisationServerId);
  const accessTokenPayload = {
    scope: 'accounts payments', // include both scopes for client credentials grant
    grant_type: 'client_credentials',
  };

  const response = await postToken(
    authorisationServerId,
    clientId,
    clientSecret,
    accessTokenPayload,
  );
  return response.access_token;
};

const makeRequest = async (authorisationServerId, fapiFinancialId, createRequestFn) => {
  validateParameters(authorisationServerId, fapiFinancialId);
  const accessToken = await createAccessToken(authorisationServerId);
  const resourcePath = await resourceServerPath(authorisationServerId);
  const requestId = await createRequestFn(
    resourcePath,
    accessToken,
    fapiFinancialId,
  );
  return requestId;
};

exports.makeRequest = makeRequest;
