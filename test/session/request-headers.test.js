const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const authorisationServerId = 'testAuthorisationServerId';
const sessionId = 'testSessionId';
const username = 'testUsername';
const generatedInteractionId = 'testInteractionId';
const fapiFinancialId = 'testFapiFinancialId';
const validationRunId = 'testValidationRunId';

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
};

describe('extractHeaders from request headers', () => {
  it('returns headers object', async () => {
    const interactionId = generatedInteractionId;
    const headers = await extractHeaders(requestHeaders);
    assert.deepEqual(headers, {
      fapiFinancialId,
      interactionId,
      sessionId,
      username,
      authorisationServerId,
      validationRunId,
    });
  });

  describe('when x-fapi-interaction-id in headers', () => {
    it('returns headers with same interactionId', async () => {
      const interactionId = 'existingId';
      const headers = await extractHeaders(Object.assign({ 'x-fapi-interaction-id': interactionId }, requestHeaders));
      assert.deepEqual(headers, {
        fapiFinancialId,
        interactionId,
        sessionId,
        username,
        authorisationServerId,
        validationRunId,
      });
    });
  });
});
