'use strict';

const test = require('ava');
const proxyquire = require('proxyquire');

const inquirerMock = require('../helpers/inquirer.js');
const blinkmrcMock = require('../helpers/blinkmrc.js');
const requestMock = require('../helpers/request.js');

const TEST_SUBJECT = '../../lib/login-providers/login-provider-base.js';
const constants = require('../../lib/constants.js');

const CLIENT_ID = 'valid client id';
const CLIENT_NAME = 'valid client name';
const JWT = 'valid jwt';
const USERNAME = 'username';
const PASSWORD = 'password';
const CONNECTION = 'username-password';
const MESSAGE = 'prompt message: ';
const CODE = 'abc123';

test.beforeEach((t) => {
  t.context.blinkmrc = blinkmrcMock(() => {
    return Promise.resolve({accessToken: JWT});
  });

  t.context.request = requestMock((url, data, callback) => {
    callback(null, {}, {
      id_token: JWT
    });
  });

  t.context.inquirer = inquirerMock((questions) => {
    return Promise.resolve({
      code: CODE
    });
  });
});

test.cb('storeJWT() should return valid jwt', (t) => {
  const LoginProviderBase = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': t.context.request,
    'blinkmrc': t.context.blinkmrc
  });
  const loginProviderBase = new LoginProviderBase(CLIENT_ID, CLIENT_NAME);

  loginProviderBase.storeJWT(JWT)
    .then((jwt) => {
      t.is(jwt, JWT);
      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('requestJWT() should return valid jwt', (t) => {
  const LoginProviderBase = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': t.context.request,
    'blinkmrc': t.context.blinkmrc
  });
  const loginProviderBase = new LoginProviderBase(CLIENT_ID, CLIENT_NAME);

  loginProviderBase.requestJWT(USERNAME, PASSWORD, CONNECTION)
    .then((jwt) => {
      t.is(jwt, JWT);
      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('requestJWT() request for jwt should use correct data and url', (t) => {
  const LoginProviderBase = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': requestMock((url, body, callback) => {
      t.is(url, `${constants.AUTH0_URL}/oauth/ro`);
      t.deepEqual(body.json, {
        connection: CONNECTION,
        username: USERNAME,
        password: PASSWORD,
        client_id: CLIENT_ID,
        grant_type: 'password',
        scope: 'openid'
      });
      t.end();
      callback(null, {}, {});
    }),
    'blinkmrc': t.context.blinkmrc
  });
  const loginProviderBase = new LoginProviderBase(CLIENT_ID, CLIENT_NAME);

  loginProviderBase.requestJWT(USERNAME, PASSWORD, CONNECTION)
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('requestJWT() should reject if request returns an error', (t) => {
  const LoginProviderBase = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': requestMock((url, body, callback) => {
      callback('Test error message');
    }),
    'blinkmrc': t.context.blinkmrc
  });
  const loginProviderBase = new LoginProviderBase(CLIENT_ID, CLIENT_NAME);

  loginProviderBase.requestJWT(USERNAME, PASSWORD, CONNECTION)
    .then(() => {
      t.fail();
      t.end();
    })
    .catch(error => {
      t.is(error, 'Test error message');
      t.end();
    });
});

test.cb('requestJWT() should reject if request returns an bad connection error in the body', (t) => {
  const LoginProviderBase = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': requestMock((url, body, callback) => {
      callback(null, {}, {
        error: 'error code',
        error_description: 'test error message'
      });
    }),
    'blinkmrc': t.context.blinkmrc
  });
  const loginProviderBase = new LoginProviderBase(CLIENT_ID, CLIENT_NAME);

  loginProviderBase.requestJWT(USERNAME, PASSWORD, CONNECTION)
    .then(() => {
      t.fail();
      t.end();
    })
    .catch(error => {
      t.is(error, 'error code: test error message');
      t.end();
    });
});

test.cb('promptForCode() should prompt with the messge passed in', (t) => {
  const LoginProviderBase = proxyquire(TEST_SUBJECT, {
    'inquirer': inquirerMock((questions) => {
      t.is(questions.length, 1);
      t.deepEqual(questions[0], {
        type: 'input',
        name: 'code',
        message: MESSAGE
      });
      t.end();
      return Promise.resolve({
        code: CODE
      });
    }),
    'request': t.context.request,
    'blinkmrc': t.context.blinkmrc
  });
  const loginProviderBase = new LoginProviderBase(CLIENT_ID, CLIENT_NAME);

  loginProviderBase.promptForCode(MESSAGE, USERNAME, CONNECTION)
    .catch((error) => {
      console.log(error);
      t.fail();
      t.end();
    });
});

test.cb('promptForCode() should reject if prompt does not return code', (t) => {
  const LoginProviderBase = proxyquire(TEST_SUBJECT, {
    'inquirer': inquirerMock((questions) => {
      return Promise.resolve({
        code: ''
      });
    }),
    'request': t.context.request,
    'blinkmrc': t.context.blinkmrc
  });
  const loginProviderBase = new LoginProviderBase(CLIENT_ID, CLIENT_NAME);

  loginProviderBase.promptForCode(MESSAGE, USERNAME, CONNECTION)
    .then(() => {
      t.fail();
      t.end();
    })
    .catch(error => {
      t.is(error, 'Verification code was not specified.');
      t.end();
    });
});
