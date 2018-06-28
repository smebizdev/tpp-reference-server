const express = require('express');
const { replayMiddleware } = require('./replay-middleware');
const { validationErrorMiddleware } = require('./validation-error-middleware');
const { swaggerMiddleware } = require('./swagger-middleware');
const { KafkaStream } = require('./kafka-stream');

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

const configureSwagger = async (scope, app) => ({
  accounts: async target => addValidationMiddleware(target, process.env.ACCOUNT_SWAGGER, 'account-swagger.json'),
  payments: async target => addValidationMiddleware(target, process.env.PAYMENT_SWAGGER, 'payment-swagger.json'),
}[scope](app));

const initValidatorApp = async (scope) => {
  const app = express();
  app.disable('x-powered-by');
  await configureSwagger(scope, app);
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

let _validators = {}; // eslint-disable-line
let _kafkaStream; // eslint-disable-line

const validatorApp = async (scope) => {
  if (!validateResponseOn()) {
    return undefined;
  }
  if (!_validators[scope] || !_validators[scope].default) {
    const app = await initValidatorApp(scope);
    _validators[scope] = { default: app };
  }
  return _validators[scope].default;
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
