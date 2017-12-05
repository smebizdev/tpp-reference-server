const { set, get } = require('../storage');
const assert = require('assert');


const persistPaymentDetails = async (paymentIdemId, paymentId,
  CreditorAccount, InstructedAmount) => {
  assert(paymentIdemId);
  assert(paymentId);
  const paymentDetails = Object.assign({}, { PaymentId: paymentId }, { CreditorAccount }, { InstructedAmount });

  await set('payments', paymentDetails, paymentIdemId);
};

const retrievePaymentDetails = async (paymentIdemId) => {
  assert(paymentIdemId);
  return get('payments', paymentIdemId);
};


exports.persistPaymentDetails = persistPaymentDetails;
exports.retrievePaymentDetails = retrievePaymentDetails;
