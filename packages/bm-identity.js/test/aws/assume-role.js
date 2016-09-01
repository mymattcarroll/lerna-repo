'use strict';

const test = require('ava');
const proxyquire = require('proxyquire');

const profileMock = require('../helpers/profile.js');
const awsMock = require('../helpers/aws-sdk.js');

const TEST_SUBJECT = '../../lib/aws/assume-role.js';

const ACCESS_KEY_ID = 'valid access key id';
const SECRET_ACCESS_KEY = 'valid secret access key';
const SESSION_TOKEN = 'valid session token';
const CLIENT_NAME = 'valid client name';
const JWT = 'a valid jwt';
const PROFILE = {
  name: 'FirstName LastName',
  awsRoles: {
    cliRole: 'valid aws role ARN'
  }
};
const getRoleParams = (profile) => {
  return {
    RoleArn: profile.awsRoles.cliRole,
    RoleSessionName: `Temp-CLI-User-${profile.name}`
  };
};

test.beforeEach((t) => {
  t.context.profile = profileMock((jwt) => {
    return Promise.resolve(PROFILE);
  });

  t.context.getJWT = (clientName) => {
    return Promise.resolve(JWT);
  };

  t.context.AWS = awsMock((roleParams, callback) => {
    callback(null, {
      Credentials: {
        AccessKeyId: ACCESS_KEY_ID,
        SecretAccessKey: SECRET_ACCESS_KEY,
        SessionToken: SESSION_TOKEN
      }
    });
  });

  t.context.getAWSRoleParams = (profile, callback) => {
    callback(null, getRoleParams(profile));
  };
});

test.cb('assumeRole() should return valid aws credentials', (t) => {
  const assumeRole = proxyquire(TEST_SUBJECT, {
    'aws-sdk': t.context.AWS,
    '../auth0/profile.js': t.context.profile,
    '../utils/get-jwt.js': t.context.getJWT
  });

  assumeRole(CLIENT_NAME, t.context.getAWSRoleParams)
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
    'aws-sdk': t.context.AWS,
    '../auth0/profile.js': t.context.profile,
    '../utils/get-jwt.js': (clientName) => {
      t.is(clientName, CLIENT_NAME);
      t.end();
      return Promise.resolve(JWT);
    }
  });

  assumeRole(CLIENT_NAME, t.context.getAWSRoleParams)
    .catch((error) => {
      t.fail(error);
      t.end();
    });
});

test.cb('assumeRole() should reject if a jwt is not found from getJwt()', (t) => {
  const assumeRole = proxyquire(TEST_SUBJECT, {
    'aws-sdk': t.context.AWS,
    '../auth0/profile.js': t.context.profile,
    '../utils/get-jwt.js': (clientName) => {
      return Promise.resolve();
    }
  });

  assumeRole(CLIENT_NAME, t.context.getAWSRoleParams)
    .then(() => {
      t.fail();
      t.end();
    })
    .catch((error) => {
      t.is('Unauthenicated, please use the login command to login.', error);
      t.end();
    });
});

test.cb('assumeRole() should call profile.getByJWT() with the jwt token returned from getJwt()', (t) => {
  const assumeRole = proxyquire(TEST_SUBJECT, {
    'aws-sdk': t.context.AWS,
    '../auth0/profile.js': profileMock((jwt) => {
      t.is(jwt, JWT);
      t.end();
      return Promise.resolve(PROFILE);
    }),
    '../utils/get-jwt.js': t.context.getJWT
  });

  assumeRole(CLIENT_NAME, t.context.getAWSRoleParams)
    .catch((error) => {
      t.fail(error);
      t.end();
    });
});

test.cb('assumeRole() should call getAWSRoleParams with the profile returned from request', (t) => {
  const assumeRole = proxyquire(TEST_SUBJECT, {
    'aws-sdk': t.context.AWS,
    '../auth0/profile.js': t.context.profile,
    '../utils/get-jwt.js': t.context.getJWT
  });

  assumeRole(CLIENT_NAME, (profile, callback) => {
    t.deepEqual(profile, PROFILE);
    t.end();
    callback(null, {
      RoleArn: profile.awsRoles.cliRole,
      RoleSessionName: `Temp-CLI-User-${profile.name}`
    });
  })
  .catch((error) => {
    t.fail(error);
    t.end();
  });
});

test.cb('assumeRole() should reject if a getAWSRoleParams returns an error', (t) => {
  const assumeRole = proxyquire(TEST_SUBJECT, {
    'aws-sdk': t.context.AWS,
    '../auth0/profile.js': t.context.profile,
    '../utils/get-jwt.js': t.context.getJWT
  });

  assumeRole(CLIENT_NAME, (profile, callback) => {
    callback('test error message');
  })
  .then(() => {
    t.fail();
    t.end();
  })
  .catch((error) => {
    t.is('test error message', error);
    t.end();
  });
});

test.cb('assumeRole() should call assumeRoleWithWebIdentity with the role params returned from getAWSRoleParams', (t) => {
  const assumeRole = proxyquire(TEST_SUBJECT, {
    'aws-sdk': awsMock((roleParams, callback) => {
      const testRoleParams = getRoleParams(PROFILE);
      testRoleParams.WebIdentityToken = JWT;
      testRoleParams.RoleSessionName = testRoleParams.RoleSessionName.replace(/\s+/g, '-');
      t.deepEqual(roleParams, testRoleParams);
      t.end();
      callback(null, {
        Credentials: {
          AccessKeyId: ACCESS_KEY_ID,
          SecretAccessKey: SECRET_ACCESS_KEY,
          SessionToken: SESSION_TOKEN
        }
      });
    }),
    '../auth0/profile.js': t.context.profile,
    '../utils/get-jwt.js': t.context.getJWT
  });

  assumeRole(CLIENT_NAME, t.context.getAWSRoleParams)
    .catch((error) => {
      t.is('test error message', error);
      t.end();
    });
});

test.cb('assumeRole() should reject if assumeRoleWithWebIdentity returns an error', (t) => {
  const assumeRole = proxyquire(TEST_SUBJECT, {
    'aws-sdk': awsMock((roleParams, callback) => {
      callback('test error message');
    }),
    '../auth0/profile.js': t.context.profile,
    '../utils/get-jwt.js': t.context.getJWT
  });

  assumeRole(CLIENT_NAME, t.context.getAWSRoleParams)
    .then(() => {
      t.fail();
      t.end();
    })
    .catch((error) => {
      t.is('test error message', error);
      t.end();
    });
});
