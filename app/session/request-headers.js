const { fapiFinancialIdFor } = require('../authorisation-servers');
const uuidv4 = require('uuid/v4');

const extractHeaders = async (headers) => {
  const sessionId = headers['authorization'];
  const authorisationServerId = headers['x-authorization-server-id'];
  const fapiFinancialId = await fapiFinancialIdFor(authorisationServerId);
  const interactionId = uuidv4();
  return { authorisationServerId, headers: { fapiFinancialId, interactionId, sessionId } };
};

exports.extractHeaders = extractHeaders;
