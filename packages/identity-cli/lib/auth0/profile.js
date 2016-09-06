'use strict';

/**
 * Module for getting the Auth0 profile for the current user.
 * @module auth0/profile
 */

const request = require('request');

const getJwt = require('../utils/get-jwt.js');
const constants = require('../constants.js');

/**
 * Get the Auth0 profile for the current user using a valid JWT.
 * @function getByJWT
 * @param {String} jwt - The JWT generated after a successful login.
 * @returns {Object} The Auth0 profile.
 */
function getByJWT (jwt) {
  if (!jwt) {
    return Promise.reject('Unauthenicated, please use the login command to login.');
  }
  return new Promise((resolve, reject) => {
    request.post(constants.AUTH0_URL + '/tokeninfo', {
      json: {
        id_token: jwt
      }
    }, (err, status, profile) => {
      if (err) {
        reject(err);
        return;
      }

      if (profile === 'Unauthorized') {
        reject('Unauthorized, your access token may have expired. Please use the login command to login again.');
        return;
      }

      resolve(profile);
    });
  });
}

/**
 * Get the Auth0 profile for the current user using a client.
 * @function getByClient
 * @param {String} clientName - The name of a Client.
 * @returns {Object} The Auth0 profile.
 */
function getByClient (clientName) {
  return getJwt(clientName).then(getByJWT);
}

module.exports = {
  getByJWT,
  getByClient
};
