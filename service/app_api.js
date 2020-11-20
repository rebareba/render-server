'use strict';
/*
 * @Author: changfeng
 * @LastEditors: changfeng
 * @LastEditTime: 2020-07-30 21:19:32
 * @Description: 应用及服务接口
 */

const orgUtil = require('util');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const log = require('../common/log');
const C = require('../common/constant');
const util = require('../common/util');
const request = require('request');

const renderService = require('./render');
module.exports = {
  // 获取应用详情
  async getAppInfo(appKey) {
    let appInfo = {};
    try {
      appInfo = JSON.parse(await orgUtil.promisify(fs.readFile)(path.join(config.apiTestPath, appKey, 'index.json')));
    } catch (err) {
      log.error('getAppInfo error', err);
      appInfo = renderService.initApp(appKey, true);
    }
    return appInfo;
  },
  // 获取应用的接口配置
  async getAppApis(appKey) {
    let paths = await orgUtil.promisify(fs.readdir)(path.join(config.apiTestPath, appKey));
    paths = paths.filter((p) => {
      return !/_case\.json$/.test(p) && p !== 'index.json';
    });
    let apis = [];
    for (let i = 0; i < paths.length; i ++) {
      try {
        let p = paths[i];
        const apiInfo = JSON.parse(await orgUtil.promisify(fs.readFile)(path.join(config.apiTestPath, appKey, p)));
        apis.push({
          apiId: apiInfo.apiId,
          name: apiInfo.name,
          description: apiInfo.description,
          path: apiInfo.path,
          apiPrefix: apiInfo.apiPrefix,
          method: apiInfo.httpMethod || 'POST',
          cateCode: apiInfo.cateCode,
        });
      } catch (err) {
        log.warn('接口数据读取异常', appKey, err);
      }
    }
    return apis;

  },
  // 获取接口详情
  async getApiInfo(appKey, apiId) {
    try {
      return JSON.parse(await orgUtil.promisify(fs.readFile)(path.join(config.apiTestPath, appKey, `${apiId}.json`)));
    } catch (err) {
      log.error('getApiInfo', err);
      util.throw(C.MSG.API_NOT_FOUND, C.CODE.DATA_NOT_FOUND);
    }
  },
  /**
   *获取接口的测试用例
   * @param {string} appKey
   * @param {string} apiId
   * @returns {Array}
   */
  async getApiCases(appKey, apiId) {
    try {
      await orgUtil.promisify(fs.access)(path.join(config.apiTestPath, appKey, `${apiId}.json`), fs.constants.F_OK);
    } catch (err) {
      log.error('getApiCases', err);
      util.throw(C.MSG.API_NOT_FOUND, C.CODE.DATA_NOT_FOUND);
    }
    try {
      return JSON.parse(await orgUtil.promisify(fs.readFile)(path.join(config.apiTestPath, appKey, `${apiId}_case.json`)));
    } catch (err) {
      log.warn('测试用例数据不存在', err.message);
      return [];
    }
  },
  // 通知处理测试用例
  async modifyCase(data) {
    const filePath = path.join(config.apiTestPath, data.appKey, `${data.apiId}_case.json`);
    try {
      await orgUtil.promisify(fs.writeFile)(filePath, JSON.stringify(data.data, null, '\t'), {flag: 'w+'});
      return true;
    } catch (e) {
      log.warn('modifyCase', filePath, e);
      return false;
    }
  },
  // 通知应用详情
  async modifyApp(data) {
    const filePath = path.join(config.apiTestPath, data.appKey, 'index.json');
    try {
      await orgUtil.promisify(fs.writeFile)(filePath, JSON.stringify(data.data, null, '\t'), {flag: 'w+'});
      return true;
    } catch (e) {
      log.warn('modifyApp', filePath, e);
      return false;
    }
  },
  // 通知应用详情
  async addApi(data) {
    const filePath = path.join(config.apiTestPath, data.appKey, `${data.apiId}.json`);
    try {
      await orgUtil.promisify(fs.writeFile)(filePath, JSON.stringify(data.data, null, '\t'), {flag: 'w+'});
      return true;
    } catch (e) {
      log.warn('addApi', filePath, e);
      return false;
    }
  },
  // 通知应用详情
  async delApi(data) {
    const apiFilePath = path.join(config.apiTestPath, data.appKey, `${data.apiId}.json`);
    const apiFileCasePath = path.join(config.apiTestPath, data.appKey, `${data.apiId}_case.json`);
    try {
      await orgUtil.promisify(fs.unlink)(apiFilePath);
      await orgUtil.promisify(fs.unlink)(apiFileCasePath);
      return true;
    } catch (e) {
      log.warn('delApi', data, e);
      return true;
    }
  },
  // 进行接口测试
  async test(data = {path: '', method: 'GET', query: {}, headers: {}, host: '', direct: false}) {
    let host = `http://localhost:${config.port}`;
    let headers = data.headers;
    if (typeof data.body === 'object ') {
      data.body = JSON.stringify(data.body);
    }
    if (data.direct && data.host) {
      host = data.host;
    } else {
      headers = Object.assign({}, data.headers, {[C.API_TEST.HEADER_FLAG]: C.API_TEST.HEADER_FLAG_DATA});
      if (data.host) {
        headers[C.API_TEST.HEADER_BACKHOST] = data.host;
      }
    }
    const options = {
      url: host + (data.path || ''),
      method: data.method || 'GET',
      body: data.body ? JSON.stringify(data.body) : data.body,
      qs: data.query,
      headers: headers,
    };
    log.debug('TEST', options.method, options.url, options.headers, options.qs, options.body);
    return await new Promise((resolve) => {
      const retData =  {
        headers: {},
        body: {},
        status: 200,
      };
      request(options, (error, response, body) => {  //调用接口
        if (error) {
          log.error('request error', error);
          retData.status = 'null';
          retData.body = error.message;
          return resolve(retData);
        }
        retData.headers = response.headers;
        retData.status = response.statusCode;
        retData.body = body;
        resolve(retData);
      });
    });
  },
};
