const validResponse = () => ({
  statusCode: 200,
  headers: {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET',
    'access-control-allow-headers': '',
    'access-control-allow-credentials': 'false',
    'access-control-max-age': '0',
    'content-type': 'application/json; charset=utf-8',
    'content-length': '621',
    'etag': 'W/"26d-/CEtMNK6kuJdSw//7SDW6kTgV90"',
    'date': 'Wed, 07 Feb 2018 11:58:01 GMT',
    'connection': 'close',
  },
  body: {
    Data: {
      Balance: [
        {
          AccountId: '22292',
          Amount: {
            Amount: '15000.00',
            Currency: 'GBP',
          },
          CreditDebitIndicator: 'Credit',
          Type: 'OpeningBooked',
          DateTime: '2017-04-05T10:43:07+00:00',
          CreditLine: [
            {
              Included: true,
              Amount: {
                Amount: '1000.00',
                Currency: 'GBP',
              },
              Type: 'Pre-Agreed',
            },
          ],
        },
        {
          AccountId: '22292',
          Amount: {
            Amount: '15000.00',
            Currency: 'GBP',
          },
          CreditDebitIndicator: 'Credit',
          Type: 'OpeningAvailable',
          DateTime: '2017-04-05T10:43:07+00:00',
          CreditLine: [
            {
              Included: true,
              Amount: {
                Amount: '1000.00',
                Currency: 'GBP',
              },
              Type: 'Pre-Agreed',
            },
          ],
        },
      ],
    },
    Links: {
      Self: '/accounts/22292/balances',
    },
    Meta: {
      TotalPages: 1,
    },
  },
});

exports.validResponse = validResponse;
