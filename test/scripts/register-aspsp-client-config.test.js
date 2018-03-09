const assert = require('assert'); // eslint-disable-line
const proxyquire = require('proxyquire'); // eslint-disable-line
const sinon = require('sinon'); //eslint-disable-line

describe('registerAgreedConfig', () => {
  let fakeUpdateOpenIdConfigs;
  let registerAgreedConfig;

  beforeEach(async () => {
    fakeUpdateRegisteredConfig = sinon.stub();
    ({ registerAgreedConfig } = proxyquire('../../scripts/register-aspsp-client-config',
      {
        '../app/authorisation-servers': {
          updateRegisteredConfig: fakeUpdateRegisteredConfig,
        },
      },
    ));
  });

  it('fetches OB account service providers', () => {
    //authServerId=48fr7qwRKzA0eWKR2Se8YR field=request_object_signing_alg value='["PS256"]'
    registerAgreedConfig(['authServerId=48fr7qwRKzA0eWKR2Se8YR', 'field=request_object_signing_alg', "value='[\"PS256\"]'"]);
    assert(fakeUpdateRegisteredConfig.calledWithExactly('48fr7qwRKzA0eWKR2Se8YR', { "request_object_signing_alg": ["PS256"] }));
  });
});
