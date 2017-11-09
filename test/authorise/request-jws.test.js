const { createClaims } = require('../../app/authorise/request-jws');
const { statePayload } = require('../../app/account-request-authorise-consent');
const assert = require('assert');

describe('createClaims', () => {
  const accountRequestId = 'testAccountRequestId';
  const clientId = 'testClientId';
  const scope = 'openid accounts';
  const authorisationEndpoint = 'http://aspsp.example.com/authorise';
  const authorisationOrigin = 'http://aspsp.example.com/';
  const registeredRedirectUrl = 'http://tpp.example.com/handle-authorise';
  const authorisationServerId = 'testAuthorisationServerId';
  const sessionId = 'testSessionId';
  const state = statePayload(authorisationServerId, sessionId);
  before(() => {
    process.env.ASPSP_AUTH_SERVER = 'http://example.com';
  });
  after(() => {
    process.env.ASPSP_AUTH_SERVER = 'http://example.com';
  });
  const expectedClaims = issuer => ({
    aud: clientId,
    iss: issuer,
    response_type: 'code id_token',
    client_id: clientId,
    redirect_uri: registeredRedirectUrl,
    scope,
    state,
    nonce: 'dummy-nonce',
    max_age: 86400,
    claims:
    {
      userinfo:
      {
        openbanking_intent_id: { value: accountRequestId, essential: true },
      },
      id_token:
      {
        openbanking_intent_id: { value: accountRequestId, essential: true },
        acr: {
          essential: true,
        },
      },
    },
  });

  it('creates claims JSON successfully when useOpenidConnect is false', () => {
    const useOpenidConnect = false;
    const claims = createClaims(
      scope, accountRequestId, clientId, authorisationEndpoint,
      registeredRedirectUrl, state, useOpenidConnect,
    );
    assert.deepEqual(claims, expectedClaims(authorisationEndpoint));
  });

  it('creates claims JSON successfully when useOpenidConnect is true', () => {
    const useOpenidConnect = true;
    const claims = createClaims(
      scope, accountRequestId, clientId, authorisationEndpoint,
      registeredRedirectUrl, state, useOpenidConnect,
    );
    assert.deepEqual(claims, expectedClaims(authorisationOrigin));
  });
});
