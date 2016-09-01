'use strict';

const test = require('ava');
const proxyquire = require('proxyquire');

const requestMock = require('../helpers/request.js');
const loginProviderBaseMock = require('../helpers/login-provider-base.js');
const inquirerMock = require('../helpers/inquirer.js');

const TEST_SUBJECT = '../../lib/login-providers/sms.js';
const constants = require('../../lib/constants.js');

const CLIENT_ID = 'valid client id';
const CLIENT_NAME = 'valid client name';
const JWT = 'valid jwt';
const PHONE_NUMBER = '+61234567890';

test.beforeEach((t) => {
  t.context.loginProviderBase = loginProviderBaseMock(null, null, (message, phoneNumber, connection) => {
    return Promise.resolve(JWT);
  });

  t.context.request = requestMock();

  t.context.inquirer = inquirerMock(() => {
    return Promise.resolve({
      phoneNumber: PHONE_NUMBER
    });
  });
});

test.cb('login() should return valid jwt', (t) => {
  const SMSLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': t.context.request,
    './login-provider-base.js': t.context.loginProviderBase
  });
  const smsLoginProvider = new SMSLoginProvider(CLIENT_ID, CLIENT_NAME);

  smsLoginProvider.login(PHONE_NUMBER)
    .then((jwt) => {
      t.is(jwt, JWT);
      t.end();
    })
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('login() should ask for phone number if phone number is not passed in', (t) => {
  const SMSLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': inquirerMock((questions) => {
      t.truthy(questions.find(question => question.name === 'phoneNumber'));
      t.is(questions.length, 1);
      t.end();
      return Promise.resolve({
        phoneNumber: PHONE_NUMBER
      });
    }),
    'request': t.context.request,
    './login-provider-base.js': t.context.loginProviderBase
  });
  const smsLoginProvider = new SMSLoginProvider(CLIENT_ID, CLIENT_NAME);

  smsLoginProvider.login()
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('login() should prompt for phone number if phone number is not passed in as a string', (t) => {
  const SMSLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': inquirerMock((questions) => {
      t.truthy(questions.find(question => question.name === 'phoneNumber'));
      t.is(questions.length, 1);
      t.end();
      return Promise.resolve({
        phoneNumber: PHONE_NUMBER
      });
    }),
    'request': t.context.request,
    './login-provider-base.js': t.context.loginProviderBase
  });
  const smsLoginProvider = new SMSLoginProvider(CLIENT_ID, CLIENT_NAME);

  smsLoginProvider.login(true)
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('login() should should reject if phone number is not returned from the prompt', (t) => {
  const SMSLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': inquirerMock((questions) => {
      return Promise.resolve({});
    }),
    'request': t.context.request,
    './login-provider-base.js': t.context.loginProviderBase
  });
  const smsLoginProvider = new SMSLoginProvider(CLIENT_ID, CLIENT_NAME);

  smsLoginProvider.login()
    .catch(error => {
      t.is(error, 'Please specify a phone number to send verification code to.');
      t.end();
    });
});

test.cb('login() request for passwordless start should use correct data and url', (t) => {
  const SMSLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': requestMock((url, body, callback) => {
      t.is(url, `${constants.AUTH0_URL}/passwordless/start`);
      t.deepEqual(body.json, {
        phone_number: PHONE_NUMBER,
        client_id: CLIENT_ID,
        connection: 'sms'
      });
      t.end();
      callback(null, {}, {});
    }),
    './login-provider-base.js': t.context.loginProviderBase
  });
  const smsLoginProvider = new SMSLoginProvider(CLIENT_ID, CLIENT_NAME);

  smsLoginProvider.login()
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('login() should should reject if request returns an error', (t) => {
  const SMSLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': requestMock((url, body, callback) => {
      callback('Test error message');
    }),
    './login-provider-base.js': t.context.loginProviderBase
  });
  const smsLoginProvider = new SMSLoginProvider(CLIENT_ID, CLIENT_NAME);

  smsLoginProvider.login()
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
  const SMSLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': requestMock((url, body, callback) => {
      callback(null, {}, {
        error: 'error code',
        error_description: 'test error message'
      });
    }),
    './login-provider-base.js': t.context.loginProviderBase
  });
  const smsLoginProvider = new SMSLoginProvider(CLIENT_ID, CLIENT_NAME);

  smsLoginProvider.login()
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
  const SMSLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': requestMock((url, body, callback) => {
      callback(null, {}, {
        error: 'bad.connection',
        error_description: 'Connection does not exist'
      });
    }),
    './login-provider-base.js': t.context.loginProviderBase
  });
  const smsLoginProvider = new SMSLoginProvider(CLIENT_ID, CLIENT_NAME);

  smsLoginProvider.login()
    .then(() => {
      t.fail();
      t.end();
    })
    .catch(error => {
      t.is(error, 'This BlinkMobile service does not provide SMS driven passwordless authentication. Please use another type of authentication to login.');
      t.end();
    });
});

test.cb('login() loginProviderBase should contain phone number from prompt and connection and message should be sms based', (t) => {
  const SMSLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': t.context.request,
    './login-provider-base.js': loginProviderBaseMock(null, null, (message, username, connection) => {
      t.is(message, 'Please check your phone and enter the verification code: ');
      t.is(username, PHONE_NUMBER);
      t.is(connection, 'sms');
      t.end();
      return Promise.resolve(JWT);
    })
  });
  const smsLoginProvider = new SMSLoginProvider(CLIENT_ID, CLIENT_NAME);

  smsLoginProvider.login()
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('login() should should reject if loginProviderBase returns an error', (t) => {
  const SMSLoginProvider = proxyquire(TEST_SUBJECT, {
    'inquirer': t.context.inquirer,
    'request': t.context.request,
    './login-provider-base.js': loginProviderBaseMock(null, null, (message, username, connection) => {
      return Promise.reject('Test error message');
    })
  });
  const smsLoginProvider = new SMSLoginProvider(CLIENT_ID, CLIENT_NAME);

  smsLoginProvider.login()
    .then(() => {
      t.fail();
      t.end();
    })
    .catch(error => {
      t.is(error, 'Test error message');
      t.end();
    });
});
