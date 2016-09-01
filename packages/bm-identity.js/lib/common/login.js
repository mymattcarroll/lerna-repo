'use strict';

/**
 * Module for common login helpers.
 * @module common/login
 */

const auth0ClientFactory = require('../auth0/client-factory.js');
const UsernameLoginProvider = require('../login-providers/username.js');
const EmailLoginProvider = require('../login-providers/email.js');
const SmsLoginProvider = require('../login-providers/sms.js');
const BrowserLoginProvider = require('../login-providers/browser.js');

/**
 * Login to a client using a Blink Mobile identity.
 *
 * <p>The options passed to this method are optional and use login providers in the following priority based on the options passed:</p>
 * <ol>
 *  <li>username: {@link UsernameLoginProvider}</li>
 *  <li>email: {@link EmailLoginProvider}</li>
 *  <li>sms: {@link SMSLoginProvider}</li>
 *  <li>social (or undefined): {@link BrowserLoginProvider}</li>
 * </ol>
 *
 * @param {String} clientName - The name of a Client.
 * @param {Object} [options={}] - The login options.
 * @param {String} [options.username] - The username.
 * @param {String} [options.password] - The password.
 * @param {String} [options.email] - The email to send a verification code to.
 * @param {String} [options.sms] - The phone number to send a verification code to.
 * @param {Boolean} [options.social=true] - True if intending to use a social account to login e.g. Google.
 * @returns {String} The JWT generated after a successful login.
 */
function login (clientName, options) {
  options = options || {};
  return auth0ClientFactory.getClientIdByName(clientName).then(clientId => {
    if (options.username) {
      const loginProvider = new UsernameLoginProvider(clientId, clientName);
      return loginProvider.login(options.username, options.password);
    } else if (options.email) {
      const loginProvider = new EmailLoginProvider(clientId, clientName);
      return loginProvider.login(options.email);
    } else if (options.sms) {
      const loginProvider = new SmsLoginProvider(clientId, clientName);
      return loginProvider.login(options.sms);
    } else {
      const loginProvider = new BrowserLoginProvider(clientId, clientName);
      return loginProvider.login();
    }
  });
}

module.exports = {
  login
};
