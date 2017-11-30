const sinon = require('sinon');
const { checkErrorThrown } = require('../utils');
const { makeRequest } = require('../../app/setup-request'); // eslint-disable-line

const authorisationServerId = 'testAuthorisationServerId';
const fapiFinancialId = 'testFinancialId';

const createRequestFn = sinon.stub();

describe('makeRequest called with blank authorisationServerId', () => {
  it('throws error with 400 status set', async () => {
    await checkErrorThrown(
      async () => makeRequest(null, fapiFinancialId, createRequestFn),
      400, 'authorisationServerId missing from request payload',
    );
  });
});

describe('makeRequest called with blank fapiFinancialId', () => {
  it('throws error with 400 status set', async () => {
    await checkErrorThrown(
      async () => makeRequest(authorisationServerId, null, createRequestFn),
      400, 'fapiFinancialId missing from request payload',
    );
  });
});
