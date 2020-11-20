'use strict';

const {pathToRegexp} = require('path-to-regexp');
const AesCbc = require('../common/aes_cbc_crypto');
const config = require('../config');
const log = require('../common/log');
const C = require('../common/constant');
const util = require('../common/util');
const authContr = require('../controller/auth');
const notifyContr = require('../controller/notify');
const renderContr = require('../controller/render');
// 上传文件等接口
const commonContr = require('../controller/common');
const SysError = require('../common/sys_error');
const appApiContr = require('../controller/app_api');
const apiPrefix =  config.apiPrefix || '/render-server/api';

const AesObj = new AesCbc(config.aesKey);
module.exports = async (ctx, next) => {
  if (pathToRegexp([`${apiPrefix}/(.*)`]).test(ctx.path)) {
    try {
      // cookie数据的处理
      const cookieOptions = config.sessionOptions;

      const cookie = ctx.cookies.get(cookieOptions.sessionId, cookieOptions);
      if (cookie) {
        try {
          let cookieData = JSON.parse(AesObj.decrypt(cookie));
          // 判断是否过期

          if (cookieData.expires > Date.now()) {
            const accountInfo = config.accounts.find(account => {
              return account.name === cookieData.name;
            });
            ctx.accountInfo = accountInfo;
          }
        } catch (e) {
          log.warn('cookie decode error', e);
        }
      }
      // 接口数据通知接口
      if (pathToRegexp([`${apiPrefix}/notify_upload`]).test(ctx.path) && ctx.method === 'POST') {
        return await notifyContr.upload(ctx);
      }
      // 上传文件接口
      if (pathToRegexp([`${apiPrefix}/upload`]).test(ctx.path) && ctx.method === 'POST') {
        return await commonContr.upload(ctx);
      }
      // 获取请求的json数据
      const promise = new Promise(((resolve, reject) => {
        let buf = '';
        ctx.req.setEncoding('utf8');
        ctx.req.on('data', (chunk) => {
          buf += chunk;
        });
        ctx.req.on('end', () => {
          resolve(buf);
        });
        ctx.req.on('error', (err) => {
          reject(err);
        });
      }));
      const body = await promise;
      ctx.request.rawBody = body;
      ctx.request.body = {};
      if (body) {
        try {
          ctx.request.body = JSON.parse(body);
        } catch (e) {
          log.warn('request body parse error', e);
        }
      }
      // 接口数据通知接口
      if (pathToRegexp([`${apiPrefix}/notify`]).test(ctx.path) && ctx.method === 'POST') {
        return await notifyContr.notify(ctx);
      }
      if (
        ctx.header['x-requested-with'] !== 'XMLHttpRequest' &&
        (!config.referers || config.referers.length === 0 || pathToRegexp(config.referers).test(ctx.headers.referer))
      ) {
        return await next();
      }
      // 登录接口
      if (pathToRegexp([`${apiPrefix}/login`]).test(ctx.path) && ctx.method === 'POST') {
        await authContr.login(ctx);
      }
      // 登出接口
      if (pathToRegexp([`${apiPrefix}/logout`]).test(ctx.path) && ctx.method === 'POST') {
        await authContr.logout(ctx);
      }
      // 登录验证接口
      if ((!ctx.accountInfo || !ctx.accountInfo.name) && !ctx.body) {
        return ctx.body = util.resFormat(null, C.CODE.NEED_AUTH, C.MSG.NEED_AUTH, false);
      }
      if (pathToRegexp([`${apiPrefix}/login_info`]).test(ctx.path) && ctx.method === 'GET') {
        await authContr.loginInfo(ctx);
      }

      // ----------------------------------------应用接口测试相关接口--------------------------------------------------------
      const parseAppData = pathToRegexp(`${apiPrefix}/app/:appKey`).exec(ctx.path);
      // log.debug('parseAppData', parseAppData);
      // 获取应用详情及应用的接口列表
      if (parseAppData && ctx.method === 'GET') {
        ctx.params = {appKey: parseAppData[1]};
        await appApiContr.appInfo(ctx);
      }
      // 编辑 应用
      if (parseAppData && ctx.method === 'PUT') {
        ctx.params = {appKey: parseAppData[1]};
        await appApiContr.editAppInfo(ctx);
      }
      // 新增接口
      if (parseAppData && ctx.method === 'POST') {
        ctx.params = {appKey: parseAppData[1]};
        await appApiContr.addApi(ctx);
      }
      const parseApiData = pathToRegexp(`${apiPrefix}/app/:appKey/api/:apiId`).exec(ctx.path);
      // 获取接口详情
      if ( parseApiData && ctx.method === 'GET') {
        ctx.params = {appKey: parseApiData[1], apiId: parseApiData[2]};
        await appApiContr.apiInfo(ctx);
      }
      // 编辑接口
      if (parseApiData && ctx.method === 'PUT') {
        ctx.params = {appKey: parseApiData[1], apiId: parseApiData[2]};
        await appApiContr.editApi(ctx);
      }
      // 删除接口
      if (parseApiData && ctx.method === 'DELETE') {
        ctx.params = {appKey: parseApiData[1], apiId: parseApiData[2]};
        await appApiContr.deleteApi(ctx);
      }
      const parseApiAddCaseData = pathToRegexp(`${apiPrefix}/app/:appKey/api/:apiId/case`).exec(ctx.path);
      // 获取测试用例列表
      if (parseApiAddCaseData && ctx.method === 'GET') {
        ctx.params = {appKey: parseApiAddCaseData[1], apiId: parseApiAddCaseData[2]};
        await appApiContr.apiCases(ctx);
      }
      // 新增测试用例
      if (parseApiAddCaseData && ctx.method === 'POST') {
        ctx.params = {appKey: parseApiAddCaseData[1], apiId: parseApiAddCaseData[2]};
        await appApiContr.addApiCase(ctx);
      }
      const parseApiDelCaseData = pathToRegexp(`${apiPrefix}/app/:appKey/api/:apiId/case/:caseId`).exec(ctx.path);
      // 删除测试用例
      if (parseApiDelCaseData && ctx.method === 'DELETE') {
        ctx.params = {appKey: parseApiDelCaseData[1], apiId: parseApiDelCaseData[2], caseId: parseApiDelCaseData[3]};
        await appApiContr.deleteApiCase(ctx);
      }
      // 测试
      if (pathToRegexp(`${apiPrefix}/test`).test(ctx.path) && ctx.method === 'POST') {
        await appApiContr.test(ctx);
      }
      // 下面是应用配置相关接口
      if (pathToRegexp([`${apiPrefix}/list`]).test(ctx.path) && ctx.method === 'GET') {
        await renderContr.list(ctx);
      }
      if (pathToRegexp([`${apiPrefix}/info`]).test(ctx.path) && ctx.method === 'GET') {
        await renderContr.info(ctx);
      }

      if (pathToRegexp([`${apiPrefix}/add`]).test(ctx.path) && ctx.method === 'POST') {
        await renderContr.add(ctx);
      }

      if (pathToRegexp([`${apiPrefix}/edit`]).test(ctx.path) && ctx.method === 'PUT') {
        await renderContr.edit(ctx);
      }

      if (pathToRegexp([`${apiPrefix}/delete`]).test(ctx.path) && ctx.method === 'DELETE') {
        await renderContr.delete(ctx);
      }

      if (pathToRegexp([`${apiPrefix}/markdown`]).test(ctx.path) && ctx.method === 'GET') {
        await renderContr.md(ctx);
      }

      // cookie 处理
      if (ctx.accountInfo) {
        const cookieData = {
          name: ctx.accountInfo.name,
          expires: Date.now() + (config.sessionOptions.maxAge || 24 * 3600 * 1000),
        };
        ctx.cookies.set(cookieOptions.sessionId, AesObj.encrypt(JSON.stringify(cookieData)), cookieOptions);
      } else {
        const opts = Object.assign({}, cookieOptions, {
          expires: new Date('Thu, 01 Jan 1970 00:00:00 GMT'),
          maxAge: false,
        });
        ctx.cookies.set(cookieOptions.sessionId, '', opts);
      }
    } catch (err) {
      log.error('render-server', err);
      if (err instanceof SysError) {
        ctx.body = {
          code: err.code || 0,
          success: false,
          content: err.content || null,
          message: err.message,
        };
      } else {
        return  ctx.throw(500, err.message);
      }
    }
    if (!ctx.body) {
      return  ctx.throw(404, `path '${ctx.path}' not found`);
    }
  } else {
    await next();
  }
};
