const request = require('superagent');
const { setupMutualTLS } = require('./certs-util');
const nJwt = require('njwt');
const qs = require('qs');
const { session } = require('./session');
const util = require('util');
const debug = require('debug')('debug');
const log = require('debug')('log');
const error = require('debug')('error');
const {
  authorisationServersForClient,
  storeAuthorisationServers,
} = require('./authorisation-servers');

const NOT_PROVISIONED_FOR_OB_TOKEN = 'NO_TOKEN';

const provisionedForOpenBanking = process.env.OB_PROVISIONED === 'true';
const directoryHost = process.env.OB_DIRECTORY_HOST;
const directoryAuthHost = process.env.OB_DIRECTORY_AUTH_HOST;
const softwareStatementId = process.env.SOFTWARE_STATEMENT_ID;
const softwareStatementAssertionKid = process.env.SOFTWARE_STATEMENT_ASSERTION_KID;
const authClientScopes = process.env.CLIENT_SCOPES;
const signingKey = () => Buffer.from(process.env.SIGNING_KEY || '', 'base64').toString();

log(`OB_DIRECTORY_HOST: ${directoryHost}`);

const getSessionAccessToken = util.promisify(session.getAccessToken);

const extractAuthorisationServers = (data) => {
  if (!data.Resources) {
    return [];
  }
  const authServers = data.Resources
    .filter(resource => !!resource.AuthorisationServers)
    .map(resource => resource.AuthorisationServers.map((r) => {
      r.orgId = resource.id; // eslint-disable-line
      return r;
    }))
    .reduce((a, b) => a.concat(b), []); // flatten array
  return authServers;
};

const getAccessToken = async () => {
  try {
    let accessToken = JSON.parse(await getSessionAccessToken());
    if (accessToken && accessToken.expiresAt < new Date().getTime()) {
      return accessToken;
    }

    const authUrl = `${directoryAuthHost}/as/token.oauth2`;
    const claims = {
      iss: softwareStatementId,
      sub: softwareStatementId,
      scope: authClientScopes,
      aud: authUrl,
    };

    const createdJwt = nJwt.create(claims, signingKey(), 'RS256');
    createdJwt.setHeader('kid', softwareStatementAssertionKid);
    const compactedJwt = createdJwt.compact();

    const response = await setupMutualTLS(request)
      .post(authUrl)
      .send(qs.stringify({
        client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
        grant_type: 'client_credentials',
        client_id: softwareStatementId,
        client_assertion: compactedJwt,
        scope: authClientScopes,
      }));

    const token = response.body.access_token;
    const tokenType = response.body.token_type;
    const tokenExpiry = parseInt(response.body.expires_in, 10);
    const tokenExpiresAt = new Date().getTime() + (tokenExpiry * 1000);
    accessToken = { token, tokenType, tokenExpiresAt };
    session.setAccessToken(accessToken);

    return accessToken;
  } catch (e) {
    error(e);
    throw e;
  }
};

const fetchOBAccountPaymentServiceProviders = async () => {
  try {
    const uri = `${directoryHost}/scim/v2/OBAccountPaymentServiceProviders/`;
    const accessToken = provisionedForOpenBanking ?
      (await getAccessToken()) : { token: NOT_PROVISIONED_FOR_OB_TOKEN };
    const bearerToken = `Bearer ${accessToken.token}`;
    log(`getting: ${uri}`);
    const response = await setupMutualTLS(request)
      .get(uri)
      .set('Authorization', bearerToken)
      .set('Accept', 'application/json');
    log(`response: ${response.status}`);
    if (response.status === 200) {
      const authServers = extractAuthorisationServers(response.body);
      debug(`data: ${JSON.stringify(authServers)}`);
      await storeAuthorisationServers(authServers);
      return authorisationServersForClient();
    }
    return [];
  } catch (e) {
    error(e);
    return [];
  }
};

const OBAccountPaymentServiceProviders = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let servers = authorisationServersForClient();
  if (servers.length > 0) {
    fetchOBAccountPaymentServiceProviders(); // async update store
  } else {
    servers = await fetchOBAccountPaymentServiceProviders();
  }
  return res.json(servers);
};

exports.OBAccountPaymentServiceProviders = OBAccountPaymentServiceProviders;
