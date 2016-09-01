# bm-identity.js [![npm](https://img.shields.io/npm/v/@blinkmobile/bm-identity.svg?maxAge=2592000)](https://www.npmjs.com/package/@blinkmobile/bm-identity) [![Travis CI Status](https://travis-ci.org/blinkmobile/bm-identity.js.svg?branch=master)](https://travis-ci.org/blinkmobile/bm-identity.js)

Provides easy management of authenication for our CLI via a single identity.

## Getting Started

```sh
npm install @blinkmobile/bm-identity.js --save
```

```js
const pkg = require('./package.json');
const BlinkMobileIdentity = require('@blinkmobile/bm-identity.js');
const blinkMobileIdentity = new BlinkMobileIdentity(pkg.name);
```

## Usage

`BlinkMobileIdentity` can be used for two purposes

### 1. Internal Use

Functions for the following:

#### login

If no LoginOptions are passed, a browser based login process will start. This is how users can login using a social account e.g. Google.

```js
login (options: LoginOptions) => Promise{String}
```

```js
interface LoginOptions {
  username? : String|Boolean, // Can also pass true, and username will be prompted for
  password? : String, // Will be prompted for password if username is truthy
  email? : String|Boolean, // Can also pass true to be prompted for email address
  sms? : String|Boolean, // Can also pass true to be prompted for phone number
}
```

```js
blinkMobileIdentity.login()
  .then(jwt => {
    // Use jwt access token.
  });
```

#### Logout

```js
logout () => Promise
```

```js
blinkMobileIdentity.logout();
```

#### Assume AWS Role

```js
assumeAWSRole () => Promise{AssumedRoleCredentials}
```

```js
interface AssumedRoleCredentials {
  accessKeyId : String,
  secretAccessKey : String,
  sessionToken : String
}
```

### 2. Extend Existing CLI

Extending an existing CLI with login and logout commands will allow for these commands to be used from the command line

The login and logout commands internally call the login and logout functions from `BlinkMobileIdentity`

#### Useage

```
login                       => start the login process, if no flags are passed, a browser based login will begin
  --username <username>     => username to login with, if password is not specified, you will be prompted for it
  --password <password>	    => password to login with, requires the username flag as well
  --email <email>           => email address to send code to for passwordless authentication
  --sms <phone>             => phone number to send code to for passwordless authentication

logout                      => logout of the service being extended
```

#### Examples

```
bm service login --username                     => Start a username and password login process which will prompt for both
bm service login --username email@provider.com  => Start a username and password login process which will prompt for password only
bm service login --email                        => Start a passwordless email login process which will prompt for an email address
bm service login --sms +61412345678             => Start a passwordless sms login process
bm service login                                => Start a browser based login process.
bm service logout                               => Start the logout process.
```
