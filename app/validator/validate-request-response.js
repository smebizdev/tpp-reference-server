const url = require('url');
const objectSize = require('object.size');
const assert = require('assert');
const errorLog = require('debug')('error');
const debug = require('debug')('debug');
const { validatorApp, kakfaConfigured, kafkaStream } = require('./init-validator-app');

const getRawQs = req => (
  req.qsRaw && req.qsRaw.length
    ? req.qsRaw.join('&')
    : undefined);

const getQs = req => (
  objectSize(req.qs)
    ? req.qs
    : getRawQs(req));

const lowerCaseHeaders = (req) => {
  const newHeaders = {};
      Object.keys(req.headers).forEach(key => // eslint-disable-line
    newHeaders[key.toLowerCase()] = req.headers[key]);
  req.headers = newHeaders;
  return req;
};

const reqSerializer = (req, lowerCaseHeader = true) => {
  let serialized;
  const keys = Object.keys(req);
  if (keys.includes('_data') || keys.includes('res')) {
    serialized = {
      method: req.method,
      url: req.url,
      qs: getQs(req),
      path: req.url && url.parse(req.url).pathname,
      body: req._data, // eslint-disable-line
      headers: req.header,
    };
  } else {
    serialized = req;
  }
  if (lowerCaseHeader) {
    serialized = lowerCaseHeaders(serialized);
  }
  return serialized;
};

const resSerializer = res => ({
  statusCode: res.statusCode,
  headers: res.headers,
  body: objectSize(res.body) ? res.body : res.text,
});

const noResponseError = {
  statusCode: 400,
  body: {
    failedValidation: true,
    message: 'Response validation failed: response was blank.',
  },
};

const checkDetails = (details) => {
  assert.ok(details.sessionId, 'sessionId missing from validate call');
  assert.ok(details.interactionId, 'interactionId missing from validate call');
  assert.ok(details.authorisationServerId, 'authorisationServerId missing from validate call');
};

const validationReport = (validationResponse) => {
  let report;
  if (validationResponse.statusCode === 400) {
    report = JSON.parse(JSON.stringify(validationResponse.body));
    delete report.originalResponse;
  } else {
    report = { validationFailed: false };
  }
  return report;
};

const logFormat = (request, response, details, validationResponse) => ({
  details,
  report: validationReport(validationResponse),
  request: reqSerializer(request, false),
  response: resSerializer(response),
});

const writeToKafka = async (details, request, res) => {
  try {
    const kafka = await kafkaStream();
    await kafka.write({
      details,
      request: reqSerializer(request),
      response: resSerializer(res),
    });
  } catch (err) {
    errorLog(err);
    throw err;
  }
};

const validate = async (req, res, details) => {
  checkDetails(details);
  const request = reqSerializer(req);
  let validationResponse;
  if (!res) {
    validationResponse = noResponseError;
  } else {
    validationResponse = resSerializer(res);
    const app = await validatorApp();
    debug('validate');
    await app.handle(request, validationResponse);
    if (validationResponse.statusCode !== 400) {
      debug('validation passed');
    }
  }
  if (kakfaConfigured()) {
    await writeToKafka(details, request, res);
  }
  return validationResponse;
};

exports.logFormat = logFormat;
exports.validate = validate;
