const request = require('supertest');
const fs = require('fs');
const path = require('path');

const accessToken = 'AN_ACCESS_TOKEN';

const { drop } = require('../app/storage.js');

const { app } = require('../app/index.js');
const { session } = require('../app/session.js');
const { ASPSP_AUTH_SERVERS_COLLECTION } = require('../app/authorisation-servers/authorisation-servers');

const assert = require('assert');
const nock = require('nock');

nock(/secure-url\.com/)
  .get('/private_key.pem')
  .reply(200, fs.readFileSync(path.join(__dirname, 'test_private_key.pem')));

nock(/auth\.com/)
  .post('/as/token.oauth2')
  .reply(200, {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 1000,
  });

const directoryHeaders = {
  reqheaders: {
    authorization: `Bearer ${accessToken}`,
  },
};

const expectedResult = [
  {
    id: 'aaaj4NmBD8lQxmLh2O9FLY',
    logoUri: 'string',
    name: 'AAA Example Bank',
    orgId: 'aaax5nTR33811QyQfi',
  },
  {
    id: 'bbbX7tUB4fPIYB0k1m',
    logoUri: 'string',
    name: 'BBB Example Bank',
    orgId: 'bbbcccUB4fPIYB0k1m',
  },
  {
    id: 'cccbN8iAsMh74sOXhk',
    logoUri: 'string',
    name: 'CCC Example Bank',
    orgId: 'bbbcccUB4fPIYB0k1m',
  },
];

const aspspPayload = {
  Resources: [
    {
      'AuthorisationServers': [
        {
          Id: 'aaaj4NmBD8lQxmLh2O9FLY',
          BaseApiDNSUri: 'http://aaa.example.com',
          CustomerFriendlyLogoUri: 'string',
          CustomerFriendlyName: 'AAA Example Bank',
          OpenIDConfigEndPointUri: 'http://aaa.example.com/openid/config',
        },
      ],
      'urn:openbanking:organisation:1.0': {
        OrganisationCommonName: 'AAA Group PLC',
        OBOrganisationId: 'aaax5nTR33811QyQfi',
      },
      'id': 'aaax5nTR33811QyQfi',
    },
    {
      'AuthorisationServers': [
        {
          Id: 'bbbX7tUB4fPIYB0k1m',
          BaseApiDNSUri: 'http://bbb.example.com',
          CustomerFriendlyLogoUri: 'string',
          CustomerFriendlyName: 'BBB Example Bank',
          OpenIDConfigEndPointUri: 'http://bbb.example.com/openid/config',
        },
        {
          Id: 'cccbN8iAsMh74sOXhk',
          BaseApiDNSUri: 'http://ccc.example.com',
          CustomerFriendlyLogoUri: 'string',
          CustomerFriendlyName: 'CCC Example Bank',
          OpenIDConfigEndPointUri: 'http://ccc.example.com/openid/config',
        },
      ],
      'urn:openbanking:organisation:1.0': {
        OrganisationCommonName: 'BBBCCC Group PLC',
        OBOrganisationId: 'bbbcccUB4fPIYB0k1m',
      },
      'id': 'bbbcccUB4fPIYB0k1m',
    },
    {
      id: 'fPIYB0k1moGhX7tUB4',
    },
  ],
};

nock(/example\.com/, directoryHeaders)
  .get('/scim/v2/OBAccountPaymentServiceProviders/')
  .reply(200, aspspPayload);

const login = application => request(application)
  .post('/login')
  .set('Accept', 'x-www-form-urlencoded')
  .send({ u: 'alice', p: 'wonderland' });

describe('Directory', () => {
  beforeEach(async () => {
    await drop(ASPSP_AUTH_SERVERS_COLLECTION);
    session.setId('foo');
    // set up dummy but valid signing_key to sign jwt
    process.env.SIGNING_KEY = 'LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQ0KTUlJQk9RSUJBQUpCQU1Odng4ZmtUNmJXYk1jNGNqdTc1eC9kdkZvYnBIWjNVU25lbWhCNUxYQVFYb2c0eTVqVA0KaXdvOTVBdWJONDB1Mm1YRDhRVWhCNFJFQ2Q0alAvWmczMlVDQXdFQUFRSkFXRzE2VW9xT002bnZuQkNCTjEvaw0KeXJsVVlOMERCQXNtc1RBa08zSG95andDMVpKUG9COUQ4SGJEYzljWnhjRW5vQTZDK2pvNmxSN2NOWTlDRWthbQ0KZ1FJaEFQR2I1S2UxVEQreTBleW1Sb21KVEk5VzZjdmNmVk85dWlhZnVjbjBvLzNGQWlFQXp4UFhicHIxZGtBeg0KZG45QVlMazFIZU1vaXZqak0zVVpFUGhkNmJaOEZTRUNJRngzcDJrd0Q4Q0pOYUoyZUtTR3NaQmlXUlEyakppUw0KRWo1Wi93YjE1QlZwQWlCdHVoN1N2Z3ZKY0RXVTJkTWNMYWVtd2FMUEdSa1RRRDViRHJCODBqU240UUlnY243cw0KYTRvcFdtMVhLM3V3WGhBcXVqY3FnY1NseEpZQXMwWGtvSUNOV3c0PQ0KLS0tLS1FTkQgUlNBIFBSSVZBVEUgS0VZLS0tLS0=';
  });

  afterEach(async () => {
    delete process.env.SIGNING_KEY;
    session.deleteAll();
    await drop(ASPSP_AUTH_SERVERS_COLLECTION);
  });

  it('returns proxy 200 response for /account-payment-service-provider-authorisation-servers', (done) => {
    login(app).end((err, res) => {
      const sessionId = res.body.sid;

      request(app)
        .get('/account-payment-service-provider-authorisation-servers')
        .set('Accept', 'application/json')
        .set('authorization', sessionId)
        .end((e, r) => {
          assert.equal(r.status, 200);
          assert.equal(r.body.length, expectedResult.length, `expected ${expectedResult.length} results, got ${r.body.length}`);
          assert.deepEqual(r.body[0], expectedResult[0]);
          assert.deepEqual(r.body[1], expectedResult[1]);
          assert.deepEqual(r.body[2], expectedResult[2]);
          const header = r.headers['access-control-allow-origin'];
          assert.equal(header, '*');
          done();
        });
    });
  });
});
