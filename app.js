'use strict';

const Koa = require('koa');
const config = require('./config');
const log = require('./common/log');
const middleware = require('./middleware');
const renderService = require('./service/render');

const app = new Koa();
renderService.loadRenders();
// 中间件
middleware(app);

log.info(`============= env: ${config.env} =============`);

const server = app.listen(config.port, '0.0.0.0', () => {
  log.info('Server listening on port: ' + server.address().port);
});

// 暴露app出去，用于测试
module.exports = app;
