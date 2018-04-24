const url = require('url');
const objectSize = require('object.size');

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

const validate = (app, req, res) => {
  if (!res) {
    return noResponseError;
  }
  const request = reqSerializer(req);
  const response = resSerializer(res);
  app.handle(request, response);
  return response;
};

exports.validate = validate;
