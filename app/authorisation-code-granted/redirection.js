const env = require('env-var');
const { postToken } = require('../obtain-access-token');

const redirectionUrl = `${env.get('SOFTWARE_STATEMENT_REDIRECT_URL').asString()}`;
const authServer = env.get('ASPSP_AUTH_SERVER').asString();
const authServerClientId = env.get('ASPSP_AUTH_SERVER_CLIENT_ID').asString();
const authServerClientSecret = env.get('ASPSP_AUTH_SERVER_CLIENT_SECRET').asString();

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

const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const { authorisationServerId, code } = req.query;
    const authorizationServerHost = await authorisationServerHost(authorisationServerId);
    const { clientId, clientSecret } = await clientCredentials(authorisationServerId);
    const accessTokenPayload = {
      grant_type: 'authorization_code',
      redirect_uri: redirectionUrl,
      code,
    };

    await postToken(authorizationServerHost, clientId, clientSecret, accessTokenPayload);
    return res.status(204).send();
  } catch (err) {
    const status = err.status ? err.status : 500;
    return res.status(status).send({ message: err.message });
  }
};

exports.authorisationCodeGrantedHandler = handler;
