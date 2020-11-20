/*
 * @Author: changfeng
 * @LastEditors: changfeng
 * @LastEditTime: 2020-07-28 18:42:48
 * @Description: 应用接口测试相关
 */

'use strict';

const util = require('../common/util');
// const valdate = require('../common/validate');
const C = require('../common/constant');
const log = require('../common/log');
const moment = require('moment');
// const config = require('../config');
const appApiService = require('../service/app_api');
const renderService = require('../service/render');

// 获取服务详情
exports.appInfo = async (ctx) => {
  const {appKey} = ctx.params;
  let appConfig = renderService.getAppConfig(appKey);
  if (!appConfig) {
    return ctx.body = util.resFormat(null, C.CODE.DATA_NOT_FOUND, C.MSG.DATA_NOT_FOUND, false);
  }
  const appDetail = await appApiService.getAppInfo(appKey);
  appDetail.apis = await appApiService.getAppApis(appKey);
  appDetail.name = appConfig.name;
  appDetail.description = appConfig.description;
  appDetail.pageIndex = appConfig.pageIndex;
  ctx.body = util.resFormat(appDetail);
};

// 编辑应用信息，包含新增host, 删除host, 新增分类，删除分类等
exports.editAppInfo = async (ctx) => {
  log.debug('editAppInfo ------->', ctx.params);
  const {appKey} = ctx.params;
  const body = ctx.request.body;
  let appConfig = renderService.getAppConfig(appKey);
  if (!appConfig) {
    return ctx.body = util.resFormat(null, C.CODE.DATA_NOT_FOUND, C.MSG.DATA_NOT_FOUND, false);
  }
  // const {error} = valdate(body, 'apiCase');
  // if (error) {
  //   return ctx.body = util.resFormat(null, C.CODE.ERROR_PARAMS, `${C.MSG.ERROR_PARAMS}: ${error.message}`, false);
  // }
  const appInfo = await appApiService.getAppInfo(appKey);
  if (body.hosts) {
    appInfo.hosts = body.hosts;
  }
  if (body.host) {
    appInfo.hosts.push(body.host);
  }
  if (body.delHost) {
    appInfo.hosts.map((host, index) => {
      if (body.delHost.host === host.host && body.delHost.name === host.name) {
        appInfo.hosts.splice(index, 1);
      }
    });
  }
  if (body.categories) {
    appInfo.categories = body.categories;
  }
  if (body.category) {
    appInfo.categories.push(body.category);
  }
  if (body.delCategory) {
    appInfo.categories.map((category, index) => {
      if (body.delCategory.cateCode === category.cateCode && body.delCategory.name === category.name) {
        appInfo.categories.splice(index, 1);
      }
    });
  }
  if (body.apiPrefiies) {
    appInfo.apiPrefiies = body.apiPrefiies;
  }
  appInfo.mtime =  moment().format('YYYY-MM-DD HH:mm:ss');
  const notifyData = {
    appKey,
    data: appInfo,
  };
  await renderService.notifyServices(notifyData, C.ACTIONS.APP);

  appInfo.name = appConfig.name;
  appInfo.description = appConfig.description;
  appInfo.pageIndex = appConfig.pageIndex;
  ctx.body = util.resFormat(appInfo);
};

// 新增接口
exports.addApi = async (ctx) => {
  log.debug('addApi ------->', ctx.params);
  const {appKey} = ctx.params;
  let appConfig = renderService.getAppConfig(appKey);
  if (!appConfig) {
    return ctx.body = util.resFormat(null, C.CODE.DATA_NOT_FOUND, C.MSG.DATA_NOT_FOUND, false);
  }
  // const {error} = valdate(body, 'apiCase');
  // if (error) {
  //   return ctx.body = util.resFormat(null, C.CODE.ERROR_PARAMS, `${C.MSG.ERROR_PARAMS}: ${error.message}`, false);
  // }
  const apiData = ctx.request.body;

  const apiId = util.uuid();
  apiData.apiId = apiId;
  const notifyData = {
    apiId,
    appKey,
    data: apiData,
  };
  await renderService.notifyServices(notifyData, C.ACTIONS.API);
  ctx.body = util.resFormat(apiData);
};


// 接口详情
exports.apiInfo = async (ctx) => {
  log.debug('apiInfo ------->', ctx.params);
  const {appKey, apiId} = ctx.params;
  let appConfig = renderService.getAppConfig(appKey);
  if (!appConfig) {
    return ctx.body = util.resFormat(null, C.CODE.DATA_NOT_FOUND, C.MSG.DATA_NOT_FOUND, false);
  }
  const retData = await appApiService.getApiInfo(appKey, apiId);
  ctx.body = util.resFormat(retData);
};


// 编辑接口
exports.editApi = async (ctx) => {
  log.debug('editApi ------->', ctx.params);
  const {appKey, apiId} = ctx.params;
  let appConfig = renderService.getAppConfig(appKey);
  if (!appConfig) {
    return ctx.body = util.resFormat(null, C.CODE.DATA_NOT_FOUND, C.MSG.DATA_NOT_FOUND, false);
  }
  // const {error} = valdate(body, 'apiCase');
  // if (error) {
  //   return ctx.body = util.resFormat(null, C.CODE.ERROR_PARAMS, `${C.MSG.ERROR_PARAMS}: ${error.message}`, false);
  // }
  await appApiService.getApiInfo(appKey, apiId);
  const apiData = ctx.request.body;
  apiData.apiId = apiId;
  const notifyData = {
    apiId,
    appKey,
    data: apiData,
  };
  await renderService.notifyServices(notifyData, C.ACTIONS.API);
  ctx.body = util.resFormat(apiData);
};


// 删除接口
exports.deleteApi = async (ctx) => {
  log.debug('deleteApi ------->', ctx.params);
  const {appKey, apiId} = ctx.params;
  let appConfig = renderService.getAppConfig(appKey);
  if (!appConfig) {
    return ctx.body = util.resFormat(null, C.CODE.DATA_NOT_FOUND, C.MSG.DATA_NOT_FOUND, false);
  }
  const notifyData = {
    apiId,
    appKey,
  };
  await appApiService.getApiInfo(appKey, apiId);
  await renderService.notifyServices(notifyData, C.ACTIONS.API_DELETE);
  ctx.body = util.resFormat({appKey, apiId});
};

// 获取测试用例列表
exports.apiCases = async (ctx) => {
  log.debug('apiCases ------->', ctx.params);
  const {appKey, apiId} = ctx.params;
  let appConfig = renderService.getAppConfig(appKey);
  if (!appConfig) {
    return ctx.body = util.resFormat(null, C.CODE.DATA_NOT_FOUND, C.MSG.DATA_NOT_FOUND, false);
  }
  const retData = await appApiService.getApiCases(appKey, apiId);
  ctx.body = util.resFormat(retData);
};

// 添加用例
exports.addApiCase = async (ctx) => {
  log.debug('addApiCase ------->', ctx.params);
  const {appKey, apiId} = ctx.params;
  let appConfig = renderService.getAppConfig(appKey);
  if (!appConfig) {
    return ctx.body = util.resFormat(null, C.CODE.DATA_NOT_FOUND, C.MSG.DATA_NOT_FOUND, false);
  }
  const body = ctx.request.body;
  // const {error} = valdate(body, 'apiCase');
  // if (error) {
  //   return ctx.body = util.resFormat(null, C.CODE.ERROR_PARAMS, `${C.MSG.ERROR_PARAMS}: ${error.message}`, false);
  // }
  let apiCases = await appApiService.getApiCases(appKey, apiId);
  const newCase = {
    name: body.name,
    caseId: util.uuid(),
    params: body.params,
  };
  apiCases.push(newCase);
  const notifyData = {
    appKey,
    apiId,
    data: apiCases,
  };
  await renderService.notifyServices(notifyData, C.ACTIONS.CASE);
  ctx.body = util.resFormat(apiCases);
};

// 删除用例
exports.deleteApiCase = async (ctx) => {
  log.debug('deleteApiCase ------->', ctx.params);
  const {appKey, apiId, caseId} = ctx.params;
  let appConfig = renderService.getAppConfig(appKey);
  if (!appConfig) {
    return ctx.body = util.resFormat(null, C.CODE.DATA_NOT_FOUND, C.MSG.DATA_NOT_FOUND, false);
  }
  let apiCases = await appApiService.getApiCases(appKey, apiId);
  apiCases.map((caseItem, index) => {
    if (caseItem.caseId === caseId) delete apiCases.splice(index, 1);
  });
  const notifyData = {
    appKey,
    apiId,
    data: apiCases,
  };
  await renderService.notifyServices(notifyData, C.ACTIONS.CASE);
  ctx.body = util.resFormat(apiCases);
};

// 测试接口
exports.test = async (ctx) => {
  log.debug('test ------->', ctx.request.body);
  const retData = await appApiService.test(ctx.request.body);
  log.debug('test retData', retData);
  ctx.body = util.resFormat(retData);
};