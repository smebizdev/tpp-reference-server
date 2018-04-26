const url = require('url');
const objectSize = require('object.size');
const assert = require('assert');
const errorLog = require('debug')('error');

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

const reqSerializer = (req) => {
  if (Object.keys(req).includes('_data')) {
    return lowerCaseHeaders({
      method: req.method,
      url: req.url,
      qs: getQs(req),
      path: req.url && url.parse(req.url).pathname,
      body: req._data, // eslint-disable-line
      headers: req.header,
    });
  }
  return lowerCaseHeaders(req);
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

const validate = async (app, kafkaStream, req, res, details) => {
  checkDetails(details);
  const request = reqSerializer(req);
  let response;
  if (!res) {
    response = noResponseError;
  } else {
    response = resSerializer(res);
    app.handle(request, response);
  }
  if (kafkaStream) {
    try {
      await kafkaStream.write({
        details,
        request,
        response,
      });
    } catch (err) {
      errorLog(err);
    }
  }
  return response;
};

exports.validate = validate;
