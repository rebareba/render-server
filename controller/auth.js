'use strict';

const util = require('../common/util');
const valdate = require('../common/validate');
const C = require('../common/constant');
const log = require('../common/log');
const config = require('../config');

// 登录接口
exports.login = async (ctx) => {
  const data = ctx.request.body;
  const {error} = valdate(ctx.request.body, 'login');
  if (error) {
    return ctx.body = util.resFormat(null, C.CODE.ERROR_PARAMS, `${C.MSG.ERROR_PARAMS}: ${error.message}`, false);
  }
  const accountInfo = config.accounts.find(account => {
    return account.name === data.name;
  });
  log.debug('accountInfo', accountInfo);
  if (!accountInfo || accountInfo.password !== util.encodePassword(data.password, accountInfo.salt)) {
    return ctx.body = util.resFormat(null, C.CODE.PASS_ERROR, C.MSG.PASS_ERROR, false);
  }
  ctx.accountInfo = accountInfo;
  ctx.body = util.resFormat({
    name: accountInfo.name,
    nickname: accountInfo.nickname,
    permission: accountInfo.permission,
  });
};

// 登出接口
exports.logout = async (ctx) => {
  ctx.accountInfo = null;
  ctx.body = util.resFormat({});
};

// 当前登录用户信息
exports.loginInfo = async (ctx) => {
  ctx.body = util.resFormat({
    name: ctx.accountInfo.name,
    nickname: ctx.accountInfo.nickname,
    permission: ctx.accountInfo.permission,
  });
};
