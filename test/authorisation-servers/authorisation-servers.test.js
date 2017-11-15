const assert = require('assert');
const { drop } = require('../../app/storage.js');
const { ASPSP_AUTH_SERVERS_COLLECTION } = require('../../app/authorisation-servers/authorisation-servers');
const {
  allAuthorisationServers,
  storeAuthorisationServers,
  updateOpenIdConfigs,
  updateClientCredentials,
} = require('../../app/authorisation-servers');

const nock = require('nock');

const authServerId = 'aaaj4NmBD8lQxmLh2O9FLY';
const flattenedObDirectoryAuthServerList = [
  {
    Id: authServerId,
    BaseApiDNSUri: 'http://aaa.example.com',
    CustomerFriendlyName: 'AAA Example Bank',
    OpenIDConfigEndPointUri: 'http://example.com/openidconfig',
    OBOrganisationId: 'aaa-example-org',
  },
];

const openIdConfig = {
  authorization_endpoint: 'http://auth.example.com/authorize',
  token_endpoint: 'http://auth.example.com/token',
};

const expectedAuthServerConfig = {
  id: authServerId,
  obDirectoryConfig: {
    BaseApiDNSUri: 'http://aaa.example.com',
    CustomerFriendlyName: 'AAA Example Bank',
    OpenIDConfigEndPointUri: 'http://example.com/openidconfig',
    Id: authServerId,
    OBOrganisationId: 'aaa-example-org',
  },
  openIdConfig: {
    authorization_endpoint: 'http://auth.example.com/authorize',
    token_endpoint: 'http://auth.example.com/token',
  },
};

const expectedClientCredentials = {
  id: authServerId,
  obDirectoryConfig: {
    BaseApiDNSUri: 'http://aaa.example.com',
    CustomerFriendlyName: 'AAA Example Bank',
    OpenIDConfigEndPointUri: 'http://example.com/openidconfig',
    Id: authServerId,
    OBOrganisationId: 'aaa-example-org',
  },
  clientCredentials: {
    clientId: 'abc',
    clientSecret: 'xyz',
  },
};


nock(/example\.com/)
  .get('/openidconfig')
  .reply(200, openIdConfig);

describe('updateOpenIdConfigs', () => {
  beforeEach(async () => {
    await drop(ASPSP_AUTH_SERVERS_COLLECTION);
    await storeAuthorisationServers(flattenedObDirectoryAuthServerList);
  });

  afterEach(async () => {
    await drop(ASPSP_AUTH_SERVERS_COLLECTION);
  });

  it('before called openIdConfig not present', async () => {
    const list = await allAuthorisationServers();
    const authServerConfig = list[0];
    assert.ok(!authServerConfig.openIdConfig, 'openIdConfig not present');
  });

  it('retrieves openIdConfig and stores in db', async () => {
    await updateOpenIdConfigs();
    const list = await allAuthorisationServers();
    const authServerConfig = list[0];
    assert.ok(authServerConfig.openIdConfig, 'openIdConfig present');
    assert.deepEqual(authServerConfig, expectedAuthServerConfig);
  });
});

describe('updateClientCredentials', () => {
  beforeEach(async () => {
    await drop(ASPSP_AUTH_SERVERS_COLLECTION);
    await storeAuthorisationServers(flattenedObDirectoryAuthServerList);
  });

  afterEach(async () => {
    await drop(ASPSP_AUTH_SERVERS_COLLECTION);
  });

  it('before called clientCredentials not present', async () => {
    const list = await allAuthorisationServers();
    const authServerConfig = list[0];
    assert.ok(!authServerConfig.clientCredentials, 'clientCredentials not present');
  });

  it('stores clientCredential in db', async () => {
    await updateClientCredentials(authServerId, { clientId: 'abc', clientSecret: 'xyz' });
    const list = await allAuthorisationServers();
    const authServerConfig = list[0];
    assert.ok(authServerConfig.clientCredentials, 'clientCredentials present');
    assert.deepEqual(authServerConfig, expectedClientCredentials);
  });
});
