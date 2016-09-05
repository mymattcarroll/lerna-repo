'use strict';

/**
 * Module for assuming an AWS Role using a Blink Mobile identity.
 * @module aws/assume-role
 */

const request = require('request');

const auth0ClientFactory = require('../auth0/client-factory.js');
const constants = require('../constants.js');
const getJwt = require('../utils/get-jwt.js');

/**
 * Assume an temporary AWS role's credentials.
 * @function assumeRole
 * @param {String} clientName - The name of a Client.
 * @param {Object} Additional parameters to pass to the delegation endpoint.
 * @returns {Object} The AWS credentials.
 */
function assumeRole (clientName, additionalParameters) {
  return Promise.all([
    auth0ClientFactory.getClientIdByName(clientName),
    getJwt(clientName)
  ]).then((results) => {
    const clientId = results[0];
    const jwt = results[1];
    if (!jwt) {
      return Promise.reject('Unauthenicated, please use the login command to login.');
    }

    return new Promise((resolve, reject) => {
      additionalParameters = additionalParameters || {};
      additionalParameters.clientName = clientName;
      request.post(`${constants.AUTH0_URL}/delegation`, {
        json: Object.assign({
          client_id: clientId,
          id_token: jwt,
          scope: 'openid',
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          api_type: 'aws'
        }, additionalParameters)
      }, (err, status, data) => {
        if (err) {
          return reject(err);
        }
        if (data.error) {
          if (data.error_description === 'jwt expired') {
            return reject('Unauthorized, your access token has expired. Please use the login command to login again.');
          }
          return reject(`${data.error}: ${data.error_description}`);
        }

        resolve({
          accessKeyId: data.Credentials.AccessKeyId,
          secretAccessKey: data.Credentials.SecretAccessKey,
          sessionToken: data.Credentials.SessionToken
        });
      });
    });
  });
}

module.exports = assumeRole;
