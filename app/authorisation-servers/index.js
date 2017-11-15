const {
  allAuthorisationServers,
  authorisationEndpoint,
  authorisationServersForClient,
  storeAuthorisationServers,
  updateOpenIdConfigs,
  getClientCredentials,
  updateClientCredentials,
} = require('./authorisation-servers');

exports.allAuthorisationServers = allAuthorisationServers;
exports.authorisationServersForClient = authorisationServersForClient;
exports.authorisationEndpoint = authorisationEndpoint;
exports.storeAuthorisationServers = storeAuthorisationServers;
exports.updateOpenIdConfigs = updateOpenIdConfigs;
exports.getClientCredentials = getClientCredentials;
exports.updateClientCredentials = updateClientCredentials;
