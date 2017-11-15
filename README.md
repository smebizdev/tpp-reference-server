# TPP Reference Server

This application simulates a typical Third Party Provider (TPP) backend server.
Its primary function is to provide Open Banking processes to a client.

The implementation uses
[Node.js](https://nodejs.org/),
[express](https://github.com/expressjs/express),
and
[express-http-proxy](https://github.com/villadora/express-http-proxy).

## Use cases

__Work in progress__ - so far we provide,

* Authenticating with the server.
* List ASPSP Authorisation and Resource Servers - actual & simulated based on ENVs.
* Proxy requests for upstream backend [ASPSP Read/Write APIs](https://www.openbanking.org.uk/read-write-apis/).

### Authenticating with the server.

#### Login

```sh
curl -X POST --data 'u=alice&p=wonderland' http://localhost:8003/login
```

This returns a session ID token as a `sid`. Use this for further authorized access.

This is an example.

```sh
{
  "sid": "896beb20-affc-11e7-a5e6-a941c8c37252"
}
```

#### Logout

Please __change__ the `Authorization` header to use the `sid` obtained after login.

This destroys the session established by the `sid` token obtained after login.

```sh
curl -X GET -H 'Authorization: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' http://localhost:8003/logout
```

### List ASPSP Authorisation and Resource Servers

#### OB Directory provisioned TPP

The server has to be configured with
* `OB_PROVISIONED=true`.
* `OB_DIRECTORY_HOST=https://<real directory>`.
* `SOFTWARE_STATEMENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.
* `SOFTWARE_STATEMENT_ASSERTION_KID=XXXXXX-XXXXxxxXxXXXxxx_xxxx`.
* `CLIENT_SCOPES='openid TPPReadAccess ASPSPReadAccess'`.
* `SIGNING_KEY=<base64 encoded private key>` - private key used to generate `Signing` cert CSR.

This forces the server to use a provisioned `SOFTWARE_STATEMENT_ID` with the correct oAuth payloads that request real data from the OB Directory.

Details in [`.env.sample`](https://github.com/OpenBankingUK/tpp-reference-server/blob/master/.env.sample).

#### OB Directory NOT provisioned TPP

The server has to be configured with
* `OB_PROVISIONED=false`.
* `OB_DIRECTORY_HOST=http://localhost:8001` - the [mock server](#the-reference-mock-server) host details.

Here we work around encrypted OB Directory communication. The mock server returns the required data.

Details in [`.env.sample`](https://github.com/OpenBankingUK/tpp-reference-server/blob/master/.env.sample).

#### Curl command

Please __change__ the `Authorization` header to use the `sid` obtained after logging in.

```sh
curl -X GET -H 'Authorization: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' http://localhost:8003/account-payment-service-provider-authorisation-servers
```

Here's a sample list of test ASPSPs. This is __NOT__ the raw response from the Open Banking Directory. It has been adapted to simulate what a typical client app would require.

```sh
[
  {
    "id": "aaaj4NmBD8lQxmL",
    "logoUri": "",
    "name": "AAA Example Bank",
    "orgId": "aaax5nTR33811QyQfi",
  },
  {
    "id": "bbbX7tUB4fPIYB0",
    "logoUri": "",
    "name": "BBB Example Bank",
    "orgId": "bbbUB4fPIYB0k1m",
  },
  {
    "id": "cccbN8iAsMh74sO",
    "logoUri": "",
    "name": "CCC Example Bank",
    "orgId": "cccMh74sOXhk",
  }
]
```

### Adding Client Credentials

There is a script to input and store client credentials against ASPSP Auth Server Records

Example Usages

```
# Locally
npm run saveCreds authServerId=123 clientId=456 clientSecret=789  

# Remotely
heroku run npm run saveCreds authServerId=123 clientId=456 clientSecret=789 --env tpp-reference-server

```

### Proxy requests for upstream backend ASPSP APIs (v1.1)

__NOTE:__ For this to work you need an ASPSP server installed and running. Details in The [mock server](#the-reference-mock-server) section.

#### Proxied API path

To interact with proxied Open Banking Read/Write APIs please use the path `/open-banking/[api_version]` in all requests.

For example `/open-banking/v1.1` gives access to the 1.1 Read write Apis.

#### GET Accounts for a user (Account and Transaction API)

We have a hardcoded demo user `alice` with bank `abcbank` setup in [mock server](https://github.com/OpenBankingUK/reference-mock-server). To access demo accounts for this user please setup the following `ENVS` (already configured in [`.env.sample`](https://github.com/OpenBankingUK/tpp-reference-server/blob/master/.env.sample).

* `AUTHORIZATION=alice`.
* `X_FAPI_FINANCIAL_ID=abcbank`.

```sh
curl -X GET -H 'Authorization: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' -H 'Accept: application/json'  http://localhost:8003/open-banking/v1.1/accounts
```

[Here's a sample response](https://www.openbanking.org.uk/read-write-apis/account-transaction-api/v1-1-0/#accounts-bulk-response).

#### GET Product associated with an account (Account and Transaction API)

Using the same demo account as above.

```sh
curl -X GET -H 'Authorization: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' -H 'Accept: application/json'  http://localhost:8003/open-banking/v1.1/accounts/22289/product
```

[Here's a sample response](https://www.openbanking.org.uk/read-write-apis/account-transaction-api/v1-1-0/#product-specific-account-response).

#### GET Balances associated with an account (Account and Transaction API)

Using the same demo account as above.

```sh
curl -X GET -H 'Authorization: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' -H 'Accept: application/json'  http://localhost:8003/open-banking/v1.1/accounts/22289/balances
```

[Here's a sample response](https://www.openbanking.org.uk/read-write-apis/account-transaction-api/v1-1-0/#balances-specific-account-response).

## Installation

### Dependencies

#### NodeJS

We assume [NodeJS](https://nodejs.org/en/) ver8.4+ is installed.

On Mac OSX, use instructions here [Installing Node.js Tutorial](https://nodesource.com/blog/installing-nodejs-tutorial-mac-os-x/).

On Linux, use instructions in [How To Install Node.js On Linux](https://www.ostechnix.com/install-node-js-linux/).

On Windows, use instructions provided here [Installing Node.js Tutorial: Windows](https://nodesource.com/blog/installing-nodejs-tutorial-windows/).

#### Redis

On Mac OSX, you can install via [homebrew](https://brew.sh). Then.

```sh
brew install redis
```

On Linux, use instructions in the [Redis Quick Start guide](https://redis.io/topics/quickstart).

On Windows, use instructions provided here [Installing Redis on a Windows Workstation](https://essenceofcode.com/2015/03/18/installing-redis-on-a-windows-workstation/).

Then set the environment variables `REDIS_PORT` and `REDIS_HOST` as per redis instance. Example in [`.env.sample`](https://github.com/OpenBankingUK/tpp-reference-server/blob/master/.env.sample)

#### MongoDB

On Mac OSX, you can install via [homebrew](https://brew.sh). Then

```sh
brew install mongodb
```

On Linux, use instructions in the [Install MongoDB Community Edition on Linux](https://docs.mongodb.com/manual/administration/install-on-linux/).

On Windows, use instructions provided here [Install MongoDB Community Edition on Windows](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/).

Then set the environment variable `MONGODB_URI` as per your mongodb instance, e.g. `MONGODB_URI=mongodb://localhost:27017/sample-tpp-server`. Example in [`.env.sample`](https://github.com/OpenBankingUK/tpp-reference-server/blob/master/.env.sample)

#### The Reference Mock Server

We have a [reference mock server](https://github.com/OpenBankingUK/reference-mock-server) that provides simulated endpoints to showcase what the Read/Write API can provide. Please install and run the server as per instructions on the [Github page](https://github.com/OpenBankingUK/reference-mock-server).

> Make sure you run the mock API against v1.1, e.g. `VERSION=v1.1 npm run start`.

Then ensure you point to the above server by configuring the `ASPSP_READWRITE_HOST` endpoint either directly or using in the [`.env.sample`](https://github.com/OpenBankingUK/tpp-reference-server/blob/master/.env.sample) file. Find details in the [To run locally](https://github.com/OpenBankingUK/tpp-reference-server#to-run-locally) section.

### Server setup

Install npm packages:

```sh
npm install
```

## To run locally

To run using .env file, make a local .env, and run using foreman:

```sh
cp .env.sample .env
npm run foreman
# [OKAY] Loaded ENV .env File as KEY=VALUE Format
# web.1 | log App listening on port 8003 ...
```

Or run with environment variables set on the command line:

```sh
DEBUG=error,log \
  ASPSP_AUTH_SERVER=http://localhost:8001 \
  ASPSP_AUTH_SERVER_CLIENT_ID=spoofClientId \
  ASPSP_AUTH_SERVER_CLIENT_SECRET=spoofClientSecret \
  ASPSP_READWRITE_HOST=localhost:8001 \
  OB_PROVISIONED=false \
  OB_DIRECTORY_HOST=http://localhost:8001 \
  MTLS_ENABLED=false \
  TRANSPORT_CERT='' \
  SIGNING_CERT='' \
  SIGNING_KEY='' \
  AUTHORIZATION=alice \
  X_FAPI_FINANCIAL_ID=abcbank \
  MONGODB_URI=mongodb://localhost:27017/sample-tpp-server \
  PORT=8003 \
  npm start
#   log  App listening on port 8003 ...
```

* Set debug log levels using `DEBUG` env var.
* Set API host using `ASPSP_READWRITE_HOST` env var.
* Set hardcoded auth token using `AUTHORIZATION` env var.
* Set OB Provisioned status using `OB_PROVISIONED` env var.
* Set OB Directory host using `OB_DIRECTORY_HOST` env var.
* Set OB Directory access_token using `OB_DIRECTORY_ACCESS_TOKEN` env var.
* Set hardcoded x-fapi-financial-id using `X_FAPI_FINANCIAL_ID` env var.
* Set the environment variables `REDIS_PORT` and `REDIS_HOST` as per your redis instance.
Set the environment variables `MONGODB_URI` as per your mongodb instance.

### Already provisioned with OB Directory

As a TPP, if you have been provisioned with the Open Banking Directory and have already setup a Software Statement, then update/add the `OB_*` ENVs as discussed in [OB Directory provisioned section](#ob-directory-provisioned-tpp).

## Deploy to heroku

To deploy to heroku for the first time:

```sh
npm install -g heroku-cli
```

To verify your CLI installation use the heroku --version command.

```sh
heroku --version
```

Setup application.

```sh
heroku login

heroku create --region eu <newname>

heroku addons:create redistogo # or any other redis add-on
heroku addons:create mongolab:sandbox

heroku config:set ASPSP_AUTH_SERVER=http://aspsp-auth-server.example.com
heroku config:set ASPSP_AUTH_SERVER_CLIENT_ID=spoofClientId
heroku config:set ASPSP_AUTH_SERVER_CLIENT_SECRET=spoofClientSecret
heroku config:set ASPSP_READWRITE_HOST=aspsp-resource-server.example.com
heroku config:set ASPSP_RESOURCE_SERVER=http://aspsp-resource-server.example.com
heroku config:set AUTHORIZATION=<mock-token>
heroku config:set X_FAPI_FINANCIAL_ID=<mock-id>
heroku config:set DEBUG=error,log
heroku config:set OB_PROVISIONED=false
heroku config:set OB_DIRECTORY_HOST=http://ob-directory.example.com
heroku config:set SOFTWARE_STATEMENT_REDIRECT_URL=http://<host>/tpp/authorized
heroku config:set MTLS_ENABLED=false
heroku config:set OB_ISSUING_CA=''
heroku config:set TRANSPORT_CERT=''
heroku config:set TRANSPORT_KEY=''

git push heroku master
```

Edit `./Procfile` to change what command should be executed to start the app.

### Already provisioned with OB Directory

As a TPP, if you have been provisioned with the Open Banking Directory and have already setup a Software Statement, then update/add the `OB_*` ENVs as discussed in [OB Directory provisioned section](#ob-directory-provisioned-tpp).

## Testing

Run unit tests with:

```sh
npm run test
```

Run tests continuously on file changes in watch mode via:

```sh
npm run test:watch
```


Manual Testing  
Sending Form Data to login with POstman - use `x-www-form-urlencoded`


## eslint

Run eslint checks with:

```sh
npm run eslint
```

## Using mTLS

The OpenBanking specification requires parties to use [Mutual TLS authentication](https://en.wikipedia.org/wiki/Mutual_authentication) for every connection. OpenBanking uses its own Certification Authority (certificate created from OpenBanking Root certificate) to sign clients (TPP) and servers (ASPSP) certificates.

- For the ASPSP server, a certificate paired with a certificate key and CA certificate are used to secure resources provided by servers.

- For the TPP client, a certificate paired with a certificate key and CA certificate are used to establish a secured connection with servers, including `ASPSP Authorization`/`Resource Server`, `OpenBanking Directory` and `OpenId` Configuration.

### Running against The Reference Mock Server

This __DOES NOT__ require setting up `MTLS`.

The server has to be configured with (this is default)
* `MTLS_ENABLED=false`.

### Running against OpenBanking Directory with an ASPSP reference sandbox

If you are [already provisioned with OpenBanking Directory](#ob-directory-provisioned-tpp)
and want to interact with an ASPSP reference sandbox listed on OB Directory,
then ensure

* You have downloaded the required `Transport` and `Signing` Certs (follow OB
   Directory issued instructions).

* You have access to the `private key` used when generating the `Signing` Cert CSR.

The server has to be configured with
* `MTLS_ENABLED=true`.
* `OB_ISSUING_CA=<base64 encoded cert>` (CA) - Downloaded / base64 encoded `OB Issuing CA` cert from OB Directory.
* `TRANSPORT_CERT=<base64 encoded cert>` (CERT) - Downloaded / base64 encoded `Transport` cert from OB Directory console.
* `TRANSPORT_KEY=<base64 encoded private key>` (KEY) - private key used to generate `Transport` cert CSR.

### Configuration of ASPSP Authorisation Servers

When the `/account-payment-service-provider-authorisation-servers` endpoint is
called on the server, a list of ASPSP authorisation servers is fetched from
OB Directory and stored in the server's database.

For each authorisation server the OpenId config is fetched and stored in the
database.

To list authorisation servers currently in the database, run:

```sh
npm run listAuthServers --silent
```

Output on terminal is TSV that looks like this:
```
id               CustomerFriendlyName OrganisationCommonName Authority  OBOrganisationId   clientCredentialsPresent openIdConfigPresent
aaaj4NmBD8lQxmL  AAA Example Bank     AAA Example PLC        GB:FCA:123 aaax5nTR33811QyQfi false                    false
bbbX7tUB4fPIYB0  BBB Example Bank     BBB Example PLC        GB:FCA:456 bbbUB4fPIYB0k1m    false                    false
cccbN8iAsMh74sO  CCC Example Bank     CCC Example PLC        GB:FCA:789 cccMh74sOXhk       false                    false
```
