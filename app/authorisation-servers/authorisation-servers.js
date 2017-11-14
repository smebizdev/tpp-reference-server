// const log = require('debug')('log');
const error = require('debug')('error');
const { getAll, get, set } = require('../storage');

const AUTH_SERVER_COLLECTION = 'aspspAuthorisationServers';

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

const storeAuthorisationServers = async (list) => {
  await Promise.all(list.map(async (item) => {
    const id = `${item.orgId}-${item.BaseApiDNSUri}`;
    const existing = await get(AUTH_SERVER_COLLECTION, id);
    const authServer = existing || {};
    item.id = id; // eslint-disable-line
    authServer.obDirectoryConfig = item;
    await set(AUTH_SERVER_COLLECTION, authServer, id);
  }));
};

const allAuthorisationServers = async () => {
  try {
    const list = await getAll(AUTH_SERVER_COLLECTION);
    if (!list) {
      return [];
    }
    return list;
  } catch (e) {
    error(e);
    return [];
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
exports.AUTH_SERVER_COLLECTION = AUTH_SERVER_COLLECTION;
