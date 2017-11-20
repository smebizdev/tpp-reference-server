const { postToken } = require('../obtain-access-token');
const { postAccountRequests } = require('./account-requests');
const {
  getClientCredentials,
  resourceServerHost,
} = require('../authorisation-servers');
const debug = require('debug')('debug');

const resourceServerPath = async (authorisationServerId) => {
  if (authorisationServerId) {
    const host = await resourceServerHost(authorisationServerId);
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
    scope: 'accounts',
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

// Returns accountRequestId when request successful
const createAccountRequest = async (authorisationServerId, accessToken, fapiFinancialId) => {
  const resourcePath = await resourceServerPath(authorisationServerId);
  const response = await postAccountRequests(resourcePath, accessToken, fapiFinancialId);
  if (response.Data && response.Data.Status === 'AwaitingAuthorisation') {
    debug(`account-requests response: ${JSON.stringify(response.Data)}`);
    return response.Data.AccountRequestId;
  }
  return null;
};

const setupAccountRequest = async (authorisationServerId, fapiFinancialId) => {
  validateParameters(authorisationServerId, fapiFinancialId);
  const accessToken = await createAccessToken(authorisationServerId);
  const accountRequestId = await createAccountRequest(
    authorisationServerId,
    accessToken,
    fapiFinancialId,
  );
  return accountRequestId;
};

exports.setupAccountRequest = setupAccountRequest;
