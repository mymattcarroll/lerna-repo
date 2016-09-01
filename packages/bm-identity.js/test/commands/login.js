
const test = require('ava');
const proxyquire = require('proxyquire');

const TEST_SUBJECT = '../../lib/commands/login.js';

test.beforeEach(t => {
  t.context.log = console.log;
  t.context.exit = process.exit;
});

test.afterEach(t => {
  console.log = t.context.log;
  process.exit = t.context.exit;
});

test('createLoginCommand() should return a function', (t) => {
  const createLoginCommand = proxyquire(TEST_SUBJECT, {
    '../common/login.js': {
      login: () => Promise.resolve()
    }
  });

  const loginCommand = createLoginCommand();
  t.truthy(typeof loginCommand === 'function');
});

test.serial.cb('loginCommand() created from createLoginCommand should resolve to a success message', (t) => {
  const createLoginCommand = proxyquire(TEST_SUBJECT, {
    '../common/login.js': {
      login: () => Promise.resolve()
    }
  });
  console.log = function (content) {
    t.is(content, `
Success! Welcome to BlinkMobile.
`);
  };

  const loginCommand = createLoginCommand();
  loginCommand().then(() => t.end());
});

test.serial.cb('loginCommand() created from createLoginCommand should should log error if login rejects with error', (t) => {
  const createLoginCommand = proxyquire(TEST_SUBJECT, {
    '../common/login.js': {
      login: () => Promise.reject('Errror Message')
    }
  });
  console.log = function (content) {
    t.is(content, `
There was a problem while attempting to login:

Errror Message

Please fix the error and try again.
`);
  };

  process.exit = function () {
    t.end();
  };

  const loginCommand = createLoginCommand();
  loginCommand();
});
