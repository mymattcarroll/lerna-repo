'use strict';

const privateVars = new WeakMap();

function loginProviderMock (loginFn) {
  return class LoginProvider {
    constructor (clientId) {
      privateVars.set(this, {
        clientId
      });
    }

    login (a, b, c) {
      return loginFn(privateVars.get(this).clientId, a, b, c);
    }
  };
}

module.exports = loginProviderMock;
