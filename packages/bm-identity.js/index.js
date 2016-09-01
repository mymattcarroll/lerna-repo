'use strict';

const assumeRole = require('./lib/aws/assume-role.js');
const loginCommand = require('./lib/commands/login.js');
const loginCommon = require('./lib/common/login.js');
const logoutCommand = require('./lib/commands/logout.js');
const logoutCommon = require('./lib/common/logout.js');
const profile = require('./lib/auth0/profile.js');

const privateVars = new WeakMap();

/**
 * Class representing a Blink Mobile identity.
 */
class BlinkMobileIdentity {
  /**
   * Create a Blink Mobile identity.
   * @param {String} clientName - The name of the client.
   */
  constructor (clientName) {
    privateVars.set(this, {
      clientName,
      commands: {
        login: loginCommand(clientName),
        logout: logoutCommand(clientName)
      }
    });
  }

  /**
   * Get the the login command to extend an existing CLI.
   */
  get loginCommand () {
    return privateVars.get(this).commands.login;
  }

  /**
   * Get the the logout command to extend an existing CLI.
   */
  get logoutCommand () {
    return privateVars.get(this).commands.logout;
  }

  /**
   * Login to a client using a Blink Mobile identity.
   * @param {Object} options - The login options.
   * @returns {String} The JWT generated after a successful login.
   */
  login (options) {
    return loginCommon.login(privateVars.get(this).clientName, options);
  }

  /**
   * Logout of the client.
   */
  logout () {
    return logoutCommon.logout(privateVars.get(this).clientName);
  }

  /**
   * Get temporary AWS role's credentials.
   * @param {BlinkMobileIdentity~getAWSRoleParams} getAWSRoleParams - A function that gets the AWS roles params.
   * @returns {Object} The AWS credentials.
   */
  assumeAWSRole (getAWSRoleParams) {
    return assumeRole(privateVars.get(this).clientName, getAWSRoleParams);
  }

  /**
   * Get the Auth0 profile for the current user.
   * @returns {Object} The Auth0 profile.
   */
  getProfile () {
    return profile.getByClient(privateVars.get(this).clientName);
  }
}

/**
 * The function used to get the AWS Role params for assuming a role.
 * @callback BlinkMobileIdentity~getAWSRoleParams
 * @param {Object} profile - The profile of the user
 * @returns {Object} The AWS Role params.
 */

module.exports = BlinkMobileIdentity;
