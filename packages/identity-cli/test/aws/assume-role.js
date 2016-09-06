'use strict';

const test = require('ava');
const proxyquire = require('proxyquire');

const requestMock = require('../helpers/request.js');
const auth0ClientFactoryMock = require('../helpers/auth0-client-factory.js');

const TEST_SUBJECT = '../../lib/aws/assume-role.js';
const constants = require('../../lib/constants.js');

const ACCESS_KEY_ID = 'valid access key id';
const SECRET_ACCESS_KEY = 'valid secret access key';
const SESSION_TOKEN = 'valid session token';
const CLIENT_NAME = 'valid client name';
const CLIENT_ID = 'valid client id';
const JWT = 'a valid jwt';
const RESPONSE = {
  Credentials: {
    AccessKeyId: ACCESS_KEY_ID,
    SecretAccessKey: SECRET_ACCESS_KEY,
    SessionToken: SESSION_TOKEN
  }
};

test.beforeEach((t) => {
  t.context.getJWT = (clientName) => {
    return Promise.resolve(JWT);
  };

  t.context.auth0ClientFactory = auth0ClientFactoryMock(() => {
    return Promise.resolve(CLIENT_ID);
  });

  t.context.request = requestMock((url, data, callback) => {
    callback(null, {}, RESPONSE);
  });
});

test.cb('assumeRole() should return valid aws credentials', (t) => {
  const assumeRole = proxyquire(TEST_SUBJECT, {
    'request': t.context.request,
    '../auth0/client-factory.js': t.context.auth0ClientFactory,
    '../utils/get-jwt.js': t.context.getJWT
  });

  assumeRole(CLIENT_NAME)
    .then((assumedRole) => {
      t.deepEqual(assumedRole, {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
        sessionToken: SESSION_TOKEN
      });
      t.end();
    })
    .catch((error) => {
      t.fail(error);
      t.end();
    });
});

test.cb('assumeRole() should call getJwt() to get access token with clientName', (t) => {
  const assumeRole = proxyquire(TEST_SUBJECT, {
    'request': t.context.request,
    '../auth0/client-factory.js': t.context.auth0ClientFactory,
    '../utils/get-jwt.js': (clientName) => {
      t.is(clientName, CLIENT_NAME);
      t.end();
      return Promise.resolve(JWT);
    }
  });

  assumeRole(CLIENT_NAME)
    .catch((error) => {
      t.fail(error);
      t.end();
    });
});

test.cb('assumeRole() should call getClientIdByName() to get client id with clientName', (t) => {
  const assumeRole = proxyquire(TEST_SUBJECT, {
    'request': t.context.request,
    '../auth0/client-factory.js': auth0ClientFactoryMock((clientName) => {
      t.is(clientName, CLIENT_NAME);
      t.end();
      return Promise.resolve(CLIENT_ID);
    }),
    '../utils/get-jwt.js': t.context.getJWT
  });

  assumeRole(CLIENT_NAME)
    .catch((error) => {
      t.fail(error);
      t.end();
    });
});

test.cb('assumeRole() should reject if a jwt is not found from getJwt()', (t) => {
  const assumeRole = proxyquire(TEST_SUBJECT, {
    'request': t.context.request,
    '../auth0/client-factory.js': t.context.auth0ClientFactory,
    '../utils/get-jwt.js': (clientName) => {
      return Promise.resolve();
    }
  });

  assumeRole(CLIENT_NAME)
    .then(() => {
      t.fail();
      t.end();
    })
    .catch((error) => {
      t.is('Unauthenicated, please use the login command to login.', error);
      t.end();
    });
});

test.cb('assumeRole() should call request with the correct data and additional parameters', (t) => {
  const assumeRole = proxyquire(TEST_SUBJECT, {
    'request': requestMock((url, data, callback) => {
      t.is(url, `${constants.AUTH0_URL}/delegation`);
      t.deepEqual(data.json, {
        client_id: CLIENT_ID,
        id_token: JWT,
        scope: 'openid',
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        api_type: 'aws',
        clientName: CLIENT_NAME,
        test: 'prop'
      });
      t.end();
      callback(null, {}, RESPONSE);
    }),
    '../auth0/client-factory.js': t.context.auth0ClientFactory,
    '../utils/get-jwt.js': t.context.getJWT
  });

  assumeRole(CLIENT_NAME, { test: 'prop' })
    .catch((error) => {
      t.fail(error);
      t.end();
    });
});

test.cb('assumeRole() should reject if request returns an error', (t) => {
  const assumeRole = proxyquire(TEST_SUBJECT, {
    'request': requestMock((url, data, callback) => {
      callback('test error message');
    }),
    '../auth0/client-factory.js': t.context.auth0ClientFactory,
    '../utils/get-jwt.js': t.context.getJWT
  });

  assumeRole(CLIENT_NAME)
    .then(() => {
      t.fail();
      t.end();
    })
    .catch((error) => {
      t.is('test error message', error);
      t.end();
    });
});

test.cb('assumeRole() should should reject with error if request returns an error in the body', (t) => {
  const assumeRole = proxyquire(TEST_SUBJECT, {
    'request': requestMock((url, data, callback) => {
      callback(null, {}, {
        error: 'error code',
        error_description: 'test error message'
      });
    }),
    '../auth0/client-factory.js': t.context.auth0ClientFactory,
    '../utils/get-jwt.js': t.context.getJWT
  });

  assumeRole(CLIENT_NAME)
    .then(() => {
      t.fail();
      t.end();
    })
    .catch((error) => {
      t.is(error, 'error code: test error message');
      t.end();
    });
});

test.cb('assumeRole() should should reject with custom message if request returns an "jwt expired" error in the body', (t) => {
  const assumeRole = proxyquire(TEST_SUBJECT, {
    'request': requestMock((url, data, callback) => {
      callback(null, {}, {
        error: 'invalid',
        error_description: 'jwt expired'
      });
    }),
    '../auth0/client-factory.js': t.context.auth0ClientFactory,
    '../utils/get-jwt.js': t.context.getJWT
  });

  assumeRole(CLIENT_NAME)
    .then(() => {
      t.fail();
      t.end();
    })
    .catch((error) => {
      t.is(error, 'Unauthorized, your access token has expired. Please use the login command to login again.');
      t.end();
    });
});
