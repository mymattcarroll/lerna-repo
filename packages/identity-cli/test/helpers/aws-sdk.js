'use strict';

function awsMock (assumeRoleWithWebIdentityFn) {
  return {
    STS: class STS {
      assumeRoleWithWebIdentity (roleParams, callback) {
        assumeRoleWithWebIdentityFn(roleParams, callback);
      }
    }
  };
}

module.exports = awsMock;
