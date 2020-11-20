'use strict';


/* eslint key-spacing: off */
module.exports = {
  CODE: {
    SUCCESS_OK           : 'OK',
    ERROR_PARAMS         : 'ERROR_PARAMS',
    ERROR_UNKNOWN        : 'ERROR_UNKNOWN',
    DATA_REPEAT          : 'DATA_REPEAT',
    DATA_NOT_FOUND       : 'ERROR_DATA_NOT_FOUND',
    PASS_ERROR           : 'ERROR_PASS_ERROR',
    NEED_AUTH            : 'ERROR_NEED_AUTH',
    NO_PERMISSION        : 'NO_PERMISSION',
    SIGN_ERROR           : 'SIGN_ERROR',
    NOTIFY_ERROR         : 'NOTIFY_ERROR',
  },
  MSG: {
    SUCCESS_OK           : 'OK',
    ERROR_PARAMS         : '请求参数错误',
    ERROR_UNKNOWN        : '未知错误，请联系管理员！',
    DATA_REPEAT          : '数据已存在，重复提交!',
    DATA_NOT_FOUND       : '数据没有找到!',
    PASS_ERROR           : '账号或密码错误!',
    NEED_AUTH            : '未登录！',
    NO_PERMISSION        : '当前用户没有该权限',
    SIGN_ERROR           : '签名错误',
    NOTIFY_ERROR         : '通知操作文件异常，请联系管理员或重试',
    API_NOT_FOUND        : '接口数据没有找到!',
  },
  // + 1 查看 + 2 新建 + 4 编辑 + 8 删除
  PER: {
    ALL : 15,
    VIEW: 1,
    ADD: 2,
    EDIT: 4,
    DELETE: 8,
  },
  // KEY和值要一致
  ACTIONS: {
    // 删除配置
    DELETE: 'DELETE',
    // 新增或者编辑配置
    ADD: 'ADD',
    EDIT: 'EDIT',
    // 应用操作
    APP: 'APP',
    // 添加编辑接口
    API: 'API',
    // 删除接口
    API_DELETE: 'API_DELETE',
    // 添加删除接口测试用例
    CASE: 'CASE',
  },
  VIEW_TYPES: {
    PATH: 'path',
    DATA: 'data',
  },
  // 通知的接口配置
  APIS: {
    appConfigModify: {
      method: 'POST',
      path: '/render-server/api/notify',
    },
    uploadFile: {
      method: 'POST',
      path: '/render-server/api/notify_upload',
    },
  },
  API_TEST: {
    // 请求头标识
    HEADER_FLAG: 'x-render-server-api-test-flag',
    // 请求头标识的值
    HEADER_FLAG_DATA: 'RENDER_SERVER_TEST',
    // 请求更改后端host的标识
    HEADER_BACKHOST: 'x-render-server-api-test-host',
  },
};
