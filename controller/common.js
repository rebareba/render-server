/*
 * @Author: changfeng
 * @LastEditors: changfeng
 * @LastEditTime: 2020-05-26 18:35:17
 * @Description: 通用的一些处理接口 包括文件上传等
 */

const config = require('../config');
const C = require('../common/constant');
const util = require('../common/util');
const moment = require('moment');
const log = require('../common/log');
// 文件上传接口处理
exports.upload = async (ctx) => {
  const reqHeaders = ctx.headers;
  const promises = config.notifyHosts.map(host => {
    const options = {
      url: host + C.APIS.uploadFile.path,
      method: C.APIS.uploadFile.method,
      qs: Object.assign(ctx.query, {date: moment().format('YYYYMMDD')}),
      body: ctx.req,
      headers: reqHeaders,
    };
    return util.request(options);
  });
  const respones = await Promise.all(promises);
  log.info('upload response', respones);
  const err = respones.find(res => res.success === false);
  if (err) {
    return  ctx.body = err;
  }
  ctx.body = respones[0];
};