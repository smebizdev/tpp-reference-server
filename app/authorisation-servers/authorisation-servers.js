const error = require('debug')('error');
const { getAll, get, set } = require('../storage');
const { getOpenIdConfig } = require('./openid-config');

const ASPSP_AUTH_SERVERS_COLLECTION = 'aspspAuthorisationServers';

const sortByName = (list) => {
  list.sort((a, b) => {
    if (a.name > b.name) {
      return 1;
    } else if (a.name > b.name) {
      return -1;
    }
    return 0;
  });
  return list;
};

const transformServerData = (data) => {
  const id = data.Id;
  const logoUri = data.CustomerFriendlyLogoUri;
  const name = data.CustomerFriendlyName;
  const orgId = data.OBOrganisationId;
  return {
    id,
    logoUri,
    name,
    orgId,
  };
};

const getAuthServerConfig = async id => get(ASPSP_AUTH_SERVERS_COLLECTION, id);

const setAuthServerConfig = async (id, authServer) =>
  set(ASPSP_AUTH_SERVERS_COLLECTION, authServer, id);

const getClientCredentials = async (authServerId) => {
  const authServer = await getAuthServerConfig(authServerId);
  if (authServer && authServer.clientCredentials) {
    return authServer.clientCredentials;
  }
  const err = new Error(`clientCredentials not found for ${authServerId}`);
  err.status = 500;
  throw err;
};

const resourceServerHost = async (authServerId) => {
  const authServer = await getAuthServerConfig(authServerId);
  if (authServer && authServer.obDirectoryConfig && authServer.obDirectoryConfig.BaseApiDNSUri) {
    return authServer.obDirectoryConfig.BaseApiDNSUri;
  }
  const err = new Error(`resource server host for ${authServerId} not found`);
  err.status = 500;
  throw err;
};

const storeAuthorisationServers = async (list) => {
  await Promise.all(list.map(async (item) => {
    const id = item.Id;
    const existing = await getAuthServerConfig(id);
    const authServer = existing || {};
    authServer.obDirectoryConfig = item;
    await setAuthServerConfig(id, authServer);
  }));
};

const allAuthorisationServers = async () => {
  try {
    const list = await getAll(ASPSP_AUTH_SERVERS_COLLECTION);
    if (!list) {
      return [];
    }
    return list;
  } catch (e) {
    error(e);
    return [];
  }
};

const fetchAndStoreOpenIdConfig = async (id, openidConfigUrl) => {
  try {
    if (openidConfigUrl === 'https://redirect.openbanking.org.uk') {
      return null; // ignore
    }
    const openidConfig = await getOpenIdConfig(openidConfigUrl);
    const authServer = await getAuthServerConfig(id);
    authServer.openIdConfig = openidConfig;
    await setAuthServerConfig(id, authServer);
  } catch (err) {
    error(`Error getting ${openidConfigUrl} : ${err.message}`);
  }
  return null;
};

const updateClientCredentials = async (id, clientCredentials) => {
  const authServer = await getAuthServerConfig(id);
  if (!authServer) {
    throw new Error('Auth Server Not Found !');
  }
  authServer.clientCredentials = clientCredentials;
  await setAuthServerConfig(id, authServer);
  return true;
};

const updateOpenIdConfigs = async () => {
  try {
    const list = await allAuthorisationServers();
    const toUpdate = list.filter(item => !item.openIdConfig);

    await Promise.all(toUpdate.map(async (authServer) => {
      const openidConfigUrl = authServer.obDirectoryConfig.OpenIDConfigEndPointUri;
      await fetchAndStoreOpenIdConfig(authServer.id, openidConfigUrl);
    }));
  } catch (err) {
    error(err);
  }
};

const authorisationServersForClient = async () => {
  try {
    const allServers = await allAuthorisationServers();
    const registeredServers = allServers.filter(s => s.clientCredentials);
    const servers = registeredServers.map(s => transformServerData(s.obDirectoryConfig));
    return sortByName(servers);
  } catch (e) {
    error(e);
    return [];
  }
};

const openIdConfig = async (id) => {
  try {
    const config = await getAuthServerConfig(id);
    return (config && config.openIdConfig) ? config.openIdConfig : null;
  } catch (err) {
    error(err);
    return null;
  }
};

const authorisationEndpoint = async (id) => {
  const config = await openIdConfig(id);
  const endpoint = config ? config.authorization_endpoint : null;
  if (endpoint === null) {
    const err = new Error(`authorisation endpoint for auth server ${id} not found`);
    err.status = 500;
    throw err;
  }
  return endpoint;
};

const issuer = async (id) => {
  const config = await openIdConfig(id);
  const uri = config ? config.issuer : null;
  if (uri === null) {
    const err = new Error(`issuer for auth server ${id} not found`);
    err.status = 500;
    throw err;
  }
  return uri;
};

const tokenEndpoint = async (id) => {
  const config = await openIdConfig(id);
  const endpoint = config ? config.token_endpoint : null;
  if (endpoint === null) {
    const err = new Error(`token endpoint for auth server ${id} not found`);
    err.status = 500;
    throw err;
  }
  return endpoint;
};

exports.authorisationEndpoint = authorisationEndpoint;
exports.issuer = issuer;
exports.storeAuthorisationServers = storeAuthorisationServers;
exports.allAuthorisationServers = allAuthorisationServers;
exports.authorisationServersForClient = authorisationServersForClient;
exports.tokenEndpoint = tokenEndpoint;
exports.resourceServerHost = resourceServerHost;
exports.updateOpenIdConfigs = updateOpenIdConfigs;
exports.getClientCredentials = getClientCredentials;
exports.updateClientCredentials = updateClientCredentials;
exports.ASPSP_AUTH_SERVERS_COLLECTION = ASPSP_AUTH_SERVERS_COLLECTION;
