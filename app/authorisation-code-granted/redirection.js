const env = require('env-var');
const { postToken } = require('../obtain-access-token');

const url = env.get('REGISTERED_REDIRECT_URL').asString();
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
    const authorisationServerId = req.query.state;
    const authorisationCode = req.query['authorization-code'];
    const authorizationServerHost = await authorisationServerHost(authorisationServerId);
    const { clientId, clientSecret } = await clientCredentials(authorisationServerId);
    const accessTokenPayload = {
      grant_type: 'authorization_code', // eslint-disable-line quote-props
      'authorization-code': authorisationCode,
      redirect_uri: url, // eslint-disable-line quote-props
    };

    await postToken(authorizationServerHost, clientId, clientSecret, accessTokenPayload);
    return res.status(204).send();
  } catch (err) {
    const status = err.status ? err.status : 500;
    return res.status(status).send({ message: err.message });
  }
};

exports.authorisationCodeGrantedUrl = url;
exports.authorisationCodeGrantedHandler = handler;
