const { fapiFinancialIdFor } = require('../authorisation-servers');
const uuidv4 = require('uuid/v4');
const { getUsername } = require('./session');

const parseMultiValueHeader = (headers, header) => {
  const SPLIT_REGEX = ' ';

  if (headers[header] && headers[header].length > 0) {
    return headers[header].split(SPLIT_REGEX);
  }

  return [];
};

exports.extractHeaders = async (headers) => {
  const sessionId = headers['authorization'];
  const authorisationServerId = headers['x-authorization-server-id'];
  const fapiFinancialId = await fapiFinancialIdFor(authorisationServerId);
  const interactionId = headers['x-fapi-interaction-id'] || uuidv4();
  const username = await getUsername(sessionId);
  const validationRunId = headers['x-validation-run-id'];
  const accountSwaggers = parseMultiValueHeader(headers, 'x-account-swaggers');
  let permissions = headers['x-permissions'];
  if (permissions) {
    permissions = permissions.split(' ');
  }

  const extracted = {
    authorisationServerId,
    fapiFinancialId,
    interactionId,
    sessionId,
    username,
    validationRunId,
    accountSwaggers,
    permissions,
  };

  return extracted;
};
