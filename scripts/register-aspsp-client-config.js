const path = require('path');
const dotenv = require('dotenv');
const debug = require('debug')('debug');
const error = require('debug')('error');

const ENVS = dotenv.load({ path: path.join(__dirname, '..', '.env') });
debug(`ENVs set: ${JSON.stringify(ENVS.parsed)}`);

const { updateRegisteredConfig } = require('../app/authorisation-servers');

const parseArgs = (rawArgs) => rawArgs.reduce((acc, arg) => {
    const [k, v = true] = arg.split('=');
    acc[k] = v;
    return acc;
  }, {});

// const args = process.argv.slice(2).reduce((acc, arg) => {
//   const [k, v = true] = arg.split('=');
//   acc[k] = v;
//   return acc;
// }, {});

const parseValue = (value) => {
  let result;
  try {
    result = JSON.parse(value);
  } catch (e){
    result = value;
  }
  debug(`value: ${value}`);
  return result;
};

const registerAgreedConfig = async (args) => {
  const { authServerId, field, value } = parseArgs(args);
  // if (!parsedArgs.authServerId || !parsedArgs.field || !parsedArgs.value) {
  if (!authServerId || !field || !value) {
    throw new Error('authServerId, field, and value must ALL be present!');
  }

  try {
    const config = {};
    // config[parsedArgs.field] = parseValue(parsedArgs.value);
    config[field] = parseValue(value);
    debug(`config: ${JSON.stringify(config)}`);

    // await updateRegisteredConfig(parsedArgs.authServerId, config);
    await updateRegisteredConfig(authServerId, config);
  } catch (e) {
    error(e);
  }
};

const exit = (env) => {
  if (env !== 'test') {
    process.exit();
  }
};

registerAgreedConfig(process.argv.slice(2))
  .then(() => exit(process.env.NODE_ENV))
  .catch((err) => {
    error(err);
    exit(process.env.NODE_ENV);
  });

exports.registerAgreedConfig = registerAgreedConfig;
