const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const authorisationServerId = 'testAuthorisationServerId';
const sessionId = 'testSessionId';
const username = 'testUsername';
const generatedInteractionId = 'testInteractionId';
const fapiFinancialId = 'testFapiFinancialId';

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
};

describe('extractHeaders from request headers', () => {
  it('returns authorisationServerId and headers object', async () => {
    const interactionId = generatedInteractionId;
    const value = await extractHeaders(requestHeaders);
    assert.equal(value.authorisationServerId, authorisationServerId);
    assert.deepEqual(value.headers, {
      fapiFinancialId, interactionId, sessionId, username,
    });
  });

  describe('when x-fapi-interaction-id in headers', () => {
    it('returns headers with same interactionId', async () => {
      const interactionId = 'existingId';
      const value = await extractHeaders(Object.assign({ 'x-fapi-interaction-id': interactionId }, requestHeaders));
      assert.equal(value.authorisationServerId, authorisationServerId);
      assert.deepEqual(value.headers, {
        fapiFinancialId, interactionId, sessionId, username,
      });
    });
  });
});
