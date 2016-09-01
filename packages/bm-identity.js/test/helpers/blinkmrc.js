'use strict';

function blinkmrcMock (userLoadFn, userUpdateFn, userWriteFn) {
  userLoadFn = userLoadFn || ((options) => Promise.resolve({}));
  userUpdateFn = userUpdateFn || ((updateFn, options) => Promise.resolve(updateFn({})));
  userWriteFn = userWriteFn || ((config, options) => Promise.resolve(config));
  return {
    userConfig: (options) => {
      return {
        load: () => userLoadFn(options),
        update: (updateFn) => userUpdateFn(updateFn, options),
        write: (config) => userWriteFn(config, options)
      };
    }
  };
}

module.exports = blinkmrcMock;
