'use strict';

const crypto = require('crypto');
const request = require('request');
const inquirer = require('inquirer');
const opn = require('opn');

const constants = require('../constants.js');
const base64url = require('base64url').encode;
const LoginProviderBase = require('./login-provider-base.js');

const privateVars = new WeakMap();

/**
 * Class representing a browser login provider.
 */
class BrowserLoginProvider extends LoginProviderBase {
  /**
   * Create a browser login provider.
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
   * Login to a client using a Blink Mobile identity with a browser login provider.
   * @returns {String} The JWT generated after a successful login.
   */
  login () {
    // Generate the verifier, and the corresponding challenge
    const verifier = base64url(crypto.randomBytes(32));
    const verifierChallenge = base64url(crypto.createHash('sha256').update(verifier).digest());

    // Open a browser and initiate the authentication process with Auth0
    // The callback URL is a simple website that simply displays the OAuth2 authz code
    // User will copy the value and then paste it here for the process to complete.
    opn(constants.AUTH0_URL +
      '/authorize' +
      '?response_type=code' +
      '&scope=openid' +
      '&client_id=' + privateVars.get(this).clientId +
      '&redirect_uri=' + constants.AUTH0_CALLBACK_URL +
      '&code_challenge=' + verifierChallenge +
      '&code_challenge_method=S256', {wait: false});

    console.log('A browser has been opened to allow you to login. Once logged in, you will be granted a verification code.');

    const questions = [{
      type: 'input',
      name: 'code',
      message: 'Please enter the code: '
    }];

    return inquirer.prompt(questions).then(results => {
      return new Promise((resolve, reject) => {
        request.post(constants.AUTH0_URL + '/oauth/token', {
          json: {
            code: results.code,
            code_verifier: verifier,
            client_id: privateVars.get(this).clientId,
            grant_type: 'authorization_code',
            redirect_uri: constants.AUTH0_CALLBACK_URL
          }
        }, (err, status, body) => {
          if (err) {
            reject(err);
            return;
          }
          if (body.error) {
            reject(`${body.error}: ${body.error_description}`);
            return;
          }
          resolve(super.storeJWT(body.id_token));
        });
      });
    });
  }
}

module.exports = BrowserLoginProvider;
