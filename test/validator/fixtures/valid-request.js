const validRequest = () => ({
  method: 'GET',
  url: 'http://localhost:8001/open-banking/v1.1/accounts/22292/balances',
  path: '/open-banking/v1.1/accounts/22292/balances',
  headers: {
    'Authorization': 'Bearer 2YotnFZFEjr1zCsicMWpAA',
    'Accept': 'application/json',
    'x-fapi-financial-id': 'aaax5nTR33811QyQfi',
    'x-fapi-interaction-id': '0f2253b5-30bb-40a2-93f6-0708b4e76325',
  },
});

exports.validRequest = validRequest;
