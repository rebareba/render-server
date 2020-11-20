'use strict';
const viewsMid = require('koa-views');
const staticMid = require('./static');
const logMid = require('./log');
const apiProxy = require('./api_proxy');
const selfApis = require('./apis');
const render = require('./render');
const config = require('../config');

module.exports = app => {
  app.use(logMid);
  // 处理静态文件
  app.use(staticMid(config.staticOption.rootPath, config.staticOption.options));

  // render-server 本身服务的处理
  app.use(selfApis);

  // 模板路由中间件
  app.use(viewsMid(config.viewOption.viewPath, config.viewOption.options));

  app.use(render);

  app.use(apiProxy);

  app.use(async (ctx) => {
    ctx.throw(404, `path '${ctx.path}' not found`);
  });
};
