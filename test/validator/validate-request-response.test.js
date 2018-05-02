const assert = require('assert');
const { validate, logFormat } = require('../../app/validator');

const { validRequest } = require('./fixtures/valid-request');
const { validResponse } = require('./fixtures/valid-response');

process.env.ACCOUNT_SWAGGER = process.env.ACCOUNT_SWAGGER || 'https://raw.githubusercontent.com/OpenBankingUK/account-info-api-spec/ee715e094a59b37aeec46aef278f528f5d89eb03/dist/v1.1/account-info-swagger.json';
process.env.PAYMENT_SWAGGER = process.env.PAYMENT_SWAGGER || 'https://raw.githubusercontent.com/OpenBankingUK/payment-initiation-api-spec/96307a92e70e209e51710fab54164f6e8d2e61cf/dist/v1.1/payment-initiation-swagger.json';

const invalidResponse = () => {
  const response = validResponse();
  delete response.body.Data.Balance[0].Amount;
  return response;
};

const details = {
  interactionId: '590bcc25-517c-4caf-a140-077b41ffe095',
  sessionId: '2789f200-4960-11e8-b019-35d9f0621d63',
  authorisationServerId: 'testAuthServerId',
};

describe('validate', () => {
  before(() => {
    process.env.VALIDATE_RESPONSE = 'true';
  });

  after(() => {
    delete process.env.VALIDATE_RESPONSE;
  });

  describe('without response provided', () => {
    it('returns 400 status with json error object', async () => {
      const response = await validate(validRequest(), null, details);
      assert.equal(response.statusCode, 400);
      assert.equal(response.body.failedValidation, true);
      assert.equal(response.body.message, 'Response validation failed: response was blank.');
    });
  });

  describe('with valid request and response', () => {
    it('returns response status and json', async () => {
      const response = await validate(validRequest(), validResponse(), details);
      const expected = validResponse();
      assert.equal(response.statusCode, expected.statusCode);
      assert.deepEqual(response.headers, expected.headers);
      assert.deepEqual(response.body, expected.body);
    });
  });

  describe('with valid request and invalid response', () => {
    const validationResults = {
      errors: [{
        code: 'OBJECT_MISSING_REQUIRED_PROPERTY',
        message: 'Missing required property: Amount',
        path: ['Data', 'Balance', '0'],
        description: 'Balance',
      }],
      warnings: [],
    };

    it('returns 400 status with json error object', async () => {
      const response = await validate(validRequest(), invalidResponse(), details);
      const {
        failedValidation, message, originalResponse, results,
      } = response.body;

      assert.equal(response.statusCode, 400);
      assert(failedValidation, true);
      assert(message, 'Response validation failed: failed schema validation');
      const expected = invalidResponse();
      assert.deepEqual(JSON.parse(originalResponse), expected.body);
      assert.deepEqual(results, validationResults);
    });

    it('and logFormat returns output object for logging', async () => {
      const response = await validate(validRequest(), invalidResponse(), details);
      const { failedValidation, message, results } = response.body;
      const output = logFormat(validRequest(), invalidResponse(), details, response);

      assert.deepEqual(output.request, validRequest());
      assert.deepEqual(output.response, invalidResponse());
      assert.deepEqual(output.details, details);
      assert.ok(output.report, 'expect output object to contain report property');
      const expectedReport = {
        failedValidation,
        message,
        results,
      };
      assert.deepEqual(output.report, expectedReport);
    });
  });
});
