'use strict';

const request = require('request');
const inquirer = require('inquirer');
const _ = require('lodash');

const constants = require('../constants.js');
const LoginProviderBase = require('./login-provider-base.js');

const privateVars = new WeakMap();

/**
 * Class representing an email login provider.
 */
class EmailLoginProvider extends LoginProviderBase {
  /**
   * Create an email login provider.
   * @augments LoginProviderBase
   * @param {String} clientId - The Id of the client.
   * @param {String} clientName - The name of the client.
   */
  constructor (clientId, clientName) {
    super(clientId, clientName);

    privateVars.set(this, {
      clientId
    });
  }

  /**
   * Login to a client using a Blink Mobile identity with an email login provider.
   * @param {String} email - The email address to send a verification code to.
   * @returns {String} The JWT generated after a successful login.
   */
  login (email) {
    return this._verifyEmail(email)
      .then(verifiedEmail => this._startPasswordless(verifiedEmail))
      .then(verifiedEmail => super.promptForCode('Please check your email and enter the verification code: ', verifiedEmail, 'email'));
  }

  _startPasswordless (email) {
    return new Promise((resolve, reject) => {
      // Send email to user with verification code.
      request.post(`${constants.AUTH0_URL}/passwordless/start`, {
        json: {
          client_id: privateVars.get(this).clientId,
          send: 'code',
          connection: 'email',
          email: email
        }
      }, (err, status, body) => {
        if (err) {
          reject(err);
          return;
        }
        if (body.error) {
          // catch errors we want to have a nice message for.
          switch (body.error_description) {
            case 'Connection does not exist': {
              return reject('This BlinkMobile service does not provide email driven passwordless authentication. Please use another type of authentication to login.');
            }
            default: {
              return reject(`${body.error}: ${body.error_description}`);
            }
          }
        }

        resolve(email);
      });
    });
  }

  _verifyEmail (email) {
    if (_.isString(email)) {
      return Promise.resolve(email);
    }

    return inquirer.prompt([{
      type: 'input',
      name: 'email',
      message: 'Email Address: '
    }]).then(results => {
      if (!results.email) {
        return Promise.reject('Please specify an email address to send verification code to.');
      }
      return results.email;
    });
  }
}

module.exports = EmailLoginProvider;
