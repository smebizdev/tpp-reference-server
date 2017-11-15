const { updateClientCredentials } = require('../app/authorisation-servers');
const error = require('debug')('error');

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [k, v = true] = arg.split('=');
  acc[k] = v;
  return acc;
}, {});

const addClientCredentials = () => {
  if (!args.authServerId || !args.clientId || !args.clientSecret) {
    throw new Error('authServerId, clientId, and clientSecret must ALL be present!');
  }
  try {
    updateClientCredentials(args.authServerId, {
      clientId: args.clientId,
      clientSecret: args.clientSecret,
    });
  } catch (e) {
    error(e);
  }
  process.exit();
};

addClientCredentials();

exports.addClientCredentials = addClientCredentials;
