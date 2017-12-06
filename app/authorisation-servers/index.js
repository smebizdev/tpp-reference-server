const {
  allAuthorisationServers,
  authorisationEndpoint,
  issuer,
  fapiFinancialIdFor,
  authorisationServersForClient,
  storeAuthorisationServers,
  tokenEndpoint,
  resourceServerHost,
  updateOpenIdConfigs,
  getClientCredentials,
  updateClientCredentials,
} = require('./authorisation-servers');

exports.allAuthorisationServers = allAuthorisationServers;
exports.authorisationServersForClient = authorisationServersForClient;
exports.authorisationEndpoint = authorisationEndpoint;
exports.issuer = issuer;
exports.fapiFinancialIdFor = fapiFinancialIdFor;
exports.storeAuthorisationServers = storeAuthorisationServers;
exports.tokenEndpoint = tokenEndpoint;
exports.resourceServerHost = resourceServerHost;
exports.updateOpenIdConfigs = updateOpenIdConfigs;
exports.getClientCredentials = getClientCredentials;
exports.updateClientCredentials = updateClientCredentials;
