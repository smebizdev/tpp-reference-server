const { set, get } = require('../storage');
const assert = require('assert');

const prepId = (authorisationServerId, paymentId) => {
  assert(authorisationServerId, 'Authorisation Server id not provided');
  assert(paymentId, 'Payment id not provided');
  return `${authorisationServerId}-${paymentId}`;
};

const persistPaymentDetails = async (authorisationServerId, paymentId,
  CreditorAccount, InstructedAmount) => {
  const id = prepId(authorisationServerId, paymentId);
  const paymentDetails = Object.assign({}, { CreditorAccount }, { InstructedAmount });

  await set('payments', paymentDetails, id);
};

const retrievePaymentDetails = async (authorisationServerId, paymentId) => {
  await get('payments', prepId(authorisationServerId, paymentId));
};


exports.persistPaymentDetails = persistPaymentDetails;
exports.retrievePaymentDetails = retrievePaymentDetails;
