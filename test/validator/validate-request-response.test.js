const assert = require('assert');
const { runValidation, logFormat } = require('../../app/validator/validate-request-response');
const { validate } = require('../../app/validator');

const { validRequest } = require('./fixtures/valid-request');
const { validResponse } = require('./fixtures/valid-response');
const Transactions = require('./fixtures/transactions').default;

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
  validationRunId: 'testValidationRunId',
  scope: 'accounts',
};

describe('validate', () => {
  before(() => {
    process.env.VALIDATE_RESPONSE = 'true';
  });

  after(() => {
    delete process.env.VALIDATE_RESPONSE;
  });

  describe('without response provided', () => {
    it('returns failedValidation true with message', async () => {
      const response = await validate(validRequest(), null, details);
      assert.equal(response.failedValidation, true);
      assert.equal(response.message, 'Response validation failed: response was blank.');
    });
  });

  describe('with valid request and response', () => {
    it('returns failedValidation false', async () => {
      const response = await validate(validRequest(), validResponse(), details);
      assert.equal(response.failedValidation, false);
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

    it('returns failedValidation true with message and errors', async () => {
      const response = await validate(validRequest(), invalidResponse(), details);
      const expected = {
        failedValidation: true,
        message: 'Response validation failed: failed schema validation',
        results: validationResults,
      };
      assert.deepEqual(response, expected);
    });

    it('and logFormat returns output object for logging', async () => {
      const response = await runValidation(validRequest(), invalidResponse(), details);
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

  describe('with x-account-swaggers header', () => {
    it('returns failedValidation false on basic with basic accountSwaggers', async () => {
      const detailsWithAccountSwaggers = Object.assign({}, details, {
        accountSwaggers: [
          'https://raw.githubusercontent.com/OpenBankingUK/account-info-api-spec/refapp-295-permission-specific-swagger-files/dist/v1.1.1/account-info-swagger-basic.json',
        ],
        scope: undefined,
      });

      const response = await validate(
        Transactions.valid().request,
        Transactions.valid().basic,
        detailsWithAccountSwaggers,
      );

      // console.error('response:', JSON.stringify(response));
      assert.deepEqual(
        response,
        { failedValidation: false },
        JSON.stringify(response),
      );
    }).timeout(1000 * 5);

    it('returns failedValidation true on detail with basic accountSwaggers', async () => {
      const detailsWithAccountSwaggers = Object.assign({}, details, {
        accountSwaggers: [
          'https://raw.githubusercontent.com/OpenBankingUK/account-info-api-spec/refapp-295-permission-specific-swagger-files/dist/v1.1.1/account-info-swagger-basic.json',
        ],
        scope: undefined,
      });

      const response = await validate(
        Transactions.valid().request,
        Transactions.valid().detail,
        detailsWithAccountSwaggers,
      );

      // console.error('response:', JSON.stringify(response));
      assert.deepEqual(response, {
        failedValidation: true,
        results: {
          errors: [{
            code: 'OBJECT_ADDITIONAL_PROPERTIES',
            message: 'Additional properties not allowed: MerchantDetails,Balance,TransactionInformation',
            path: ['Data', 'Transaction', '0'],
            description: 'Provides further details on an entry in the report.',
          }],
          warnings: [],
        },
        message: 'Response validation failed: failed schema validation',
      }, JSON.stringify(response));
    }).timeout(1000 * 5);

    it('returns failedValidation false on detail with detail accountSwaggers', async () => {
      const detailsWithAccountSwaggers = Object.assign({}, details, {
        accountSwaggers: [
          'https://raw.githubusercontent.com/OpenBankingUK/account-info-api-spec/refapp-295-permission-specific-swagger-files/dist/v1.1.1/account-info-swagger-detail.json',
        ],
        scope: undefined,
      });

      const response = await validate(
        Transactions.valid().request,
        Transactions.valid().detail,
        detailsWithAccountSwaggers,
      );

      // console.error('response:', JSON.stringify(response));
      assert.deepEqual(
        response,
        { failedValidation: false },
        JSON.stringify(response),
      );
    }).timeout(1000 * 5);
  });
});
