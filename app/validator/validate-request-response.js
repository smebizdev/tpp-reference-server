const noResponseError = {
  statusCode: 400,
  body: {
    failedValidation: true,
    message: 'Response validation failed: response was blank.',
  },
};

const lowerCaseHeaders = (req) => {
  const newHeaders = {};
  Object.keys(req.headers).forEach(key => // eslint-disable-line
    newHeaders[key.toLowerCase()] = req.headers[key]);
  req.headers = newHeaders;
};

const validate = (app, req, res) => {
  if (!res) {
    return noResponseError;
  }
  lowerCaseHeaders(req);
  app.handle(req, res);
  return res;
};

exports.validate = validate;
