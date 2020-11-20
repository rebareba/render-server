'use strict';

const config = require('../config');
const AesCbc = require('../common/aes_cbc_crypto');
const log = require('../common/log');
const {request} = require('../common/util');

/**
 * 访问页面的微信登录校验 未登录就直接跳转到微信域名
 * @param options
  {
    "isMock": false,
    "mockContent": {},
    "sessionId": "wechat",
    "cookieOptions": {
      maxAge: 86400 * 1000,
      path: '/',
      domain: '.baid.com',
      overwrite: true,
      httpOnly: true,
      rolling: true,
      renew: true,
    },
    "appId": "appId",
    "state": "state",
    "aesKey": "32位",
    "type": "render|proxy",
    "url": "code换取用户信息接口地址",
    "componentAppId": "如果是第登录获取code的配置",
  }
 * @return {Function}
 */
module.exports = (options) => {
  const AesObj = new AesCbc(options.aesKey || config.aesKey);
  return async (ctx) => {
    if (options.isMock) {
      ctx.proxyData = options.mockContent || {};
      return true;
    }
    // 获取cookie数据
    const cookie = ctx.cookies.get(options.sessionId, options.cookieOptions);
    let cookieData;
    if (cookie) {
      try {
        cookieData = JSON.parse(AesObj.decrypt(cookie));
        log.debug('cookieData', cookieData);
        // 判断是否过期
        ctx.proxyData = cookieData;
      } catch (e) {
        log.warn('plugin wechat_login cookie decode error', e);
      }
    } else {
      log.debug('还没有cookie');
    }
    // 如果是渲染页面情况 则跳转处理
    if (options.type !== 'proxy' && !cookieData) {
      // 如果获取
      const state = options.state || options.appId;
      if (ctx.query.code && ctx.query.state === state) {
        try {
          const response = await request({
            method: 'POST',
            uri: options.url,
            qs: ctx.query,
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify(Object.assign(ctx.query, {appId: options.appId, token: options.token || 'changfeng'})),
          });
          log.debug('plugin wechat_login code 换取用户信息', response);
          if (response.success) {
            log.debug('设置cookie', response.content);
            const cookieData = {
              openid: response.content.openid,
              accessToken: response.content.access_token,
              channelCode: ctx.query.channelCode || 'default',
            };
            ctx.cookies.set(options.sessionId, AesObj.encrypt(JSON.stringify(cookieData)), options.cookieOptions);
            return true;
          } else {
            return true;
          }
        } catch (e) {
          log.warn('plugin wechat_login get info', e);
          return true;
        }
      }
      const redirectUri = `${ctx.protocol}://${ctx.host}${ctx.originalUrl}`;
      const baseUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize';
      const scope = options.scope || 'snsapi_base';
      const encodeRedirectUri = encodeURIComponent(redirectUri);
      let url = `${baseUrl}?appid=${options.appId}&redirect_uri=${encodeRedirectUri}&response_type=code&scope=${scope}&state=${state}`;
      if (options.componentAppId) {
        url = `${url}&component_appid=${options.componentAppId}`;
      }
      url = url + '#wechat_redirect';
      log.info('plugin wechat_login url', url);
      ctx.status = 302;
      ctx.redirect(url);
      return false;
    }

    return true;
  };
};
