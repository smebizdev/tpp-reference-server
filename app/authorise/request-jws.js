const jws = require('jws');

/**
 * Issuer of the token.
 * OpenID Connect protocol mandates this MUST include the client ID of the TPP.
 * Should contain the ClientID of the TPP’s OAuth Client.
 * Required as per FAPI RW / OpenID Standard.
 * For now return raw clientId
 */
const issuer = clientId => clientId;

/**
 * Audience that the ID token is intended for.
 * Represents the identifier of the authorization server as defined in RFC7519.
 * When a pure OAuth 2.0 is used, the value is the redirection URI.
 * When OpenID Connect is used, the value is the issuer value of the authorization server.
 */
// const audience = (authServerIssuer, useOpenidConnect) => {
//   todo: implement this function
//   return useOpenidConnect ? authServerIssuer : redirectionUri;
// };

/**
 * Used to help mitigate against replay attacks.
 * Required by FAPI Read Write (Hybrid explicitly required –
 * required by OIDC Core for Hybrid Flow).
 * Hybrid Flow support is optional in the OB Security Profile.
 * For now return dummy value.
 */
const nonce = () => 'dummy-nonce';

const claims = accountRequestId => ({
  userinfo: {
    openbanking_intent_id: {
      value: accountRequestId, // not sure this
      essential: true,
    },
  },
  id_token: {
    openbanking_intent_id: {
      value: accountRequestId,
      essential: true,
    },
    acr: {
      essential: true,
    },
  },
});

const createClaims = (
  scope, accountRequestId, clientId, authServerIssuer,
  registeredRedirectUrl, state, useOpenidConnect, // eslint-disable-line
) => ({
  aud: authServerIssuer,
  iss: issuer(clientId),
  response_type: 'code',
  client_id: clientId,
  redirect_uri: registeredRedirectUrl,
  scope,
  state,
  nonce: nonce(),
  max_age: 86400,
  claims: claims(accountRequestId),
});

// Use alg: 'none' for now when signing.
const createJsonWebSignature = (payload) => {
  const signature = jws.sign({
    header: { alg: 'none' },
    payload,
  });
  return signature;
};

exports.createClaims = createClaims;
exports.createJsonWebSignature = createJsonWebSignature;
