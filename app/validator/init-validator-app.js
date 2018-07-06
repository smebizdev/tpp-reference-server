const express = require('express');
const { replayMiddleware } = require('./replay-middleware');
const { validationErrorMiddleware } = require('./validation-error-middleware');
const { swaggerMiddleware } = require('./swagger-middleware');
const { KafkaStream } = require('./kafka-stream');
const path = require('path');
const { logger } = require('../utils/logger');

// validator key -> express app validator
const validators = new Map();
let _kafkaStream; // eslint-disable-line

const validateResponseOn = () => process.env.VALIDATE_RESPONSE === 'true';
const logTopic = () => process.env.VALIDATION_KAFKA_TOPIC;
const connectionString = () => process.env.VALIDATION_KAFKA_BROKER;

const addValidationMiddleware = async (app, swaggerUriOrFile, swaggerFile) => {
  const { metadata, validator } = await swaggerMiddleware(swaggerUriOrFile, swaggerFile);
  app.use(metadata);
  app.use(validator);
  app.use(replayMiddleware);
  app.use(validationErrorMiddleware);
};

const configureSwagger = async (details, app) => {
  const {
    accountSwaggers = [],
    scope,
  } = details;
  logger.log('verbose', 'configureSwagger', { details });

  const middlewares = {
    accounts: async target => addValidationMiddleware(target, process.env.ACCOUNT_SWAGGER, 'account-swagger.json'),
    payments: async target => addValidationMiddleware(target, process.env.PAYMENT_SWAGGER, 'payment-swagger.json'),
  };

  if (scope && middlewares[scope]) {
    await middlewares[scope](app);
  }

  // fetch all accountSwaggers then write them to disk
  for (let x = 0; x < accountSwaggers.length; x += 1) {
    const accountSwagger = accountSwaggers[x];

    const swaggerUriOrFile = accountSwagger;
    const swaggerFile = path.basename(swaggerUriOrFile);

    logger.log('verbose', 'configureSwagger', { swaggerUriOrFile, swaggerFile });
    // eslint-disable-next-line no-await-in-loop
    await addValidationMiddleware(app, swaggerUriOrFile, swaggerFile);
  }
};

const initValidatorApp = async (details) => {
  const app = express();
  app.disable('x-powered-by');
  await configureSwagger(details, app);

  return app;
};

const kakfaConfigured = () =>
  !!(logTopic() && connectionString());

const initKafkaStream = async () => {
  const kafkaStream = new KafkaStream({
    kafkaOpts: {
      connectionString: connectionString(),
    },
    topic: logTopic(),
  });
  await kafkaStream.init();

  return kafkaStream;
};

const makeValidatorKey = (details) => {
  const {
    accountSwaggers = [],
    scope = '',
  } = details;

  const keys = accountSwaggers.slice().concat([scope]);
  const key = keys.sort().toString();

  return key;
};

const validatorApp = async (details) => {
  if (!validateResponseOn()) {
    return undefined;
  }

  const validatorKey = makeValidatorKey(details);
  const createValidator = !validators.has(validatorKey) || !validators.get(validatorKey).default;
  logger.log('verbose', 'validatorApp', {
    details, validatorKey, createValidator, validators: JSON.stringify([...validators]),
  });

  if (createValidator) {
    const app = await initValidatorApp(details);
    validators.set(validatorKey, { default: app });
  }

  const validator = validators.get(validatorKey);
  return validator.default;
};

const kafkaStream = async () => {
  if (!(validateResponseOn() && kakfaConfigured())) {
    return undefined;
  }
  if (!_kafkaStream) {
    _kafkaStream = await initKafkaStream();
  }
  return _kafkaStream;
};

exports.initValidatorApp = initValidatorApp;
exports.validateResponseOn = validateResponseOn;
exports.validatorApp = validatorApp;
exports.kafkaStream = kafkaStream;
exports.kakfaConfigured = kakfaConfigured;
