if (!process.env.DEBUG) process.env.DEBUG = 'error,log';

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const { session } = require('./session');
const { requireAuthorization } = require('./session');
const { requireAuthorisationServerId } = require('./authorisation-servers');
const { login } = require('./session');
const { resourceRequestHandler } = require('./request-data/ob-proxy.js');
const { OBAccountPaymentServiceProviders } = require('./ob-directory');
const { accountRequestAuthoriseConsent } = require('./setup-account-request');
const { paymentAuthoriseConsent } = require('./setup-payment');
const { paymentSubmission } = require('./submit-payment');
const { authorisationCodeGrantedHandler } = require('./authorise');

const app = express();

if (process.env.NODE_ENV !== 'test') {
  // don't log requests when testing
  app.use(morgan('dev')); // for logging
}

app.options('*', cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/login', login.authenticate);
app.use('/logout', login.logout);
app.all('/account-payment-service-provider-authorisation-servers', requireAuthorization);
app.use(
  '/account-payment-service-provider-authorisation-servers',
  OBAccountPaymentServiceProviders,
);

app.all('/account-request-authorise-consent', requireAuthorization, requireAuthorisationServerId);
app.post('/account-request-authorise-consent', accountRequestAuthoriseConsent);

app.all('/payment-authorise-consent', requireAuthorization, requireAuthorisationServerId);
app.post('/payment-authorise-consent', paymentAuthoriseConsent);

app.all('/payment-submissions', requireAuthorization, requireAuthorisationServerId);
app.post('/payment-submissions', paymentSubmission);

app.all('/tpp/authorized', requireAuthorization);
app.get('/tpp/authorized', authorisationCodeGrantedHandler);

app.all('/open-banking/*', requireAuthorization, requireAuthorisationServerId);
app.use('/open-banking', resourceRequestHandler);
app.use('/session/check', session.check);

exports.app = app;
