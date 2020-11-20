'use strict';

const crypto = require('crypto');
const _ = require('lodash');
const httpClient = require('request');
const uuid = require('uuid');
const C = require('./constant');
const log = require('./log');
const SysError = require('./sys_error');

// 普通请求响应
exports.request = async (options, json = true) => {
  return new Promise((resolve, reject) => {
    httpClient(options, (error, response, body) => {  //调用接口
      if (!error && response.statusCode === 200) {//出异常的时候也是这个条件 需要处理
        try {
          if (json) {
            log.debug('response', body);
            const retData = JSON.parse(body);
            return resolve(retData);
          } else  {
            return resolve(body);
          }
        } catch (parseError) {
          return reject(parseError);
        }
      }
      if (error) {
        return reject(error);
      }
      const e = new Error('状态码异常');
      e.response = response;
      e.body = body;
      reject(e);
    });
  });
};
/**
 * 返回 包含header
 * @param {*} options
 * @param {boolean} json
 * @retrun {object} {body, headers}
 */
exports.requestMore = async (options, json = true) => {
  return new Promise((resolve, reject) => {
    httpClient(options, (error, response, body) => {  //调用接口
      if (!error && response.statusCode === 200) {//出异常的时候也是这个条件 需要处理
        try {
          if (json) {
            log.debug('response', body);
            const retData = JSON.parse(body);
            return resolve({body: retData, headers: response.headers});
          } else  {
            return resolve({body, headers: response.headers});
          }
        } catch (parseError) {
          return reject(parseError);
        }
      }
      if (error) {
        return reject(error);
      }
      const e = new Error('状态码异常');
      e.response = response;
      e.body = body;
      reject(e);
    });
  });
};

// 判断是否是ajax 请求
exports.isAjaxRequest = ctx => ctx.header['x-requested-with'] === 'XMLHttpRequest';
/**
 * 替换前缀
 * @param string
 * @param target
 * @param position 开始的位置
 * @return {flag: boolean, string: af}
 */
exports.startsReplace = (str, target, position = 0) => {
  let string = str;
  let flag = _.startsWith(string, target, position);
  if (flag) {
    string = string.substring(0, position) + string.substring(position + target.length);
  }
  return {flag, string};
};
/**
 * 获取请求IP
 */
exports.getReqIP = (ctx, client = false) => {
  let ip = ctx.headers['remoteip'] || ctx.headers['x-real-ip'] || ctx.headers['x-forwarded-for'] || ctx.request.ip;
  if (client) {
    ip = ctx.request.ip;
  }
  ip.indexOf('::ffff:') !== -1 && (ip = ip.substr(7));
  ip.indexOf('::1') !== -1 && (ip = '127.0.0.1');
  // ip = ip.split(',');
  // ip = ip[ip.length -1];
  return ip.trim();
};
exports.md5 = (text, inEncode = 'utf8', outEncode = 'hex') => crypto.createHash('md5').update(text, inEncode).digest(outEncode);
// 加盐密码
exports.encodePassword =  (md5Pass, salt = 'changfeng') => {
  return this.md5(salt + md5Pass + salt);
};
exports.resFormat = (content = null, code = 0, message = '', success = true) => {
  log.debug('resFormat', success, code, message, content);
  return {
    success,
    code,
    content,
    message,
  };
};
// 校验权限
exports.checkPermission = (accountInfo, checkPermission = 0, appConfig) => {
  log.debug('accountInfo', accountInfo, appConfig);
  let permission = 0;
  if (checkPermission === C.PER.ADD || !accountInfo.apps) {
    permission =  accountInfo.permission || 0;
  } else if (accountInfo.apps[appConfig.key] || accountInfo.name === appConfig.account) {
    log.debug('a', accountInfo, appConfig);
    permission = accountInfo.apps[appConfig.key] || C.PER.ALL;
  }
  log.debug('permission', permission, checkPermission);
  return permission & checkPermission;
};
//随机生成6位随机数
exports.generateString = (len = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let str = '';
  for (let i = 0; i < len; i++) {
    const pos = Math.round(Math.random() * (chars.length - 1));
    str += chars.substr(pos, 1);
  }
  return str;
};
// 签名排序
exports.sign = (data, secret) => {
  let keys = [];
  for (const key in data) {
    keys.push(key);
  }
  keys = keys.sort();
  let str = '';
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (typeof data[key] !== 'string' && typeof data[key] !== 'number') {
      str += key + '=' + JSON.stringify(data[key]) + '&';
    } else {
      str += key + '=' + data[key] + '&';
    }
  }
  str = str.substr(0, str.length - 1);
  str = str + '&key=' + secret;
  return this.md5(str);
};
/**
 * 校验签名数据
 * @param data query参数
 * @param signData
 * @param secret
 */
exports.checkSign = (data, signString, secret) => {
  const sign = this.sign(data, secret);
  if (sign !== signString) {
    return false;
  }
  return true;
};

/**
 * 抛出错误 message ,code , content, status
 * @param {String} msg 错误信息
 * @param {String} code 错误码
 */
exports.throw = (...args) => {
  throw new SysError(...args);
};

// 生成唯一ID
exports.uuid = () => {
  return uuid.v4().replace(/\-/g, '');
};

/**
 * 类型判断
 * eg:
 * isType('String', 'hello'); // true
 * isType('Number', 1); // true
 * isType('Object', []); // false
 * @param {类型字符串} type
 */
exports.isType = (type, obj) => {
  return Object.prototype.toString.call(obj) === `[object ${type}]`;
};
