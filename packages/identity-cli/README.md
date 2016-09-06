# Blink Identity CLI Tool [![npm](https://img.shields.io/npm/v/@blinkmobile/identity-cli.svg?maxAge=2592000)](https://www.npmjs.com/package/@blinkmobile/identity-cli) [![Travis CI Status](https://travis-ci.org/blinkmobile/identity-cli.svg?branch=master)](https://travis-ci.org/blinkmobile/identity-cli)

Provides easy management of authenication for our CLI via a single identity.

## Installation

```sh
npm install -g @blinkmobile/cli @blinkmobile/identity-cli
```

## Usage

`blinkm identity --help`

or, shorter

`bm identity --help`

### Help

```sh
login                       => start the login process, if no flags are passed, a browser based login will begin
  --username <username>     => username to login with, if password is not specified, you will be prompted for it
  --password <password>	    => password to login with, requires the username flag as well
  --email <email>           => email address to send code to for passwordless authentication
  --sms <phone>             => phone number to send code to for passwordless authentication

logout                      => logout of the service being extended
```

### Examples

```sh
bm service login --username                     => Start a username and password login process which will prompt for both
bm service login --username email@provider.com  => Start a username and password login process which will prompt for password only
bm service login --email                        => Start a passwordless email login process which will prompt for an email address
bm service login --sms +61412345678             => Start a passwordless sms login process
bm service login                                => Start a browser based login process.
bm service logout                               => Start the logout process.
```
