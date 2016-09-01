'use strict';

/**
 * Module for gettin the JWT stored after a successful login.
 * @module utils/get-jwt
 */

const blinkmrc = require('@blinkmobile/blinkmrc');

/**
 * Get JWT generated after a successful login
 * @function getJWT
 * @param {String} clientName - The name of a Client.
 * @returns {String} The JWT generated after a successful login.
 */
function getJWT (clientName) {
  const userConfigStore = blinkmrc.userConfig({ name: clientName });
  return userConfigStore.load().then(config => config.accessToken);
}

module.exports = getJWT;
