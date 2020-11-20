'use strict';

module.exports = (options) => {
  return async (ctx) => {
    if (options.type === 'wechat') {
      ctx.body = ctx.query.echostr || '';
    } else {
      ctx.body = options.data || '';
    }
    return false;
  };
};
