const debug = require('debug')('debug');

const validationErrorMiddleware = (err, req, res, next) => { // eslint-disable-line
  if (err.failedValidation) {
    const {
      apiDeclarations,
      results,
      errors,
      failedValidation,
      originalResponse,
      warnings,
      message,
    } = err;
    debug('failed validation');
    res.body = {
      apiDeclarations,
      errors,
      failedValidation,
      originalResponse,
      results,
      warnings,
      message,
    };
    return res.status(400).end();
  }
  next();
};

exports.validationErrorMiddleware = validationErrorMiddleware;
