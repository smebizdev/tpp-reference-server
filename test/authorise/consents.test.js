const assert = require('assert');

const { setConsent, consent } = require('../../app/authorise');
const { AUTH_SERVER_USER_CONSENTS_COLLECTION } = require('../../app/authorise/consents');

const { drop } = require('../../app/storage.js');

const username = 'testUsername';
const authorisationServerId = 'a123';
const scope = 'accounts';
const keys = { username, authorisationServerId, scope };

const accountRequestId = 'xxxxxx-xxxx-43c6-9c75-eaf01821375e';
const authorisationCode = 'spoofAuthCode';
const token = 'testAccessToken';
const tokenPayload = {
  access_token: token,
  expires_in: 3600,
  token_type : 'bearer',
};

const consentPayload = {
  username,
  authorisationServerId,
  scope,
  accountRequestId,
  expirationDateTime: null,
  authorisationCode,
  token: tokenPayload,
};

describe('setConsents', () => {
  beforeEach(async () => {
    await drop(AUTH_SERVER_USER_CONSENTS_COLLECTION);
  });

  afterEach(async () => {
    await drop(AUTH_SERVER_USER_CONSENTS_COLLECTION);
  });

  it('stores payload and allows consent to be retrieved', async () => {
    await setConsent(keys, consentPayload);
    const stored = await consent(keys);
    assert.equal(stored.id, `${username}:::${authorisationServerId}:::${scope}`);
    assert.equal(stored.token.access_token, token);
  });
});
