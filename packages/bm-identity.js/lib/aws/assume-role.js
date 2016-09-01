'use strict';

/**
 * Module for assuming an AWS Role using a Blink Mobile identity.
 * @module aws/assume-role
 */

const AWS = require('aws-sdk');

const profile = require('../auth0/profile.js');
const getJwt = require('../utils/get-jwt.js');

/**
 * Assume an temporary AWS role's credentials.
 * @function assumeRole
 * @param {String} clientName - The name of a Client.
 * @param {BlinkMobileIdentity~getAWSRoleParams} getAWSRoleParams - A function that gets the AWS roles params.
 * @returns {Object} The AWS credentials.
 */
function assumeRole (clientName, getAWSRoleParams) {
  return getJwt(clientName).then((jwt) => {
    if (!jwt) {
      return Promise.reject('Unauthenicated, please use the login command to login.');
    }
    return profile.getByJWT(jwt).then((profile) => {
      return new Promise((resolve, reject) => {
        getAWSRoleParams(profile, (err, roleParams) => {
          if (err) {
            reject(err);
            return;
          }

          roleParams.WebIdentityToken = jwt;
          // RoleSessionName can not have any spaces,
          // we will replace them with dashes
          roleParams.RoleSessionName = (roleParams.RoleSessionName || 'Temp-WebIdentity-User').replace(/\s+/g, '-');
          const STS = new AWS.STS();
          STS.assumeRoleWithWebIdentity(roleParams, (err, data) => {
            if (err) {
              reject(err);
              return;
            }

            resolve({
              accessKeyId: data.Credentials.AccessKeyId,
              secretAccessKey: data.Credentials.SecretAccessKey,
              sessionToken: data.Credentials.SessionToken
            });
          });
        });
      });
    });
  });
}

module.exports = assumeRole;
