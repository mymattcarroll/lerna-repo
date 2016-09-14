'use strict';
/**
 * Auth0 Client Factory.
 * @module auth0/client-factory
 */

const request = require('request');  


/**
 * @function getClientIdByName
 * @param {String} clientName - The name of a Client.
 * @returns {String} The Id of the Client.
 */
function getClientIdByName (clientName) {
  return new Promise((resolve, reject) => {
    request.get('https://auth.blinkm.io/auth0-client-factory.json', (error, status, body) => {
      if (error) {
        return reject(error);
      }

      try {
        const auth0Clients = JSON.parse(body);
        const clientId = auth0Clients[clientName];
        if (clientId) {
          return resolve(clientId);
        } else {
          // Continue to return below.
        }
      } catch (err) {
        // Continue to return below.
      }

      reject(`Could not find Auth0 Client Id for Client: ${clientName}`);
    });
  });
}

module.exports = {
  getClientIdByName
};
