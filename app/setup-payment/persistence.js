const { set, get } = require('../storage');
const assert = require('assert');

const prepId = (authorisationServerId, paymentId) => {
  assert(authorisationServerId, 'Authorisation Server id not provided');
  assert(paymentId, 'Payment id not provided');
  return `${authorisationServerId}-${paymentId}`;
};

const persistPaymentDetails = async (fapiFinancialId, paymentId,
  CreditorAccount, InstructedAmount) => {
  const id = prepId(fapiFinancialId, paymentId);
  const paymentDetails = Object.assign({}, { CreditorAccount }, { InstructedAmount });

  await set('payments', paymentDetails, id);
};

const retrievePaymentDetails = async (fapiFinancialId, paymentId) => get('payments', prepId(fapiFinancialId, paymentId));


exports.persistPaymentDetails = persistPaymentDetails;
exports.retrievePaymentDetails = retrievePaymentDetails;
