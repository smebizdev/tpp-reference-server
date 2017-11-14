const { allAuthorisationServers } = require('../app/authorisation-servers');

const authServerRows = async () => {
  const header = [
    'id',
    'CustomerFriendlyName',
    'orgId',
    'clientCredentialsPresent',
    'openIdConfigPresent',
  ].join('\t');
  const rows = [header];
  const list = await allAuthorisationServers();
  list.forEach((item) => {
    const line = [
      item.id,
      item.obDirectoryConfig ? item.obDirectoryConfig.CustomerFriendlyName : '',
      item.obDirectoryConfig ? item.obDirectoryConfig.orgId : '',
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
