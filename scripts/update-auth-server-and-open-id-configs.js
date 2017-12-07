const path = require('path');
const dotenv = require('dotenv');

dotenv.load({ path: path.join(__dirname, '..', '.env') });

const { updateOpenIdConfigs } = require('../app/authorisation-servers');
const { fetchOBAccountPaymentServiceProviders } = require('../app/ob-directory');

const cacheLatestConfigs = async () => {
  await fetchOBAccountPaymentServiceProviders();
  await updateOpenIdConfigs();
};

cacheLatestConfigs().then(() => {
  if (process.env.NODE_ENV !== 'test') {
    process.exit();
  }
});

exports.cacheLatestConfigs = cacheLatestConfigs;
