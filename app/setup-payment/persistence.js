const { set, get } = require('../storage');
const assert = require('assert');


const persistPaymentDetails = async (interactionId, paymentId,
  CreditorAccount, InstructedAmount) => {
  assert(interactionId);
  assert(paymentId);
  const paymentDetails = { PaymentId: paymentId, CreditorAccount, InstructedAmount };

  await set('payments', paymentDetails, interactionId);
};

const retrievePaymentDetails = async (interactionId) => {
  assert(interactionId);
  return get('payments', interactionId);
};


exports.persistPaymentDetails = persistPaymentDetails;
exports.retrievePaymentDetails = retrievePaymentDetails;
