const env = require('env-var');
const { postToken } = require('./obtain-access-token');
const { getClientCredentials } = require('./authorisation-servers');
const { authorisationServerEndpoint } = require('./account-request-authorise-consent');

const redirectionUrl = env.get('SOFTWARE_STATEMENT_REDIRECT_URL').asString();

const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const { authorisationServerId, code } = req.query;
    const authorisationUrl = await authorisationServerEndpoint(authorisationServerId);
    const { clientId, clientSecret } = await getClientCredentials(authorisationServerId);
    const accessTokenPayload = {
      grant_type: 'authorization_code',
      redirect_uri: redirectionUrl,
      code,
    };

    await postToken(authorisationUrl, clientId, clientSecret, accessTokenPayload);
    return res.status(204).send();
  } catch (err) {
    const status = err.status ? err.status : 500;
    return res.status(status).send({ message: err.message });
  }
};

exports.authorisationCodeGrantedHandler = handler;
