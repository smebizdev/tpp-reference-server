const {
  allAuthorisationServers,
  authorisationServersForClient,
  storeAuthorisationServers,
  updateOpenIdConfigs,
  updateClientCredentials,
} = require('./authorisation-servers');

exports.allAuthorisationServers = allAuthorisationServers;
exports.authorisationServersForClient = authorisationServersForClient;
exports.storeAuthorisationServers = storeAuthorisationServers;
exports.updateOpenIdConfigs = updateOpenIdConfigs;
exports.updateClientCredentials = updateClientCredentials;
