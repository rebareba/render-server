'use strict';
const orgUtil = require('util');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const mkdirp = require('mkdirp');
const basename = path.basename(__filename);
const config = require('../config');
const log = require('../common/log');
const C = require('../common/constant');
const util = require('../common/util');

const renderConfigPath = config.renderConfigPath || __dirname;

// 内存缓存
let allRenders = [];
let allPrefixes = [];
let allProxies = [];
let allAppConfigs = [];

module.exports = {
  async loadRenders() {
    const appConfigs = [];
    let prefixes = [];
    let proxies = [];
    let renders = [];
    let paths = await orgUtil.promisify(fs.readdir)(renderConfigPath);
    paths = paths.filter(file => {
      return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-5) === '.json');
    });
    for (let file of paths) {
      try {
        const appConfig = JSON.parse(await orgUtil.promisify(fs.readFile)(path.join(renderConfigPath, file)));
        appConfig.key = file.substr(0, file.length - 5);

        if (appConfig.staticPrefix) {
          prefixes = prefixes.concat(appConfig.staticPrefix);
        }
        if (appConfig.viewRender) {
          renders = renders.concat(appConfig.viewRender);
        }
        if (appConfig.apiProxy ) {
          proxies = proxies.concat(appConfig.apiProxy);
        }
        log.debug('load appConfg:', appConfig);
        appConfigs.push(appConfig);
      } catch (e) {
        log.error('load appConfig error', e);
      }
    }
    allPrefixes = prefixes;
    allProxies = proxies;
    allRenders = renders;
    allAppConfigs = appConfigs;
  },
  /**
   * 初始化应用的配置创建目录和index.json文件
   * @param {string} key 应用key
   * @param {boolean} force  是否强制
   */
  async initApp(key, force = false) {
    if (!key) return;
    const appDir = path.join(config.apiTestPath, key);
    // await orgUtil.promisify(fs.mkdir)(appDir,  {recursive: true});
    await mkdirp(appDir);
    const indexJsonPath =  path.join(appDir, 'index.json');
    let indexJson = {
      hosts: [],
      categories: [{
        'cateCode': 'default',
        'name': '默认',
      }],
      apiPrefiies: [],
      ctime: moment().format('YYYY-MM-DD HH:mm:ss'),
      mtime: moment().format('YYYY-MM-DD HH:mm:ss'),
    };
    try {
      await orgUtil.promisify(fs.access)(indexJsonPath, fs.constants.F_OK);
      log.warn('init App file exit');
      if (force) {
        await orgUtil.promisify(fs.writeFile)(indexJsonPath, JSON.stringify(indexJson, null, '\t'), {flag: 'w+'});
      } else {
        indexJson = JSON.parse(await orgUtil.promisify(fs.readFile)(indexJsonPath));
      }
    } catch (err) {
      await orgUtil.promisify(fs.writeFile)(indexJsonPath, JSON.stringify(indexJson, null, '\t'), {flag: 'w+'});
    }
    return indexJson;
  },
  // 设置配置文件数据
  async setAppConfig(data) {
    const filePath = path.join(renderConfigPath, `${data.key}.json`);
    try {
      await orgUtil.promisify(fs.writeFile)(filePath, JSON.stringify(data, null, '\t'), {flag: 'w+'});
      await this.initApp(data.key);
      return true;
    } catch (e) {
      log.warn('setAppConfig', filePath, e);
      return false;
    }
  },
  // 设置配置文件数据
  async deleteAppConfig(key) {
    const filePath = path.join(renderConfigPath, `${key}.json`);
    try {
      await await orgUtil.promisify(fs.unlink)(filePath);
      return true;
    } catch (e) {
      log.warn('deleteAppConfig', filePath, e);
      return false;
    }
  },
  /**
   * 通知配置的各个服务处理数据
   * @param data
   * @param type: write|delete
   */
  async notifyServices(data, type = C.ACTIONS.ADD) {
    const query = {
      timestamp: parseInt(Date.now() / 1000),
      'nonce_str': util.generateString(),
    };
    const body = {
      type: type,
      data: data,
    };
    log.debug('notify data', body);
    const bodyString = JSON.stringify(body);
    query.md5 = util.md5(bodyString);
    query.sign = util.sign(query, config.aesKey);
    try {
      const promises = config.notifyHosts.map(host => {
        const options = {
          url: host + C.APIS.appConfigModify.path,
          method: C.APIS.appConfigModify.method,
          body: bodyString,
          qs: query,
          headers: {
            'Content-Type': 'application/json',
          },
        };
        return util.request(options);
      });
      const retData = await Promise.all(promises);
      for (let row of retData) {
        if (!row.success) {
          util.throw(C.MSG.NOTIFY_ERROR, C.CODE.NOTIFY_ERROR, retData);
        }
      }
      return retData;
    } catch (e) {
      log.error('notify service error', e);
      util.throw(C.MSG.ERROR_UNKNOWN, C.CODE.ERROR_UNKNOWN, e.message);
    }
  },
  // 获取所有的
  get renders() {
    return allRenders;
  },
  get prefixes() {
    return allPrefixes;
  },
  get proxies() {
    return allProxies;
  },
  // 获取所有的
  get appConfigs() {
    return allAppConfigs;
  },
  getAppConfig(appKey) {
    return allAppConfigs.find(appConfig => appConfig.key === appKey);
  },
};
// 监听文件的变化
fs.watch(renderConfigPath, async (event, filename) => {
  log.debug('fs watch', renderConfigPath, event, filename);
  if (filename.slice(-5) === '.json') {
    await module.exports.loadRenders();
  }
});
