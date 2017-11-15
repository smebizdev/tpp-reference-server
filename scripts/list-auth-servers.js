const { allAuthorisationServers } = require('../app/authorisation-servers');

const authServerRows = async () => {
  const header = [
    'id',
    'CustomerFriendlyName',
    'OrganisationCommonName',
    'OBOrganisationId',
    'clientCredentialsPresent',
    'openIdConfigPresent',
  ].join('\t');
  const rows = [header];
  const list = await allAuthorisationServers();
  list.forEach((item) => {
    const config = item.obDirectoryConfig;
    const line = [
      item.id,
      config ? config.CustomerFriendlyName : '',
      config ? config.OrganisationCommonName : '',
      config ? config.OBOrganisationId : '',
      !!item.clientCredentials,
      !!item.openIdConfig,
    ].join('\t');
    rows.push(line);
  });
  return rows;
};

authServerRows().then((rows) => {
  if (process.env.NODE_ENV !== 'test') {
    rows.forEach(row => console.log(row)); // eslint-disable-line
    process.exit();
  }
});

exports.authServerRows = authServerRows;
