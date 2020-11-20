'use strict';
/* eslint-disable */

module.exports = {
  debug: false,
  projectName: 'render-server',
  env: 'prd',
  port: 8888,
  // 自带接口统一前缀
  apiPrefix: '/render-server/api',
  renderConfigPath: '/data/render-server/data',
  apiTestPath:  '/data/render-server/api-test',
  staticOption: {
    rootPath: '/data/render-server/static',
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
    dev: {
      name: 'local',
      level: 'debug',
      localTime: true,
    },
    prd: {
      name: 'all',
      level: 'info',
      dirname: '/data/render-server/logs/',
      maxFiles: '60d',
      // zippedArchive: true,
      // maxSize: '20m',
    },
  },
  // 视图的相关设置
  viewOption: {
    viewPath: '/data/render-server/static',
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
    host: "http://127.0.0.1:8888",
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
  ],
  trueIpHeaderKey: 'x-real-ip',
  // 自带接口的白名单设置
  whiteIps: ['0/0'],
  // 自带接口的ajax 请求的referer规则
  referers: [],
  aesKey: 'b7133978e6eb1a9efc3aae86b5b3a10f', // md5('changfeng')
};
