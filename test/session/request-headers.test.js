const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const authorisationServerId = 'testAuthorisationServerId';
const sessionId = 'testSessionId';
const username = 'testUsername';
const generatedInteractionId = 'testInteractionId';
const fapiFinancialId = 'testFapiFinancialId';
const validationRunId = 'testValidationRunId';
const permissions = 'ReadAccountsDetail ReadTransactionsDebits';
const permissionsList = permissions.split(' ');

const { extractHeaders } = proxyquire(
  '../../app/session/request-headers.js',
  {
    '../authorisation-servers': {
      fapiFinancialIdFor: async () => fapiFinancialId,
    },
    './session': {
      getUsername: async () => username,
    },
    'uuid/v4': sinon.stub().returns(generatedInteractionId),
  },
);

const requestHeaders = {
  'authorization': sessionId,
  'x-authorization-server-id': authorisationServerId,
  'x-validation-run-id': validationRunId,
  'x-permissions': permissions,
};

const expectedHeaders = extra => Object.assign({}, {
  fapiFinancialId,
  sessionId,
  username,
  authorisationServerId,
  validationRunId,
  accountSwaggers: [],
  permissions: permissionsList,
}, extra);

describe('extractHeaders from request headers', () => {
  it('returns headers object', async () => {
    const interactionId = generatedInteractionId;
    const headers = await extractHeaders(requestHeaders);
    assert.deepEqual(headers, expectedHeaders({ interactionId }));
  });

  describe('when x-fapi-interaction-id in headers', () => {
    it('returns headers with same interactionId', async () => {
      const interactionId = 'existingId';
      const headers = await extractHeaders(Object.assign({ 'x-fapi-interaction-id': interactionId }, requestHeaders));
      assert.deepEqual(headers, expectedHeaders({ interactionId }));
    });
  });

  describe('when X-ACCOUNT-SWAGGERS in headers', () => {
    it('returns headers with same X-ACCOUNT-SWAGGERS', async () => {
      const interactionId = generatedInteractionId;

      const BASIC_ACCOUNT_SWAGGER = 'https://raw.githubusercontent.com/OpenBankingUK/account-info-api-spec/refapp-295-permission-specific-swagger-files/dist/v2.0.0/account-info-swagger.json';
      const DETAIL_ACCOUNT_SWAGGER = 'https://raw.githubusercontent.com/OpenBankingUK/account-info-api-spec/refapp-295-permission-specific-swagger-files/dist/v2.0.0/account-info-swagger-detail.json';
      const xAccountSwaggers = `${BASIC_ACCOUNT_SWAGGER} ${DETAIL_ACCOUNT_SWAGGER}`;
      const xAccountSwaggersExpected = xAccountSwaggers.split(' ');

      const headers = Object.assign({}, { 'x-account-swaggers': xAccountSwaggers }, requestHeaders);
      const extracted = await extractHeaders(headers);

      assert.deepEqual(
        extracted,
        expectedHeaders({ accountSwaggers: xAccountSwaggersExpected, interactionId }),
      );
    });
  });
});
