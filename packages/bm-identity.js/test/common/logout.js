'use strict';

const test = require('ava');
const proxyquire = require('proxyquire');

const constants = require('../../lib/constants.js');

const blinkmrcMock = require('../helpers/blinkmrc.js');
const requestMock = require('../helpers/request.js');
const auth0ClientFactoryMock = require('../helpers/auth0-client-factory.js');

const TEST_SUBJECT = '../../lib/common/logout.js';

const CLIENT_ID = 'valid client id';
const JWT = 'a valid jwt';

test.beforeEach((t) => {
  t.context.blinkmrc = blinkmrcMock(null, (updateFn, options) => {
    return Promise.resolve(updateFn({accessToken: JWT}));
  });

  t.context.auth0ClientFactory = auth0ClientFactoryMock(() => {
    return Promise.resolve(CLIENT_ID);
  });

  t.context.request = requestMock(null, (url, callback) => {
    callback(null, {}, 'OK');
  });

  t.context.clientName = 'Client Name';
});

test('logout() should not reject', (t) => {
  const commonLogout = proxyquire(TEST_SUBJECT, {
    '../auth0/client-factory.js': t.context.auth0ClientFactory,
    'request': t.context.request,
    '@blinkmobile/blinkmrc': t.context.blinkmrc
  });

  t.notThrows(commonLogout.logout(t.context.clientName));
});

test.cb('logout() should call auth0ClientFactory with clientName from logout', (t) => {
  const commonLogout = proxyquire(TEST_SUBJECT, {
    '../auth0/client-factory.js': auth0ClientFactoryMock((clientName) => {
      t.is(clientName, t.context.clientName);
      t.end();
      return Promise.resolve(CLIENT_ID);
    }),
    'request': t.context.request,
    '@blinkmobile/blinkmrc': t.context.blinkmrc
  });

  commonLogout.logout(t.context.clientName)
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('logout() should call request with the clientId returned from auth0ClientFactory', (t) => {
  const commonLogout = proxyquire(TEST_SUBJECT, {
    '../auth0/client-factory.js': t.context.auth0ClientFactory,
    'request': requestMock(null, (url, callback) => {
      t.is(url, `${constants.AUTH0_URL}/v2/logout?client_id=${CLIENT_ID}`);
      t.end();
      callback(null, {}, 'OK');
    }),
    '@blinkmobile/blinkmrc': t.context.blinkmrc
  });

  commonLogout.logout(t.context.clientName)
    .catch(() => {
      t.fail();
      t.end();
    });
});

test.cb('logout() should reject if a request returns an error', (t) => {
  const commonLogout = proxyquire(TEST_SUBJECT, {
    '../auth0/client-factory.js': t.context.auth0ClientFactory,
    'request': requestMock(null, (url, callback) => {
      callback('Test error message');
    }),
    '@blinkmobile/blinkmrc': t.context.blinkmrc
  });

  commonLogout.logout(t.context.clientName)
    .then(() => {
      t.fail();
      t.end();
    })
    .catch((error) => {
      t.is('Test error message', error);
      t.end();
    });
});

test.cb('logout() should call blinkmrc to update and remove access token with clientName', (t) => {
  const commonLogout = proxyquire(TEST_SUBJECT, {
    '../auth0/client-factory.js': t.context.auth0ClientFactory,
    'request': t.context.request,
    '@blinkmobile/blinkmrc': blinkmrcMock(null, (updateFn, options) => {
      t.is(options.name, t.context.clientName);
      t.end();
      return Promise.resolve(updateFn({accessToken: JWT}));
    })
  });

  commonLogout.logout(t.context.clientName)
    .catch(() => {
      t.fail();
      t.end();
    });
});
