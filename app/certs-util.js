
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const caCert = Buffer.from(process.env.CA_CERT || '', 'base64').toString();
const clientCert = Buffer.from(process.env.CLIENT_CERT || '', 'base64').toString();
const clientKey = () => Buffer.from(process.env.CLIENT_KEY || '', 'base64').toString();

const decorate = agent => agent.key(clientKey()).cert(clientCert).ca(caCert);

exports.decorate = decorate;
exports.caCert = caCert;
exports.clientCert = clientCert;
exports.clientKey = clientKey;

