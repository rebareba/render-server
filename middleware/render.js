'use strict';
const _ = require('lodash');
const {pathToRegexp} = require('path-to-regexp');
const ejs = require('ejs');
const renderService = require('../service/render');
const allPlugin = require('../plugin/index');
const log = require('../common/log');
const C = require('../common/constant');
/**
 * 对路由进行匹配
 * @param renderConf
 * @return {Function}
 */
module.exports = async (ctx, next) => {
  if (ctx.headers['x-requested-with'] === 'XMLHttpRequest' || ctx.method.toLocaleLowerCase() !== 'get') {
    return await next();
  }
  const renders = renderService.renders;
  const renderInfo = renders.find(render => {
    if (
      pathToRegexp(render.paths).test(ctx.path) &&
      (!render.hosts || render.hosts.length === 0 || pathToRegexp(render.hosts).test(ctx.headers.host))
    ) {
      return render;
    }
  });
  if (!renderInfo) {
    return await next();
  }
  log.debug('renderInfo', renderInfo);
  if (renderInfo.plugins) {
    for (let pluginConfig  of renderInfo.plugins) {
      if (allPlugin[pluginConfig.key]) {
        if (!await allPlugin[pluginConfig.key](pluginConfig.options)(ctx)) {
          return;
        }
      }
    }
  }
  // 是否有模板数据注入
  const renderData =  _.merge({}, renderInfo.defaultData || {}, ctx.renderData);
  log.debug('renderData', renderData);
  if (renderInfo.viewType === C.VIEW_TYPES.PATH) {
    await ctx.render(renderInfo.viewPath || 'index', renderData);
  } else {
    ctx.body = ejs.render(renderInfo.viewData, renderData);
  }
};
