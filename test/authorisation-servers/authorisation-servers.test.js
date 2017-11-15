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

const flattenedObDirectoryAuthServerList = [
  {
    Id: 'aaaj4NmBD8lQxmLh2O9FLY',
    BaseApiDNSUri: 'http://aaa.example.com',
    CustomerFriendlyName: 'AAA Example Bank',
    OpenIDConfigEndPointUri: 'http://example.com/openidconfig',
    orgId: 'aaa-example-org',
  },
];

const openIdConfig = {
  authorization_endpoint: 'http://auth.example.com/authorize',
  token_endpoint: 'http://auth.example.com/token',
};

const expectedAuthServerConfig = {
  id: 'aaaj4NmBD8lQxmLh2O9FLY',
  obDirectoryConfig: {
    BaseApiDNSUri: 'http://aaa.example.com',
    CustomerFriendlyName: 'AAA Example Bank',
    OpenIDConfigEndPointUri: 'http://example.com/openidconfig',
    Id: 'aaaj4NmBD8lQxmLh2O9FLY',
    orgId: 'aaa-example-org',
  },
  openIdConfig: {
    authorization_endpoint: 'http://auth.example.com/authorize',
    token_endpoint: 'http://auth.example.com/token',
  },
};

const expectedClientCredentials = {
  id: 'aaa-example-org-http://aaa.example.com',
  obDirectoryConfig: {
    BaseApiDNSUri: 'http://aaa.example.com',
    CustomerFriendlyName: 'AAA Example Bank',
    OpenIDConfigEndPointUri: 'http://example.com/openidconfig',
    id: 'aaa-example-org-http://aaa.example.com',
    orgId: 'aaa-example-org',
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
    await updateClientCredentials('aaa-example-org-http://aaa.example.com', { clientId: 'abc', clientSecret: 'xyz' });
    const list = await allAuthorisationServers();
    const authServerConfig = list[0];
    assert.ok(authServerConfig.clientCredentials, 'clientCredentials present');
    assert.deepEqual(authServerConfig, expectedClientCredentials);
  });
});
