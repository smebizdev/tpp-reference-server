const express = require('express');
const { replayMiddleware } = require('./replay-middleware');
const { validationErrorMiddleware } = require('./validation-error-middleware');
const { swaggerMiddleware } = require('./swagger-middleware');
const { KafkaStream } = require('./kafka-stream');

const accountsSwagger = () => process.env.ACCOUNT_SWAGGER;
const paymentsSwagger = () => process.env.PAYMENT_SWAGGER;
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

const initValidatorApp = async () => {
  const app = express();
  app.disable('x-powered-by');
  await addValidationMiddleware(app, accountsSwagger(), 'account-swagger.json');
  await addValidationMiddleware(app, paymentsSwagger(), 'payment-swagger.json');
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

let _validatorApp; // eslint-disable-line
let _kafkaStream; // eslint-disable-line

const validatorApp = async () => {
  if (!validateResponseOn()) {
    return undefined;
  }
  if (!_validatorApp) {
    _validatorApp = await initValidatorApp();
  }
  return _validatorApp;
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
