const bunyan = require('bunyan');
const superagentLogger = require('superagent-bunyan');
const assert = require('assert');

const logger = bunyan.createLogger({
  name: 'ob-proxy.log',
  streams: [{
    path: './resource.log',
  }],
});

const setupResponseLogging = (requestObj, extras) => {
  if (process.env.NODE_ENV !== 'test' && process.env.LOG_ASPSP_RESPONSES === 'true') {
    assert.ok(extras.sessionId, 'sessionId missing from setupResponseLogging call');
    assert.ok(extras.interactionId, 'interactionId missing from setupResponseLogging call');
    assert.ok(extras.interactionId, 'interactionId missing from setupResponseLogging call');
    const requestId = `${Date.now()}-${Math.random()}`.replace('0.', '');
    requestObj.use(superagentLogger(logger, requestId, extras));
  }
};

exports.setupResponseLogging = setupResponseLogging;
