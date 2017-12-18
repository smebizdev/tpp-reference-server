const { postToken } = require('../obtain-access-token');
const {
  getClientCredentials,
  resourceServerPath,
} = require('../authorisation-servers');

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

const accessTokenAndResourcePath = async (authorisationServerId) => {
  const accessToken = await createAccessToken(authorisationServerId);
  const resourcePath = await resourceServerPath(authorisationServerId);
  return { accessToken, resourcePath };
};

exports.accessTokenAndResourcePath = accessTokenAndResourcePath;
