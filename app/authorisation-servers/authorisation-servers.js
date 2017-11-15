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
  const { id } = data;
  const logoUri = data.CustomerFriendlyLogoUri;
  const name = data.CustomerFriendlyName;
  const { orgId } = data;
  return {
    id,
    logoUri,
    name,
    orgId,
  };
};

const getAuthServerConfig = async id => get(ASPSP_AUTH_SERVERS_COLLECTION, id);

const setAuthServerConfig = async (id, authServer) => set(ASPSP_AUTH_SERVERS_COLLECTION, authServer, id);

const storeAuthorisationServers = async (list) => {
  await Promise.all(list.map(async (item) => {
    const id = `${item.orgId}-${item.BaseApiDNSUri}`;
    const existing = await getAuthServerConfig(id);
    const authServer = existing || {};
    item.id = id; // eslint-disable-line
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
    const openidConfig = await getOpenIdConfig(openidConfigUrl);
    const authServer = await getAuthServerConfig(id);
    authServer.openIdConfig = openidConfig;
    await setAuthServerConfig(id, authServer);
  } catch (err) {
    error(err);
  }
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
    const list = await allAuthorisationServers();
    const servers = list.map(a => transformServerData(a.obDirectoryConfig));
    return sortByName(servers);
  } catch (e) {
    error(e);
    return [];
  }
};

exports.storeAuthorisationServers = storeAuthorisationServers;
exports.allAuthorisationServers = allAuthorisationServers;
exports.authorisationServersForClient = authorisationServersForClient;
exports.updateOpenIdConfigs = updateOpenIdConfigs;
exports.updateClientCredentials = updateClientCredentials;
exports.ASPSP_AUTH_SERVERS_COLLECTION = ASPSP_AUTH_SERVERS_COLLECTION;
