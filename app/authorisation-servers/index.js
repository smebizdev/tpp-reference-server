const {
  allAuthorisationServers,
  authorisationServersForClient,
  storeAuthorisationServers,
  updateOpenIdConfigs,
  getClientCredentials,
} = require('./authorisation-servers');

exports.allAuthorisationServers = allAuthorisationServers;
exports.authorisationServersForClient = authorisationServersForClient;
exports.storeAuthorisationServers = storeAuthorisationServers;
exports.updateOpenIdConfigs = updateOpenIdConfigs;
exports.getClientCredentials = getClientCredentials;
