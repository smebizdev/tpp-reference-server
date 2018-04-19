const assert = require('assert');
const { validate } = require('../../app/validator/index.js');
const { initValidatorApp } = require('../..//app/validator/init-validator-app.js');

const { validRequest } = require('./fixtures/valid-request');
const { validResponse } = require('./fixtures/valid-response');

process.env.ACCOUNT_SWAGGER = 'https://raw.githubusercontent.com/OpenBankingUK/account-info-api-spec/ee715e094a59b37aeec46aef278f528f5d89eb03/dist/v1.1/account-info-swagger.json';
process.env.PAYMENT_SWAGGER = 'https://raw.githubusercontent.com/OpenBankingUK/payment-initiation-api-spec/96307a92e70e209e51710fab54164f6e8d2e61cf/dist/v1.1/payment-initiation-swagger.json';

describe('validate', () => {
  let app;
  before(async () => {
    app = await initValidatorApp();
  });

  describe('without response provided', () => {
    it('returns 400 status with json error object', () => {
      const response = validate(app, validRequest(), null);
      assert.equal(response.statusCode, 400);
      assert(response.body.failedValidation, true);
      assert(response.body.message, 'Response validation failed: response was blank.');
    });
  });

  describe('with valid request and response', () => {
    it('returns response status and json', () => {
      const response = validate(app, validRequest(), validResponse());
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

    it('returns 400 status with json error object', () => {
      const invalidResponse = validResponse();
      delete invalidResponse.body.Data.Balance[0].Amount;
      const response = validate(app, validRequest(), invalidResponse);
      const {
        failedValidation, message, originalResponse, results,
      } = response.body;

      assert.equal(response.statusCode, 400);
      assert(failedValidation, true);
      assert(message, 'Response validation failed: failed schema validation');
      const expected = validResponse();
      delete expected.body.Data.Balance[0].Amount;
      assert.deepEqual(JSON.parse(originalResponse), expected.body);
      assert.deepEqual(results, validationResults);
    });
  });
});
