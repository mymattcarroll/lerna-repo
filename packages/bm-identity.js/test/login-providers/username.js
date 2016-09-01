'use strict';

const test = require('ava');
const proxyquire = require('proxyquire');

const loginProviderBaseMock = require('../helpers/login-provider-base.js');
const inquirerMock = require('../helpers/inquirer.js');

const TEST_SUBJECT = '../../lib/login-providers/username.js';

const CLIENT_ID = 'valid client id';
const CLIENT_NAME = 'valid client name';
const JWT = 'valid jwt';
const USERNAME = 'username';
const PASSWORD = 'password';

test.beforeEach((t) => {
  t.context.loginProviderBase = loginProviderBaseMock(null, (username, password, connection) => {
    return Promise.resolve(JWT);
  });

  t.context.inquirer = inquirerMock();
});

test.cb('login() should return valid jwt', (t) => {
  const UsernameLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    './login-provider-base.js': t.context.loginProviderBase
  });
  const usernameLoginProvider = new UsernameLoginProvider(CLIENT_ID, CLIENT_NAME);

  usernameLoginProvider.login(USERNAME, PASSWORD)
    .then((jwt) => {
      t.is(jwt, JWT);
      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('login() should ask for username and password if username and password is not passed in', (t) => {
  const UsernameLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': inquirerMock((questions) => {
      t.truthy(questions.find(question => question.name === 'username'));
      t.truthy(questions.find(question => question.name === 'password'));
      t.end();
      return Promise.resolve(questions.reduce((memo, question) => {
        memo[question.name] = question.name;
        return memo;
      }, {}));
    }),
    './login-provider-base.js': t.context.loginProviderBase
  });
  const usernameLoginProvider = new UsernameLoginProvider(CLIENT_ID, CLIENT_NAME);

  usernameLoginProvider.login()
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('login() should prompt for username and password if username and password is not passed in as a string', (t) => {
  const UsernameLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': inquirerMock((questions) => {
      t.truthy(questions.find(question => question.name === 'username'));
      t.truthy(questions.find(question => question.name === 'password'));
      t.end();
      return Promise.resolve(questions.reduce((memo, question) => {
        memo[question.name] = question.name;
        return memo;
      }, {}));
    }),
    './login-provider-base.js': t.context.loginProviderBase
  });
  const usernameLoginProvider = new UsernameLoginProvider(CLIENT_ID, CLIENT_NAME);

  usernameLoginProvider.login(true, true)
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('login() should should reject if username is not returned from the prompt', (t) => {
  const UsernameLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': inquirerMock((questions) => {
      return Promise.resolve({});
    }),
    './login-provider-base.js': t.context.loginProviderBase
  });
  const usernameLoginProvider = new UsernameLoginProvider(CLIENT_ID, CLIENT_NAME);

  usernameLoginProvider.login()
    .then(() => {
      t.fail();
      t.end();
    })
    .catch(error => {
      t.is(error, 'Please specify a username.');
      t.end();
    });
});

test.cb('login() should should reject if password is not returned from the prompt', (t) => {
  const UsernameLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': inquirerMock((questions) => {
      return Promise.resolve({
        username: USERNAME
      });
    }),
    './login-provider-base.js': t.context.loginProviderBase
  });
  const usernameLoginProvider = new UsernameLoginProvider(CLIENT_ID, CLIENT_NAME);

  usernameLoginProvider.login()
    .then(() => {
      t.fail();
      t.end();
    })
    .catch(error => {
      t.is(error, 'Please specify a password.');
      t.end();
    });
});

test.cb('login() loginProviderBase should contain username and password from prompt and connection should be username based', (t) => {
  const UsernameLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': inquirerMock((questions) => {
      return Promise.resolve({
        username: USERNAME,
        password: PASSWORD
      });
    }),
    './login-provider-base.js': loginProviderBaseMock(null, (username, password, connection) => {
      t.is(username, USERNAME);
      t.is(password, PASSWORD);
      t.is(connection, 'Username-Password-Authentication');
      t.end();
      return Promise.resolve(JWT);
    })
  });
  const usernameLoginProvider = new UsernameLoginProvider(CLIENT_ID, CLIENT_NAME);

  usernameLoginProvider.login()
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('login() should should reject if loginProviderBase returns an error', (t) => {
  const UsernameLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    './login-provider-base.js': loginProviderBaseMock(null, (username, password, connection) => {
      return Promise.reject('Test error message');
    })
  });
  const usernameLoginProvider = new UsernameLoginProvider(CLIENT_ID, CLIENT_NAME);

  usernameLoginProvider.login()
    .then(() => {
      t.fail();
      t.end();
    })
    .catch(error => {
      t.is(error, 'Test error message');
      t.end();
    });
});
