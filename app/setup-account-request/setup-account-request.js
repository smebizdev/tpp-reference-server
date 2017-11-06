const { postToken } = require('../obtain-access-token');
const env = require('env-var');

const authServer = env.get('ASPSP_AUTH_SERVER').asString();
const authServerClientId = env.get('ASPSP_AUTH_SERVER_CLIENT_ID').asString();
const authServerClientSecret = env.get('ASPSP_AUTH_SERVER_CLIENT_SECRET').asString();

// Todo: lookup auth server via Directory and OpenIdEndpoint responses.
const authorisationServerHost = async authServerId => (authServerId ? authServer : null);

// Todo: retrieve clientCredentials from store keyed by authorisationServerId.
// eslint-disable-next-line arrow-parens
const clientCredentials = async authorisationServerId => {
  const credentials = {
    clientId: authServerClientId,
    clientSecret: authServerClientSecret,
  };
  return authorisationServerId ? credentials : null;
};

// eslint-disable-next-line arrow-parens
const setupAccountRequest = async authorisationServerId => {
  if (!authorisationServerId) {
    const error = new Error('authorisationServerId missing from request payload');
    error.status = 400;
    throw error;
  }
  const authorizationServerHost = await authorisationServerHost(authorisationServerId);
  const { clientId, clientSecret } = await clientCredentials(authorisationServerId);
  const accessTokenPayload = {
    scope: 'accounts',
    grant_type: 'client_credentials',
  };

  const response = await postToken(
    authorizationServerHost,
    clientId,
    clientSecret,
    accessTokenPayload,
  );
  const accessToken = response.access_token;
  return accessToken;
};

exports.setupAccountRequest = setupAccountRequest;
