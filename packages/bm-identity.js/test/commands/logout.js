
const test = require('ava');
const proxyquire = require('proxyquire');

const TEST_SUBJECT = '../../lib/commands/logout.js';

test.beforeEach(t => {
  t.context.log = console.log;
  t.context.exit = process.exit;
});

test.afterEach(t => {
  console.log = t.context.log;
  process.exit = t.context.exit;
});

test('createLogoutCommand() should return a function', (t) => {
  const createLogoutCommand = proxyquire(TEST_SUBJECT, {
    '../common/logout.js': {}
  });

  const logoutCommand = createLogoutCommand();
  t.truthy(typeof logoutCommand === 'function');
});

test.serial.cb('logoutCommand() created from createLogoutCommand should resolve to a success message', (t) => {
  const createLogoutCommand = proxyquire(TEST_SUBJECT, {
    '../common/logout.js': {
      logout: () => Promise.resolve()
    }
  });
  console.log = function (content) {
    t.is(content, `
Success! See you next time.
`);
  };

  const logoutCommand = createLogoutCommand();
  logoutCommand().then(() => t.end());
});

test.serial.cb('logoutCommand() created from createLogoutCommand should should log error if logout rejects with error', (t) => {
  const createLogoutCommand = proxyquire(TEST_SUBJECT, {
    '../common/logout.js': {
      logout: () => Promise.reject('Errror Message')
    }
  });
  console.log = function (content) {
    t.is(content, `
There was a problem while attempting to logout:

Errror Message

Please fix the error and try again.
`);
  };

  process.exit = function () {
    t.end();
  };

  const logoutCommand = createLogoutCommand();
  logoutCommand();
});
