const request = require('supertest');

const authorization = 'abc';
const fapiFinancialId = 'xyz';
const authServerId = 'testAuthServerId';

process.env.DEBUG = 'error';
process.env.AUTHORIZATION = authorization;
process.env.OB_DIRECTORY_HOST = 'http://example.com';

const { app } = require('../app/index.js');
const { session } = require('../app/session');
const assert = require('assert');
const util = require('util');

const nock = require('nock');

const username = 'alice';
const password = 'wonderland';

const requestHeaders = {
  reqheaders: {
    'authorization': authorization,
    'x-fapi-financial-id': fapiFinancialId,
    'x-authorization-server-id': authServerId,
  },
};

nock(/example\.com/, requestHeaders)
  .get('/open-banking/v1.1/accounts')
  .times(3)
  .reply(200, {
    Data: {
      Account: [
        {
          AccountId: '22290',
          Currency: 'GBP',
          Account: {
            SchemeName: 'SortCodeAccountNumber',
            Identification: '30854645679085',
            Name: 'Ms Smith',
            SecondaryIdentification: '341267',
          },
        },
      ],
    },
    Links: {
      Self: '/accounts',
    },
    Meta: {
      TotalPages: 1,
    },
  });

nock(/example\.com/)
  .get('/open-banking/non-existing')
  .reply(404);

const login = application => request(application)
  .post('/login')
  .set('Accept', 'x-www-form-urlencoded')
  .send({ u: username, p: password });

describe('Session Creation (Login)', () => {
  it('returns "Access-Control-Allow-Origin: *" header', (done) => {
    login(app)
      .end((err, res) => {
        const header = res.headers['access-control-allow-origin'];
        assert.equal(header, '*');
        done();
      });
  });

  it('returns a guid in the body as a json payload for /login', (done) => {
    login(app)
      .end((err, res) => {
        const mySid = res.body.sid;
        const isGuid = (mySid.length === 36);
        assert.equal(true, isGuid);
        done();
      });
  });

  it('returns a 200 for second user kate login /login', (done) => {
    request(app)
      .post('/login')
      .set('Accept', 'x-www-form-urlencoded')
      .send({ u: 'kate', p: 'lookingglass' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        done();
      });
  });


  it('returns an unauthorised status for an invalid set of credentials at /login', (done) => {
    request(app)
      .post('/login')
      .set('Accept', 'x-www-form-urlencoded')
      .send({ u: 'foo', p: 'baarx' })
      .end((err, res) => {
        assert.equal(res.status, 401);
        done();
      });
  });

  it('returns 500 error status for username "trigger-error"', (done) => {
    request(app)
      .post('/login')
      .set('Accept', 'x-www-form-urlencoded')
      .send({ u: 'trigger-error', p: 'baarx' })
      .end((err, res) => {
        assert.equal(res.status, 500);
        done();
      });
  });
});

describe('Cross Origin Requests Handled Correctly', () => {
  it('returns "Access-Control-Allow-Origin: *" header', (done) => {
    login(app).end(() => {
      request(app)
        .post('/logout')
        .end((e, r) => {
          const header = r.headers['access-control-allow-origin'];
          assert.equal(header, '*');
          done();
        });
    });
  });
});

describe('Session Deletion (Logout)', () => {
  it('destroys a valid session at /logout', (done) => {
    login(app).end((err, res) => {
      const sessionId = res.body.sid;

      request(app)
        .post('/logout')
        .set('Accept', 'application/json')
        .set('authorization', sessionId)
        .end((e, r) => {
          assert.equal(r.status, 200);
          assert.equal(r.body.sid, sessionId);
          done();
        });
    });
  });

  it('does not destroy an invalid session at /logout', (done) => {
    request(app)
      .get('/logout')
      .set('Accept', 'application/json')
      .set('authorization', 'jkaghrtegdkhsugf')
      .end((err, res) => {
        assert.equal(res.status, 204);
        done();
      });
  });

  after(async () => {
    await session.deleteAll();
  });
});
const scope = 'accounts';
const accountRequestId = 'xxxxxx-xxxx-43c6-9c75-eaf01821375e';
const authorisationCode = 'spoofAuthCode';
const token = 'testAccessToken';
const tokenPayload = {
  access_token: token,
  expires_in: 3600,
};

const consentPayload = {
  username,
  authorisationServerId: authServerId,
  scope,
  accountRequestId,
  expirationDateTime: null,
  authorisationCode,
  token: tokenPayload,
};

const { AUTH_SERVER_USER_CONSENTS_COLLECTION } = require('../app/authorise/consents');
const { ASPSP_AUTH_SERVERS_COLLECTION } = require('../app/authorisation-servers/authorisation-servers');
const { setConsent } = require('../app/authorise');
const { setAuthServerConfig } = require('../app/authorisation-servers/authorisation-servers');
const { drop } = require('../app/storage.js');

const resourceApiHost = 'http://example.com';

const loginWithConsent = async (application) => {
  const loginAnd = login(application);
  loginAnd.end[util.promisify.custom] = () => new Promise((resolve, reject) =>
    loginAnd.end((err, res) => {
      if (err) {
        reject(err);
      } else {
        const sessionId = res.body.sid;
        setConsent({
          username,
          authorisationServerId: authServerId,
          scope,
        }, consentPayload);
        resolve({ sessionId, res });
      }
    }));

  const endAsync = util.promisify(loginAnd.end);
  return endAsync();
};

const requestResource = (sessionId, url, application, callback) => {
  const req = request(application)
    .get(url)
    .set('Accept', 'application/json')
    .set('x-authorization-server-id', authServerId);
  if (sessionId) {
    req.set('authorization', sessionId);
  }
  req.end(callback);
};

describe('Proxy', () => {
  beforeEach(async () => {
    await setAuthServerConfig(authServerId, {
      obDirectoryConfig: {
        OBOrganisationId: fapiFinancialId,
        BaseApiDNSUri: resourceApiHost,
      },
    });
  });

  afterEach(async () => {
    await session.deleteAll();
    await drop(AUTH_SERVER_USER_CONSENTS_COLLECTION);
    await drop(ASPSP_AUTH_SERVERS_COLLECTION);
    delete process.env.DEBUG;
    delete process.env.OB_DIRECTORY_HOST;
    delete process.env.AUTHORIZATION;
  });

  it('returns proxy 200 response for /open-banking/v1.1/accounts with valid session', (done) => {
    loginWithConsent(app).then(({ sessionId }) => {
      requestResource(sessionId, '/open-banking/v1.1/accounts', app, (e, r) => {
        assert.equal(r.status, 200);
        assert.equal(r.body.Data.Account[0].AccountId, '22290');
        done();
      });
    });
  });

  it('returns 400 response for missing x-authorization-server-id', (done) => {
    loginWithConsent(app).then(({ sessionId }) => {
      request(app)
        .get('/open-banking/v1.1/accounts')
        .set('Accept', 'application/json')
        .set('authorization', sessionId)
        .end((e, r) => {
          assert.equal(r.status, 400);
          done();
        });
    });
  });

  it('returns proxy 404 reponse for /open-banking/non-existing', (done) => {
    loginWithConsent(app).then(({ sessionId }) => {
      requestResource(sessionId, '/open-banking/non-existing', app, (e, r) => {
        assert.equal(r.status, 404);
        done();
      });
    });
  });

  it('returns 404 for path != /open-banking', (done) => {
    loginWithConsent(app).then(({ sessionId }) => {
      requestResource(sessionId, '/open-banking-invalid', app, (e, r) => {
        assert.equal(r.status, 404);
        done();
      });
    });
  });

  it('returns proxy 401 unauthorised response for /open-banking/* with missing authorization header', (done) => {
    loginWithConsent(app).then(() => {
      requestResource(null, '/open-banking/v1.1/accounts', app, (e, r) => {
        assert.equal(r.status, 401);
        const header = r.headers['access-control-allow-origin'];
        assert.equal(header, '*');
        done();
      });
    });
  });

  it('returns proxy 401 unauthorised response for /open-banking/* with invalid authorization header', (done) => {
    loginWithConsent(app).then(() => {
      requestResource('invalid-token', '/open-banking/v1.1/accounts', app, (e, r) => {
        assert.equal(r.status, 401);
        const header = r.headers['access-control-allow-origin'];
        assert.equal(header, '*');
        done();
      });
    });
  });
});
