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

  it('throws an error when a file path is not supplied', async () => {
    try {
      await encoder();
    } catch (e) {
      assert.equal(
        e.message,
        'Please include a path to a CERT file,\n<<e.g. npm run base64-cert full/path/to/cert>>',
      );
    }
  });
});
