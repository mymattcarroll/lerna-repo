'use strict';

const test = require('ava');
const proxyquire = require('proxyquire');

const requestMock = require('../helpers/request.js');

const TEST_SUBJECT = '../../lib/auth0/profile.js';

const JWT = 'a valid jwt';
const CLIENT_NAME = 'valid client name';
const PROFILE = {
  name: 'FirstName LastName',
  awsRoles: {
    cliRole: 'valid aws role ARN'
  }
};

test.beforeEach((t) => {
  t.context.getJWT = (clientName) => {
    return Promise.resolve(JWT);
  };

  t.context.request = requestMock((url, data, callback) => {
    callback(null, {}, PROFILE);
  });
});

test.cb('getByClient() should call getJwt() to get access token with clientName', (t) => {
  const profile = proxyquire(TEST_SUBJECT, {
    'request': t.context.request,
    '../utils/get-jwt.js': (clientName) => {
      t.is(clientName, CLIENT_NAME);
      t.end();
      return Promise.resolve(JWT);
    }
  });

  profile.getByClient(CLIENT_NAME)
    .catch((error) => {
      t.fail(error);
      t.end();
    });
});

test.cb('getByClient() should return valid profile', (t) => {
  const profile = proxyquire(TEST_SUBJECT, {
    'request': t.context.request,
    '../utils/get-jwt.js': t.context.getJWT
  });

  profile.getByClient(CLIENT_NAME)
    .then((profile) => {
      t.deepEqual(profile, PROFILE);
      t.end();
    })
    .catch((error) => {
      t.fail(error);
      t.end();
    });
});

test.cb('getByJWT() should return valid profile', (t) => {
  const profile = proxyquire(TEST_SUBJECT, {
    'request': t.context.request,
    '../utils/get-jwt.js': t.context.getJWT
  });

  profile.getByJWT(JWT)
    .then((profile) => {
      t.deepEqual(profile, PROFILE);
      t.end();
    })
    .catch((error) => {
      t.fail(error);
      t.end();
    });
});

test.cb('getByJWT() should reject if a jwt is not truthy', (t) => {
  const profile = proxyquire(TEST_SUBJECT, {
    'request': t.context.request,
    '../utils/get-jwt.js': t.context.getJWT
  });

  profile.getByJWT()
    .then(() => {
      t.fail();
      t.end();
    })
    .catch((error) => {
      t.is('Unauthenicated, please use the login command to login.', error);
      t.end();
    });
});

test.cb('getByJWT() should call request with the jwt token passed in', (t) => {
  const profile = proxyquire(TEST_SUBJECT, {
    'request': requestMock((url, data, callback) => {
      t.is(data.json.id_token, JWT);
      t.end();
      callback(null, {}, PROFILE);
    }),
    '../utils/get-jwt.js': t.context.getJWT
  });

  profile.getByJWT(JWT)
    .catch((error) => {
      t.fail(error);
      t.end();
    });
});

test.cb('getByJWT() should reject if a request returns an error', (t) => {
  const profile = proxyquire(TEST_SUBJECT, {
    'request': requestMock((url, data, callback) => {
      callback('Test error message');
    }),
    '../utils/get-jwt.js': t.context.getJWT
  });

  profile.getByJWT(JWT)
    .then(() => {
      t.fail();
      t.end();
    })
    .catch((error) => {
      t.is('Test error message', error);
      t.end();
    });
});

test.cb('getByJWT() should reject if a request returns \'Unauthorized\'', (t) => {
  const profile = proxyquire(TEST_SUBJECT, {
    'request': requestMock((url, data, callback) => {
      callback(null, {}, 'Unauthorized');
    }),
    '../utils/get-jwt.js': t.context.getJWT
  });

  profile.getByJWT(JWT)
    .then(() => {
      t.fail();
      t.end();
    })
    .catch((error) => {
      t.is('Unauthorized, your access token may have expired. Please use the login command to login again.', error);
      t.end();
    });
});
