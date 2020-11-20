'use strict';

const path = require('path');
const pkg = require('../package.json');
/* eslint-disable */

module.exports = {
  debug: true,
  projectName: 'render-server',
  env: 'dev',
  port: 8888,
  // 自带接口统一前缀
  apiPrefix: '/render-server/api',
  globalConfigFile: `/opt/conf/${pkg.name}/config.js`,
  renderConfigPath: path.join(__dirname, '../data'),
  // 应用接口地址
  apiTestPath: path.join(__dirname, '../api-test'),
  staticOption: {
    rootPath: path.join(__dirname, '../static'),
    options: {
      maxage: 7 * 24 * 3600 * 1000,            //  Browser cache max-age in milliseconds. defaults to 0
      hidden: false,        //  Allow transfer of hidden files. defaults to false
      index: false,         //  Default file name, defaults to 'index.html'
      //  defer: false,     //   当前场景要先处理false If true, serves after return next(), allowing any downstream middleware to respond first.
      gzip: true,            //  Try to serve the gzipped version of a file automatically when gzip is supported by a client and if the requested file with .gz extension exists. defaults to true.
      br: true,             //  Try to serve the brotli version of a file automatically when brotli is supported by a client and if the requested file with .br extension exists (note, that brotli is only accepted over https). defaults to true.
      // setHeaders,        //  Function to set custom headers on response.
      // extensions: false,  //Try to match extensions from passed array to search for file when no extension is sufficed in URL. First found is served. (defaults to false)
    },
  },
  logger: {
    prd: {
      name: 'all',
      level: 'info',
      localTime: true,
      datePattern: 'YYYY-MM-DD',
      filename: 'server.%DATE%.log',
      dirname: `/data/${pkg.name}/logs/`,
      maxFiles: '60d',
      // zippedArchive: true,
      // maxSize: '20m',
    },
    dev: {
      name: 'local',
      level: 'debug',
      localTime: true,
    },
  },
  // 视图的相关设置
  viewOption: {
    // viewPath: path.join(__dirname, '../view'),
    viewPath: path.join(__dirname, '../static'),
    options: {
      extension: 'ejs',
      map: {html: 'ejs' }
    },
  },
  // 上传文件配置项
  uploadOptions: {
    options: {
      formLimit: '2mb',
      jsonLimit: '3mb',
      multipart: true,
      formidable: {
        maxFieldsSize: 100 * 1024 * 1024,
        keepExtensions: true,
        multiples: false,
        hash: 'md5',
      },
      parsedMethods: ['POST', 'PUT', 'DELETE'],
    },
    host: "http://192.168.90.68:8888",
  },
  // 通知自己服务订正数据
  notifyHosts: ['http://127.0.0.1:8888'],
  sessionOptions: {
    sessionId: 'SESSION-RENDER-SERVER',
    maxAge: 86400 * 1000,
    path: '/',
    domain: '',
    overwrite: true,
    httpOnly: true,
    rolling: true,
  },
  accounts: [
    {
      name: 'admin',
      password: '0218fcb2204b59d9b89fcde783e4981a', // 123456 密码盐 changfeng
      nickname: '超级管理员',
      // salt: 'changfeng',
      permission: 15, // + 1 查看 + 2 新建 + 4 编辑 + 8 删除
      //如果不存在apps: {} 则说明有全部权限
    },
    {
      name: 'test',
      password: '0218fcb2204b59d9b89fcde783e4981a', // 123456 密码盐 changfeng
      nickname: '普通账号',
      // salt: 'changfeng',
      permission: 3, // + 1 查看 + 2 新建 + 4 编辑 + 8 删除
      //如果不存在apps: {} 则说明有全部权限 render-server 只读权限
      apps: {'render-server': 1}
    },
  ],
  // 自带接口的白名单设置
  whiteIps: ['0/0'],
  // 真实ip地址的请求头注入key, 覆盖其他 为空则无
  trueIpHeaderKey: 'x-proxy-real-ip',
  // 自带接口的ajax 请求的referer规则 path-to-regexp验证
  referers: [],
  aesKey: 'b7133978e6eb1a9efc3aae86b5b3a10f', // md5('changfeng')
};
