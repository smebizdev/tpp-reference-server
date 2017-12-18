const { createAccessToken } = require('../authorise');
const { resourceServerPath } = require('../authorisation-servers');

const accessTokenAndResourcePath = async (authorisationServerId) => {
  const accessToken = await createAccessToken(authorisationServerId);
  const resourcePath = await resourceServerPath(authorisationServerId);
  return { accessToken, resourcePath };
};

exports.accessTokenAndResourcePath = accessTokenAndResourcePath;
