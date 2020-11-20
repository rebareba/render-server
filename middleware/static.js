
'use strict';

/**
 * Module dependencies.
 */

const {resolve} = require('path');
const assert = require('assert');
const send = require('koa-send');
const util = require('../common/util');
const log = require('../common/log');
const renderService = require('../service/render');

/**
 * Serve static files from `root`.
 *
 * @param {String} root
 * @param {Object} [opts]
 * @return {Function}
 * @api public
 */

module.exports = (root, opts) => {
  opts = Object.assign({}, opts);

  assert(root, 'root directory is required to serve files');

  opts.root = resolve(root);
  if (opts.index !== false) {
    opts.index = opts.index || 'index.html';
  }
  // false 执行这里
  if (!opts.defer) {
    return async function serve(ctx, next) {
      let done = false;
      const prefixes = renderService.prefixes;
      // log.debug('prefixes', prefixes);
      if (ctx.method === 'HEAD' || ctx.method === 'GET') {
        let path = ctx.path;
        try {
          done = await send(ctx, path, opts);
        } catch (err) {
          if (err.status !== 404) {
            throw err;
          }
        }
        if (!done) {
          if (prefixes) {
            for (let i = 0; i < prefixes.length; i ++) {
              let {flag, string} = util.startsReplace(path, prefixes[i] + '/');
              if (flag) {
                path = '/' + string;
                break;
              }
            }
          }
          try {
            done = await send(ctx, path, opts);
          } catch (err) {
            if (err.status !== 404) {
              throw err;
            }
          }
        }
      }

      if (!done) {
        await next();
      }
    };
  }
  // 这里是后处理静态文件 下面代码可以忽略
  return async function serve(ctx, next) {
    await next();

    if (ctx.method !== 'HEAD' && ctx.method !== 'GET') {
      return;
    }
    // response is already handled
    if (ctx.body != null || ctx.status !== 404) return // eslint-disable-line
    const prefixes = renderService.prefixes;
    try {
      let path = ctx.path;
      if (prefixes) {
        for (let i = 0; i < opts.prefixes.length; i ++) {
          let {flag, string} = util.startsReplace(path, prefixes[i]);
          if (flag) {
            path = string;
            break;
          }
        }
      }
      log.debug('static path', path);
      await send(ctx, path, opts);
    } catch (err) {
      if (err.status !== 404) {
        throw err;
      }
    }
  };
};
