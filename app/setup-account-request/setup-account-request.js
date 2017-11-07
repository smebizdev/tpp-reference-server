const { postToken } = require('../obtain-access-token');
const { postAccountRequests } = require('./account-requests');
const env = require('env-var');

const authServer = env.get('ASPSP_AUTH_SERVER').asString();
const authServerClientId = env.get('ASPSP_AUTH_SERVER_CLIENT_ID').asString();
const authServerClientSecret = env.get('ASPSP_AUTH_SERVER_CLIENT_SECRET').asString();

// Todo: lookup auth server via Directory and OpenIdEndpoint responses.
const authorisationServerHost = async authServerId => (authServerId ? authServer : null);

// Todo: lookup resource server via Directory and OpenIdEndpoint responses.
const resourceServerHost = async authorisationServerId =>
  (authorisationServerId ? env.get('ASPSP_RESOURCE_SERVER').asString() : null);

// Todo: retrieve clientCredentials from store keyed by authorisationServerId.
const clientCredentials = async (authorisationServerId) => {
  const credentials = {
    clientId: authServerClientId,
    clientSecret: authServerClientSecret,
  };
  return authorisationServerId ? credentials : null;
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

const createAccessToken = async (authorisationServerId) => {
  const authorisationServer = await authorisationServerHost(authorisationServerId);
  const { clientId, clientSecret } = await clientCredentials(authorisationServerId);
  const accessTokenPayload = {
    scope: 'accounts',
    grant_type: 'client_credentials',
  };

  const response = await postToken(
    authorisationServer,
    clientId,
    clientSecret,
    accessTokenPayload,
  );
  return response.access_token;
};

const createAccountRequest = async (authorisationServerId, accessToken, fapiFinancialId) => {
  const resourceServer = await resourceServerHost(authorisationServerId);
  return postAccountRequests(resourceServer, accessToken, fapiFinancialId);
};

const setupAccountRequest = async (authorisationServerId, fapiFinancialId) => {
  validateParameters(authorisationServerId, fapiFinancialId);
  const accessToken = await createAccessToken(authorisationServerId);
  await createAccountRequest(authorisationServerId, accessToken, fapiFinancialId);
  return accessToken;
};

exports.setupAccountRequest = setupAccountRequest;
