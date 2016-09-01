'use strict';

function auth0ClientFactoryMock (getClientIdByNameFn) {
  return {
    getClientIdByName: (clientName) => {
      return getClientIdByNameFn(clientName);
    }
  };
}

module.exports = auth0ClientFactoryMock;
