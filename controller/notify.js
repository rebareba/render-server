'use strict';

const orgUtil = require('util');
const util = require('../common/util');
const fs = require('fs');
const path = require('path');
const koaBody = require('koa-body');
const moment = require('moment');
const mkdirp = require('mkdirp');
const _ = require('lodash');
const valdate = require('../common/validate');
const C = require('../common/constant');
const log = require('../common/log');
const config = require('../config');
const renderService = require('../service/render');
const appApiService = require('../service/app_api');


// 接收通知处理接口
exports.notify = async (ctx) => {
  const query = ctx.query;
  const body = ctx.request.body;
  const md5 = util.md5(ctx.request.rawBody);
  log.debug('notify data', query, body);
  const signString = query.sign;
  delete query.sign;
  if (md5 !== query.md5 || !util.checkSign(query, signString, config.aesKey)) {
    return ctx.body = util.resFormat(null, C.CODE.SIGN_ERROR, C.MSG.SIGN_ERROR, false);
  }
  const {error} = valdate(body, 'notify');
  if (error) {
    return ctx.body = util.resFormat(null, C.CODE.ERROR_PARAMS, `${C.MSG.ERROR_PARAMS}: ${error.message}`, false);
  }
  let flag;
  if (body.type === C.ACTIONS.DELETE) {
    flag = await renderService.deleteAppConfig(body.data);
  } else if (body.type === C.ACTIONS.ADD || body.type === C.ACTIONS.EDIT) {
    flag = await renderService.setAppConfig(body.data, body.type);
  } else if (body.type === C.ACTIONS.CASE) {
    flag = await appApiService.modifyCase(body.data);
  } else if (body.type === C.ACTIONS.APP) {
    flag = await appApiService.modifyApp(body.data);
  } else if (body.type === C.ACTIONS.API) {
    flag = await appApiService.addApi(body.data);
  } else if (body.type === C.ACTIONS.API_DELETE) {
    flag = await appApiService.delApi(body.data);
  }
  if (!flag) {
    return ctx.body = util.resFormat(null, C.CODE.ERROR_UNKNOWN, C.MSG.ERROR_UNKNOWN, false);
  }
  ctx.body = util.resFormat({flag});
};

// 接受处理文件上传
exports.upload = async (ctx) => {
  const INIT_PATH = 'init';
  const date = ctx.query.date || moment().format('YYYYMMDD');
  let uploadDir = path.join(config.staticOption.rootPath, `./upload/${date}`);
  if (ctx.query.path) {
    // 如果有自定义路径的 则需要判断是否登录
    if (!ctx.accountInfo) return ctx.body = util.resFormat(null, C.CODE.NEED_AUTH, C.MSG.NEED_AUTH, false);
    if (ctx.query.path !== INIT_PATH) {
      uploadDir = path.join(config.staticOption.rootPath, ctx.query.path);
    }
  }

  // await orgUtil.promisify(fs.mkdir)(uploadDir, {recursive: true});
  await mkdirp(uploadDir);
  const options = _.merge(config.uploadOptions.options, {formidable: {uploadDir}});
  const bodyParser = koaBody(options);
  //中间件处理数据
  await bodyParser(ctx, () => {});
  const reqParam = {
    router: ctx.params,
    query: ctx.query,
    body: ctx.request.body,
    headers: ctx.headers,
  };
  log.debug('reqParam', reqParam);
  log.debug('file', ctx.request.files);
  const files = ctx.request.files || {};
  if (!files.file) {
    return ctx.body = util.resFormat(null, C.CODE.ERROR_PARAMS, C.MSG.ERROR_PARAMS, false);
  }
  const fileInfo = files.file;
  const pathParse = path.parse(fileInfo.path);
  let newPath = path.join(pathParse.dir, `${fileInfo.hash}${pathParse.ext}`);
  if (ctx.query.path) {
    // 兼容两种上传方式
    const [firstPath] = fileInfo.name.split('/');

    if (pathParse.dir.endsWith(firstPath) || ctx.query.path === INIT_PATH) {
      newPath = path.join(config.staticOption.rootPath, fileInfo.name);
    } else {
      newPath = path.join(pathParse.dir, fileInfo.name);
    }
    // await orgUtil.promisify(fs.mkdir)(path.parse(newPath).dir, {recursive: true});
    await mkdirp(path.parse(newPath).dir);
  }
  await orgUtil.promisify(fs.rename)(fileInfo.path, newPath);
  const urlPath = newPath.replace(config.staticOption.rootPath, '');
  ctx.body = util.resFormat({path: urlPath, url: `${config.uploadOptions.host}${urlPath}`});
};

