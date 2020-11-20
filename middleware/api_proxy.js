'use strict';

const _ = require('lodash');
const {pathToRegexp} = require('path-to-regexp');
const log = require('../common/log');
const util = require('../common/util');
const C = require('../common/constant');
const request = require('request');
const renderService = require('../service/render');
const allPlugin = require('../plugin/index');
const config = require('../config');
// 接口代理操作
module.exports = async (ctx, next) => {
  // 还有refer判断
  const apiProxies = renderService.proxies;
  let reqHeaders = ctx.headers;
  // 是否匹配到接口路由
  let proxyInfo = apiProxies.find(proxyInfo => {
    if (
      (!proxyInfo.methods || proxyInfo.methods.length === 0 || proxyInfo.methods.indexOf(ctx.method) >= 0) &&
      (proxyInfo.allRequest || util.isAjaxRequest(ctx)) &&
      pathToRegexp(proxyInfo.paths).test(ctx.path) &&
      (!proxyInfo.referers || proxyInfo.referers.length === 0 || pathToRegexp(proxyInfo.referers).test(reqHeaders.referer))
    ) {
      return proxyInfo;
    }
  });
  if (!proxyInfo) {
    return await next;
  }
  log.debug('proxyInfo', proxyInfo);
  let backHost = proxyInfo.backHost;
  // 接口测试 替换host
  if (reqHeaders[C.API_TEST.HEADER_FLAG] === C.API_TEST.HEADER_FLAG_DATA  && reqHeaders[C.API_TEST.HEADER_BACKHOST]) {
    backHost = reqHeaders[C.API_TEST.HEADER_BACKHOST];
  }
  // 这里进行插件处理
  if (proxyInfo.plugins) {
    for (let pluginConfig  of proxyInfo.plugins) {
      if (allPlugin[pluginConfig.key]) {
        if (!await allPlugin[pluginConfig.key](pluginConfig.options)(ctx)) {
          return;
        }
      }
    }
  }
  if (config.trueIpHeaderKey) {
    reqHeaders = Object.assign({}, reqHeaders, {[config.trueIpHeaderKey]: util.getReqIP(ctx, true)});
  }
  // delete reqHeaders.host; 不删除是否到Nginx有问题
  // 是否有头参数注入
  if (proxyInfo.headerMap) {
    const proxyData = _.merge({}, proxyInfo.defaultData || {}, ctx.proxyData);
    log.debug('ctx.proxyData', ctx.proxyData);
    for (const k in proxyInfo.headerMap) {
      delete reqHeaders[proxyInfo.headerMap[k].toLowerCase()];
      if (typeof proxyData[k] !== 'undefined') {
        reqHeaders[proxyInfo.headerMap[k]] = proxyData[k];
      }
    }
  }
  let prefixPath = proxyInfo.prefixPath || '';
  const {string} = util.startsReplace(ctx.path, (proxyInfo.pathPrefix || ''));
  log.debug('url', ctx.method, backHost + prefixPath  + string);
  log.debug('headers, qs', reqHeaders, ctx.query);

  // pipe的方式代理，也支持图片表单形式
  // TODO 关于http连接池的添加 httpAgent
  ctx.body = request({
    uri: backHost + prefixPath  + string,
    method: ctx.method,
    qs: ctx.query,
    body: ctx.req,
    headers: reqHeaders,
  });
};
