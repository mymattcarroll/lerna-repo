'use strict';

const test = require('ava');
const proxyquire = require('proxyquire');

const requestMock = require('../helpers/request.js');
const loginProviderBaseMock = require('../helpers/login-provider-base.js');
const inquirerMock = require('../helpers/inquirer.js');
const base64urlMock = require('../helpers/base-64-url.js');

const TEST_SUBJECT = '../../lib/login-providers/browser.js';
const constants = require('../../lib/constants.js');

const CLIENT_ID = 'valid client id';
const CLIENT_NAME = 'valid client name';
const JWT = 'valid jwt';
const CODE = 'abc123';
const VERIFIER_CHALLENGE = 'verifier challenge';

test.beforeEach((t) => {
  t.context.log = console.log;
  console.log = function (content) {};

  t.context.loginProviderBase = loginProviderBaseMock((jwt) => {
    return Promise.resolve(jwt);
  });

  t.context.request = requestMock((url, body, callback) => {
    callback(null, {}, {
      id_token: JWT
    });
  });

  t.context.inquirer = inquirerMock((questions) => {
    return Promise.resolve({
      code: CODE
    });
  });

  t.context.opn = (url, options) => {};

  t.context.base64url = base64urlMock((bytes) => VERIFIER_CHALLENGE);
});

test.afterEach(t => {
  console.log = t.context.log;
});

test.cb('login() should return valid jwt', (t) => {
  const BrowserLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': t.context.request,
    'opn': t.context.opn,
    'base64url': t.context.base64url,
    './login-provider-base.js': t.context.loginProviderBase
  });
  const browserLoginProvider = new BrowserLoginProvider(CLIENT_ID, CLIENT_NAME);

  browserLoginProvider.login()
    .then((jwt) => {
      t.is(jwt, JWT);
      t.end();
    })
    .catch((error) => {
      t.fail(error);
      t.end();
    });
});

test.cb('login() should call opn with correct data in url', (t) => {
  const BrowserLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': t.context.request,
    'opn': (url, options) => {
      t.is(url, constants.AUTH0_URL +
        '/authorize' +
        '?response_type=code' +
        '&scope=openid' +
        '&client_id=' + CLIENT_ID +
        '&redirect_uri=' + constants.AUTH0_CALLBACK_URL +
        '&code_challenge=' + VERIFIER_CHALLENGE +
        '&code_challenge_method=S256');
      t.deepEqual(options, {
        wait: false
      });
      t.end();
    },
    'base64url': t.context.base64url,
    './login-provider-base.js': t.context.loginProviderBase
  });
  const browserLoginProvider = new BrowserLoginProvider(CLIENT_ID, CLIENT_NAME);

  browserLoginProvider.login()
    .catch((error) => {
      t.fail(error);
      t.end();
    });
});

test.cb('login() should log a message to the console', (t) => {
  const BrowserLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': t.context.request,
    'opn': t.context.opn,
    'base64url': t.context.base64url,
    './login-provider-base.js': t.context.loginProviderBase
  });
  const browserLoginProvider = new BrowserLoginProvider(CLIENT_ID, CLIENT_NAME);

  console.log = function (content) {
    t.is(content, 'A browser has been opened to allow you to login. Once logged in, you will be granted a verification code.');
  };

  browserLoginProvider.login()
    .then((jwt) => {
      t.end();
    })
    .catch((error) => {
      t.fail(error);
      t.end();
    });
});

test.cb('login() should prompt with the correct question', (t) => {
  const BrowserLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': inquirerMock((questions) => {
      t.is(questions.length, 1);
      t.deepEqual(questions[0], {
        type: 'input',
        name: 'code',
        message: 'Please enter the code: '
      });
      t.end();
      return Promise.resolve({
        code: CODE
      });
    }),
    'request': t.context.request,
    'opn': t.context.opn,
    'base64url': t.context.base64url,
    './login-provider-base.js': t.context.loginProviderBase
  });
  const browserLoginProvider = new BrowserLoginProvider(CLIENT_ID, CLIENT_NAME);

  browserLoginProvider.login()
    .catch((error) => {
      t.fail(error);
      t.end();
    });
});

test.cb('login() should make request with the correct url and data', (t) => {
  const BrowserLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': requestMock((url, body, callback) => {
      t.is(url, `${constants.AUTH0_URL}/oauth/token`);
      t.deepEqual(body.json, {
        code: CODE,
        code_verifier: VERIFIER_CHALLENGE,
        client_id: CLIENT_ID,
        grant_type: 'authorization_code',
        redirect_uri: constants.AUTH0_CALLBACK_URL
      });
      t.end();
      callback(null, {}, {});
    }),
    'opn': t.context.opn,
    'base64url': t.context.base64url,
    './login-provider-base.js': t.context.loginProviderBase
  });
  const browserLoginProvider = new BrowserLoginProvider(CLIENT_ID, CLIENT_NAME);

  browserLoginProvider.login()
    .catch((error) => {
      t.fail(error);
      t.end();
    });
});

test.cb('login() should should reject if request returns an error', (t) => {
  const BrowserLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': requestMock((url, body, callback) => {
      callback('Test error message');
    }),
    'opn': t.context.opn,
    'base64url': t.context.base64url,
    './login-provider-base.js': t.context.loginProviderBase
  });
  const browserLoginProvider = new BrowserLoginProvider(CLIENT_ID, CLIENT_NAME);

  browserLoginProvider.login()
    .then(() => {
      t.fail();
      t.end();
    })
    .catch(error => {
      t.is(error, 'Test error message');
      t.end();
    });
});

test.cb('login() should should reject if request returns an error in the body', (t) => {
  const BrowserLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': requestMock((url, body, callback) => {
      callback(null, {}, {
        error: 'error code',
        error_description: 'test error message'
      });
    }),
    'opn': t.context.opn,
    'base64url': t.context.base64url,
    './login-provider-base.js': t.context.loginProviderBase
  });
  const browserLoginProvider = new BrowserLoginProvider(CLIENT_ID, CLIENT_NAME);

  browserLoginProvider.login()
    .then(() => {
      t.fail();
      t.end();
    })
    .catch(error => {
      t.is(error, 'error code: test error message');
      t.end();
    });
});
