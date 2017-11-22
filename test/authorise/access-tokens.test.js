const assert = require('assert');

const { accessToken, setTokenPayload } = require('../../app/authorise');
const { ACCESS_TOKENS_COLLECTION } = require('../../app/authorise/access-tokens');

const { drop } = require('../../app/storage.js');

const sessionId = 'testSession';
const token = 'testAccessToken';
const tokenPayload = {
  access_token: token,
  expires_in: 3600,
};

describe('setTokenPayload', () => {
  beforeEach(async () => {
    await drop(ACCESS_TOKENS_COLLECTION);
  });

  afterEach(async () => {
    await drop(ACCESS_TOKENS_COLLECTION);
  });

  it('stores payload and allows accessToken to be retrieved', async () => {
    await setTokenPayload(sessionId, tokenPayload);
    assert.equal(await accessToken(sessionId), token);
  });
});
