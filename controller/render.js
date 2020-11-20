'use strict';

const _ = require('lodash');
const util = require('../common/util');
const path = require('path');
const orgUtil = require('util');
const valdate = require('../common/validate');
const C = require('../common/constant');
const fs = require('fs');
// const log = require('../common/log');
// const config = require('../config');
const renderService = require('../service/render');

// 获取列表接口
exports.list = async (ctx) => {
  const accountInfo = ctx.accountInfo;
  let appConfigs = renderService.appConfigs;
  let reData = [];
  appConfigs.map(appConfig => {
    appConfig = _.cloneDeep(appConfig);
    let temp = {
      key: appConfig.key,
      permission: accountInfo.permission,
      config: appConfig,
    };
    if (!accountInfo.apps) {
      return reData.push(temp);
    }
    if (accountInfo.apps[appConfig.key] || accountInfo.name === appConfig.account) {
      temp.permission = accountInfo.apps[appConfig.key] || C.PER.ALL;
      reData.push(temp);
    }
  });
  ctx.body = util.resFormat(reData);

};

// 获取详情接口
exports.info = async (ctx) => {
  const accountInfo = ctx.accountInfo;
  const data = ctx.query;
  const {error} = valdate(data, 'info');
  if (error) {
    return ctx.body = util.resFormat(null, C.CODE.ERROR_PARAMS, `${C.MSG.ERROR_PARAMS}: ${error.message}`, false);
  }
  let appConfigs = renderService.appConfigs;
  let appConfig = appConfigs.find(appConfig => appConfig.key === data.key);
  if (!appConfig) {
    return ctx.body = util.resFormat(null, C.CODE.DATA_NOT_FOUND, C.MSG.DATA_NOT_FOUND, false);
  }
  appConfig = _.cloneDeep(appConfig);
  if (!util.checkPermission(accountInfo, C.PER.VIEW, appConfig)) {
    return ctx.body = util.resFormat(null, C.CODE.NO_PERMISSION, C.MSG.NO_PERMISSION, false);
  }
  ctx.body = util.resFormat(appConfig);
};

// 编辑接口
exports.edit = async (ctx) => {
  const accountInfo = ctx.accountInfo;
  const data = ctx.request.body;
  const {error} = valdate(data, 'edit');
  if (error) {
    return ctx.body = util.resFormat(null, C.CODE.ERROR_PARAMS, `${C.MSG.ERROR_PARAMS}: ${error.message}`, false);
  }
  let appConfigs = renderService.appConfigs;
  let appConfig = appConfigs.find(appConfig => appConfig.key === data.key);
  if (!appConfig) {
    return ctx.body = util.resFormat(null, C.CODE.DATA_NOT_FOUND, C.MSG.DATA_NOT_FOUND, false);
  }
  appConfig = _.cloneDeep(appConfig);
  if (!util.checkPermission(accountInfo, C.PER.EDIT, appConfig)) {
    return ctx.body = util.resFormat(null, C.CODE.NO_PERMISSION, C.MSG.NO_PERMISSION, false);
  }
  const editData = {
    key: appConfig.key,
    account: appConfig.account,
    name: data.config.name,
    pageIndex: data.config.pageIndex,
    description: data.config.description,
    viewRender: data.config.viewRender,
    apiProxy: data.config.apiProxy,
    staticPrefix: data.config.staticPrefix,
  };
  if (data.config.locked) {
    editData.locked = true;
  }
  const retData = await renderService.notifyServices(editData, C.ACTIONS.EDIT);
  if (!retData) {
    return ctx.body = util.resFormat(null, C.CODE.ERROR_UNKNOWN, C.MSG.ERROR_UNKNOWN, false);
  }
  for (let row of retData) {
    if (!row.success) {
      return ctx.body = util.resFormat(retData, C.CODE.NOTIFY_ERROR, C.MSG.NOTIFY_ERROR, false);
    }
  }
  ctx.body = util.resFormat(retData);
};

// 删除配置
exports.delete = async (ctx) => {
  const accountInfo = ctx.accountInfo;
  const data = ctx.request.body;
  const {error} = valdate(data, 'delete');
  if (error) {
    return ctx.body = util.resFormat(null, C.CODE.ERROR_PARAMS, `${C.MSG.ERROR_PARAMS}: ${error.message}`, false);
  }
  let appConfigs = renderService.appConfigs;
  let appConfig = appConfigs.find(appConfig => appConfig.key === data.key);
  if (!appConfig) {
    return ctx.body = util.resFormat(null, C.CODE.DATA_NOT_FOUND, C.MSG.DATA_NOT_FOUND, false);
  }
  appConfig = _.cloneDeep(appConfig);
  if (!util.checkPermission(accountInfo, C.PER.DELETE, appConfig) || data.key === 'render-server') {
    return ctx.body = util.resFormat(null, C.CODE.NO_PERMISSION, C.MSG.NO_PERMISSION, false);
  }
  const retData = await renderService.notifyServices(data.key, C.ACTIONS.DELETE);
  if (!retData) {
    return ctx.body = util.resFormat(null, C.CODE.ERROR_UNKNOWN, C.MSG.ERROR_UNKNOWN, false);
  }
  for (let row of retData) {
    if (!row.success) {
      return ctx.body = util.resFormat(retData, C.CODE.NOTIFY_ERROR, C.MSG.NOTIFY_ERROR, false);
    }
  }
  ctx.body = util.resFormat(retData);
};

// 新增配置
exports.add = async (ctx) => {
  const accountInfo = ctx.accountInfo;
  const data = ctx.request.body;
  const {error} = valdate(data, 'add');
  if (error) {
    return ctx.body = util.resFormat(null, C.CODE.ERROR_PARAMS, `${C.MSG.ERROR_PARAMS}: ${error.message}`, false);
  }
  let appConfigs = renderService.appConfigs;
  let appConfig = appConfigs.find(appConfig => appConfig.key === data.key);
  if (appConfig) {
    return ctx.body = util.resFormat(null, C.CODE.DATA_REPEAT, C.MSG.DATA_REPEAT, false);
  }
  if (!util.checkPermission(accountInfo, C.PER.ADD)) {
    return ctx.body = util.resFormat(null, C.CODE.NO_PERMISSION, C.MSG.NO_PERMISSION, false);
  }
  const newData = {
    key: data.key,
    account: accountInfo.name,
    name: data.name,
    description: data.description,
    pageIndex: data.pageIndex,
    viewRender: data.viewRender,
    apiProxy: data.apiProxy,
    staticPrefix: data.staticPrefix,
  };
  if (data.locked) {
    newData.locked = true;
  }

  const retData = await renderService.notifyServices(newData, C.ACTIONS.ADD);
  if (!retData) {
    return ctx.body = util.resFormat(null, C.CODE.ERROR_UNKNOWN, C.MSG.ERROR_UNKNOWN, false);
  }
  for (let row of retData) {
    if (!row.success) {
      return ctx.body = util.resFormat(retData, C.CODE.NOTIFY_ERROR, C.MSG.NOTIFY_ERROR, false);
    }
  }
  ctx.body = util.resFormat(newData);
};

// 读取配置文件
exports.md = async (ctx) => {

  const type = ctx.query.type === 'about' ? 'about' : 'plugin';
  let data = '';
  if (type === 'about') {
    data = await orgUtil.promisify(fs.readFile)(path.join(__dirname, '../README.md'));
  } else {
    data = await orgUtil.promisify(fs.readFile)(path.join(__dirname, '../PLUGIN.md'));
  }
  ctx.body = util.resFormat(data.toString());
};
