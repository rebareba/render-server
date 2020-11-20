'use strict';

const _ = require('lodash');
let config = require('./config_default');

try {
  let envConfig = require('./config');
  config = _.merge(config, envConfig);
} catch (e) {
  if (!config.debug) {
    console.log('[ERROR] loading config/config.js failed:', e.message); // eslint-disable-line
  } else {
    if (e.code !== 'MODULE_NOT_FOUND') {
      console.log('[ERROR] loading config/config.js failed:', e.message); // eslint-disable-line
    }
  }
}

const globalConfigPath = process.env.CONFIG_PATH || config.globalConfigFile;
try {
  const globalConfig = require(globalConfigPath);
  config = _.merge(config, globalConfig);
} catch (e) {
  if (false === config.debug) {
    console.log(`[ERROR] loading ${globalConfigPath} failed:`, e.message); // eslint-disable-line
  } else {
    if (e.code !== 'MODULE_NOT_FOUND') {
      console.log(`[ERROR] loading ${globalConfigPath} failed:`, e.message); // eslint-disable-line
    }
  }
}

module.exports = config;
