const assert = require('assert'); // eslint-disable-line
const proxyquire = require('proxyquire'); // eslint-disable-line

describe('base64EncodeCert', () => {
  let encoder;

  beforeEach(async () => {
    encoder = proxyquire('../../scripts/base64-encode-cert.js', // eslint-disable-line
      {
        fs: {
          'readFileSync': () => 'file-text',
          '@noCallThru': true,
        },
      },
    ).base64EncodeCert;
  });

  it('base64 encodes file data correctly', async () => {
    assert.equal(await encoder('file/path'), 'ZmlsZS10ZXh0');
  });
});
