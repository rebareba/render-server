/**
 * 日志中间件
 */
'use strict';

const log = require('../common/log');
const util = require('../common/util');

module.exports =  async (ctx, next) => {
  if (ctx.request.originalUrl === '/favicon.ico') {
    return;
  }
  const ip = util.getReqIP(ctx);
  const startTime = new Date();
  await next();
  const time = (new Date() - startTime) + 'ms';
  log.info('[request log]:', ip, ctx.request.method, ctx.request.originalUrl, time);
};
