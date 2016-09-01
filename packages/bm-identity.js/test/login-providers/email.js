'use strict';

const test = require('ava');
const proxyquire = require('proxyquire');

const requestMock = require('../helpers/request.js');
const loginProviderBaseMock = require('../helpers/login-provider-base.js');
const inquirerMock = require('../helpers/inquirer.js');

const TEST_SUBJECT = '../../lib/login-providers/email.js';
const constants = require('../../lib/constants.js');

const CLIENT_ID = 'valid client id';
const CLIENT_NAME = 'valid client name';
const JWT = 'valid jwt';
const EMAIL = 'email.com';

test.beforeEach((t) => {
  t.context.loginProviderBase = loginProviderBaseMock(null, null, (message, email, connection) => {
    return Promise.resolve(JWT);
  });

  t.context.request = requestMock();

  t.context.inquirer = inquirerMock((questions) => {
    return Promise.resolve({
      email: EMAIL
    });
  });
});

test.cb('login() should return valid jwt', (t) => {
  const EmailLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': t.context.request,
    './login-provider-base.js': t.context.loginProviderBase
  });
  const emailLoginProvider = new EmailLoginProvider(CLIENT_ID, CLIENT_NAME);

  emailLoginProvider.login(EMAIL)
    .then((jwt) => {
      t.is(jwt, JWT);
      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('login() should ask for email if email is not passed in', (t) => {
  const EmailLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': inquirerMock((questions) => {
      t.truthy(questions.find(question => question.name === 'email'));
      t.is(questions.length, 1);
      t.end();
      return Promise.resolve({
        email: EMAIL
      });
    }),
    'request': t.context.request,
    './login-provider-base.js': t.context.loginProviderBase
  });
  const emailLoginProvider = new EmailLoginProvider(CLIENT_ID, CLIENT_NAME);

  emailLoginProvider.login()
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('login() should prompt for email if email is not passed in as a string', (t) => {
  const EmailLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': inquirerMock((questions) => {
      t.truthy(questions.find(question => question.name === 'email'));
      t.is(questions.length, 1);
      t.end();
      return Promise.resolve({
        email: EMAIL
      });
    }),
    'request': t.context.request,
    './login-provider-base.js': t.context.loginProviderBase
  });
  const emailLoginProvider = new EmailLoginProvider(CLIENT_ID, CLIENT_NAME);

  emailLoginProvider.login(true)
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('login() should should reject if email is not returned from the prompt', (t) => {
  const EmailLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': inquirerMock((questions) => {
      return Promise.resolve({});
    }),
    'request': t.context.request,
    './login-provider-base.js': t.context.loginProviderBase
  });
  const emailLoginProvider = new EmailLoginProvider(CLIENT_ID, CLIENT_NAME);

  emailLoginProvider.login()
    .then(() => {
      t.fail();
      t.end();
    })
    .catch(error => {
      t.is(error, 'Please specify an email address to send verification code to.');
      t.end();
    });
});

test.cb('login() request for passwordless start should use correct data and url', (t) => {
  const EmailLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': requestMock((url, body, callback) => {
      t.is(url, `${constants.AUTH0_URL}/passwordless/start`);
      t.deepEqual(body.json, {
        email: EMAIL,
        client_id: CLIENT_ID,
        send: 'code',
        connection: 'email'
      });
      t.end();
      callback(null, {}, {});
    }),
    './login-provider-base.js': t.context.loginProviderBase
  });
  const emailLoginProvider = new EmailLoginProvider(CLIENT_ID, CLIENT_NAME);

  emailLoginProvider.login()
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('login() should should reject if request returns an error', (t) => {
  const EmailLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': requestMock((url, body, callback) => {
      callback('Test error message');
    }),
    './login-provider-base.js': t.context.loginProviderBase
  });
  const emailLoginProvider = new EmailLoginProvider(CLIENT_ID, CLIENT_NAME);

  emailLoginProvider.login()
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
  const EmailLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': requestMock((url, body, callback) => {
      callback(null, {}, {
        error: 'error code',
        error_description: 'test error message'
      });
    }),
    './login-provider-base.js': t.context.loginProviderBase
  });
  const emailLoginProvider = new EmailLoginProvider(CLIENT_ID, CLIENT_NAME);

  emailLoginProvider.login()
    .then(() => {
      t.fail();
      t.end();
    })
    .catch(error => {
      t.is(error, 'error code: test error message');
      t.end();
    });
});

test.cb('login() should should reject with custom message if request returns an bad connection error in the body', (t) => {
  const EmailLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': requestMock((url, body, callback) => {
      callback(null, {}, {
        error: 'bad.connection',
        error_description: 'Connection does not exist'
      });
    }),
    './login-provider-base.js': t.context.loginProviderBase
  });
  const emailLoginProvider = new EmailLoginProvider(CLIENT_ID, CLIENT_NAME);

  emailLoginProvider.login()
    .then(() => {
      t.fail();
      t.end();
    })
    .catch(error => {
      t.is(error, 'This BlinkMobile service does not provide email driven passwordless authentication. Please use another type of authentication to login.');
      t.end();
    });
});

test.cb('login() loginProviderBase should contain email from prompt and connection and message should be email based', (t) => {
  const EmailLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': t.context.request,
    './login-provider-base.js': loginProviderBaseMock(null, null, (message, username, connection) => {
      t.is(message, 'Please check your email and enter the verification code: ');
      t.is(username, EMAIL);
      t.is(connection, 'email');
      t.end();
      return Promise.resolve(JWT);
    })
  });
  const emailLoginProvider = new EmailLoginProvider(CLIENT_ID, CLIENT_NAME);

  emailLoginProvider.login()
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('login() should should reject if loginProviderBase returns an error', (t) => {
  const EmailLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': t.context.request,
    './login-provider-base.js': loginProviderBaseMock(null, null, (message, username, connection) => {
      return Promise.reject('Test error message');
    })
  });
  const emailLoginProvider = new EmailLoginProvider(CLIENT_ID, CLIENT_NAME);

  emailLoginProvider.login()
    .then(() => {
      t.fail();
      t.end();
    })
    .catch(error => {
      t.is(error, 'Test error message');
      t.end();
    });
});
