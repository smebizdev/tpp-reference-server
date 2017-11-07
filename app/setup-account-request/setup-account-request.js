const { postToken } = require('../obtain-access-token');

const authServer = process.env.ASPSP_AUTH_SERVER;
const authServerClientId = process.env.ASPSP_AUTH_SERVER_CLIENT_ID;
const authServerClientSecret = process.env.ASPSP_AUTH_SERVER_CLIENT_SECRET;

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
  const response = await postToken(authorizationServerHost, clientId, clientSecret);
  return response.access_token;
};

exports.setupAccountRequest = setupAccountRequest;
