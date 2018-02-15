const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const authorisationServerId = 'testAuthorisationServerId';
const sessionId = 'testSessionId';
const username = 'testUsername';
const interactionId = 'testInteractionId';
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
    'uuid/v4': sinon.stub().returns(interactionId),
  },
);

const requestHeaders = {
  'authorization': sessionId,
  'x-authorization-server-id': authorisationServerId,
};

describe('extractHeaders from request headers', () => {
  it('returns authorisationServerId and headers object', async () => {
    const value = await extractHeaders(requestHeaders);
    assert.equal(value.authorisationServerId, authorisationServerId);
    assert.deepEqual(value.headers, {
      fapiFinancialId, interactionId, sessionId, username,
    });
  });
});
