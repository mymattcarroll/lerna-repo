'use strict';

/**
 * Module to create the logout command to extend an existing CLI.
 * @module commands/logout
 */

const logoutCommon = require('../common/logout.js');

/**
 * Create the logout command to extend an existing CLI
 * @function createLogoutCommand
 * @param {String} clientName - The name of a Client.
 * @returns {Function} The logout command function.
 */
function createLogoutCommand (clientName) {
  return function (input, flags, options) {
    return logoutCommon.logout(clientName)
      .then(() => console.log(`
Success! See you next time.
`))
      .catch(error => {
        console.log(`
There was a problem while attempting to logout:

${error}

Please fix the error and try again.
`);
        process.exit(1);
      });
  };
}

module.exports = createLogoutCommand;
