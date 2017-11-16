const {
  allAuthorisationServers,
  authorisationServersForClient,
  storeAuthorisationServers,
  updateOpenIdConfigs,
  getClientCredentials,
  updateClientCredentials,
} = require('./authorisation-servers');

exports.allAuthorisationServers = allAuthorisationServers;
exports.authorisationServersForClient = authorisationServersForClient;
exports.storeAuthorisationServers = storeAuthorisationServers;
exports.updateOpenIdConfigs = updateOpenIdConfigs;
exports.getClientCredentials = getClientCredentials;
exports.updateClientCredentials = updateClientCredentials;
