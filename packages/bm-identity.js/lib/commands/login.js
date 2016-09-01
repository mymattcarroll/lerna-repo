'use strict';

/**
 * Module to create the login command to extend an existing CLI.
 * @module commands/login
 */

const loginCommon = require('../common/login.js');

/**
 * Create the login command to extend an existing CLI
 * @function createLoginCommand
 * @param {String} clientName - The name of a Client.
 * @returns {Function} The login command function.
 */
function createLoginCommand (clientName) {
  return function (input, flags, options) {
    return loginCommon.login(clientName, flags)
      .then(() => console.log(`
Success! Welcome to BlinkMobile.
`))
      .catch(error => {
        console.log(`
There was a problem while attempting to login:

${error}

Please fix the error and try again.
`);
        process.exit(1);
      });
  };
}

module.exports = createLoginCommand;
