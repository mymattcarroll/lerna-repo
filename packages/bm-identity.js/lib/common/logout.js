'use strict';

/**
 * Module for common logout helpers.
 * @module common/logout
 */

const request = require('request');
const blinkmrc = require('@blinkmobile/blinkmrc');

const auth0ClientFactory = require('../auth0/client-factory.js');
const constants = require('../constants.js');

/**
 * Logout of a client.
 * @param {String} clientName - The name of a Client.
 */
function logout (clientName) {
  return auth0ClientFactory.getClientIdByName(clientName).then(clientId => {
    return new Promise((resolve, reject) => {
      request.get(`${constants.AUTH0_URL}/v2/logout?client_id=${clientId}`, (err, status, body) => {
        if (err) {
          reject(err);
          return;
        }

        const userConfigStore = blinkmrc.userConfig({ name: clientName });
        userConfigStore.update(config => {
          if (config.accessToken) {
            delete config.accessToken;
          }
          return config;
        }).then(() => resolve());
      });
    });
  });
}

module.exports = {
  logout
};
