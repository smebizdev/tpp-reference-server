const bunyan = require('bunyan');
const superagentLogger = require('superagent-bunyan');
const assert = require('assert');

const logger = bunyan.createLogger({
  name: 'ob-proxy.log',
  streams: [{
    path: './resource.log',
  }],
});

const setupResponseLogging = (requestObj, interactionId, extras) => {
  if (process.env.NODE_ENV !== 'test' && process.env.LOG_ASPSP_RESPONSES === 'true') {
    assert.ok(extras.sessionId, 'sessionId missing from setupResponseLogging call');
    requestObj.use(superagentLogger(logger, interactionId, extras));
  }
};

exports.setupResponseLogging = setupResponseLogging;
