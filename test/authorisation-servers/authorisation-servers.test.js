const assert = require('assert');
const { drop, set } = require('../../app/storage.js');
const { AUTH_SERVER_COLLECTION } = require('../../app/authorisation-servers/authorisation-servers');
const {
  allAuthorisationServers,
  storeAuthorisationServers,
  updateOpenIdConfigs,
  getClientCredentials,
} = require('../../app/authorisation-servers');

const nock = require('nock');

const flattenedObDirectoryAuthServerList = [
  {
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

const clientCredentials = {
  clientId: 'a-client-id',
  clientSecret: 'a-client-secret',
};

const expectedAuthServerConfig = {
  id: 'aaa-example-org-http://aaa.example.com',
  obDirectoryConfig: {
    BaseApiDNSUri: 'http://aaa.example.com',
    CustomerFriendlyName: 'AAA Example Bank',
    OpenIDConfigEndPointUri: 'http://example.com/openidconfig',
    id: 'aaa-example-org-http://aaa.example.com',
    orgId: 'aaa-example-org',
  },
  openIdConfig: {
    authorization_endpoint: 'http://auth.example.com/authorize',
    token_endpoint: 'http://auth.example.com/token',
  },
};
describe('authorisation servers', () => {
  beforeEach(async () => {
    await drop(AUTH_SERVER_COLLECTION);
    await storeAuthorisationServers(flattenedObDirectoryAuthServerList);
  });

  afterEach(async () => {
    await drop(AUTH_SERVER_COLLECTION);
  });

  describe('getClientCredentials', () => {
    let authorisationServerId;
    beforeEach(async () => {
      const list = await allAuthorisationServers();
      const authServer = list[0];
      authorisationServerId = list[0].id;
      await set(
        AUTH_SERVER_COLLECTION,
        Object.assign(authServer, { clientCredentials }),
        authorisationServerId,
      );
    });

    it('retrieves client credentials for an authorisationServerId', async () => {
      const found = await getClientCredentials(authorisationServerId);
      assert.deepEqual(found, clientCredentials);
    });
  });

  describe('updateOpenIdConfigs', () => {
    nock(/example\.com/)
      .get('/openidconfig')
      .reply(200, openIdConfig);

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
});
