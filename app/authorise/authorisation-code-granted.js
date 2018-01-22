const env = require('env-var');
const { setTokenPayload } = require('./access-tokens');
const { postToken } = require('./obtain-access-token');
const { getClientCredentials } = require('../authorisation-servers');
const { session } = require('../session');
const debug = require('debug')('debug');

const redirectionUrl = env.get('SOFTWARE_STATEMENT_REDIRECT_URL').asString();

const handler = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const { authorisationServerId, code } = req.query;
    const { clientId, clientSecret } = await getClientCredentials(authorisationServerId);
    const accessTokenRequest = {
      grant_type: 'authorization_code',
      redirect_uri: redirectionUrl,
      code,
    };

    const tokenPayload = await postToken(
      authorisationServerId, clientId,
      clientSecret, accessTokenRequest,
    );
    const sessionId = req.headers.authorization;
    debug(`sessionId: ${sessionId}`);
    debug(`tokenPayload: ${JSON.stringify(tokenPayload)}`);

    const sessionData = JSON.parse(await session.getDataAsync(sessionId));
    debug(`sessionData.username: ${sessionData.username}`);
    await setTokenPayload(sessionData.username, tokenPayload);
    return res.status(204).send();
  } catch (err) {
    const status = err.status ? err.status : 500;
    return res.status(status).send({ message: err.message });
  }
};

exports.authorisationCodeGrantedHandler = handler;
