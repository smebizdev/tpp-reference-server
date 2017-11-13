const assert = require('assert'); // eslint-disable-line
const proxyquire = require('proxyquire');// eslint-disable-line
const sinon = require('sinon'); //eslint-disable-line

const authorisationServersData = [
  {
    id: 'testId',
    obDirectoryConfig: {
      id: 'testId',
      orgId: 'testOrdId',
      CustomerFriendlyName: 'testName',
    },
    clientCredentials: { ex: 'ample' },
    openIdConfig: { ex: 'ample' },
  },
  {
    id: 'testId2',
    obDirectoryConfig: {
      id: 'testId2',
      orgId: 'testOrdId',
      CustomerFriendlyName: 'testName2',
    },
  },
];

describe('authServerRows', () => {
  let authServerRows;

  describe('when no auth servers present', () => {
    beforeEach(() => {
      authServerRows = require('../../scripts/list-auth-servers').authServerRows; // eslint-disable-line
    });
    it('returns tsv headers', async () => {
      assert.deepEqual(
        await authServerRows(),
        ['id\tCustomerFriendlyName\torgId\tclientCredentialsPresent\topenIdConfigPresent'],
      );
    });
  });

  describe('when auth servers present', () => {
    beforeEach(() => {
      const authorisationServersStub = sinon.stub().returns(authorisationServersData);
      authServerRows = proxyquire('../../scripts/list-auth-servers',   //eslint-disable-line
        { '../app/ob-directory': { allAuthorisationServers: authorisationServersStub } },
      ).authServerRows;
    });

    it('returns tsv of auth servers', async () => {
      assert.deepEqual(
        await authServerRows(),
        [
          'id\tCustomerFriendlyName\torgId\tclientCredentialsPresent\topenIdConfigPresent',
          'testId\ttestName\ttestOrdId\ttrue\ttrue',
          'testId2\ttestName2\ttestOrdId\tfalse\tfalse',
        ],
      );
    });
  });
});
