
## 插件开发

插件存放在项目的 `plugin/` 目录下， 插件的key 就是文件名，比如`plugin/test.js` 的`key`就是`test`. 插件接收一个参数，必须有返回值`true`或`false`；
插件不区分是页面渲染使用还是接口代理使用，需用户自己判断添加。

返回值说明:

- true 返回true的时候，程序会继续往下走，会走到下一个插件，或页面渲染、或接口代理， 一般这个插件不会给`ctx.body` 赋值。一般给`ctx.proxyData`或`ctx.renderData`赋值
- false 一般插件这时候已经完成的请求处理，ctx.body 赋值了；比如登录、登录验证失败，重定向等。

比如下面的`plugin/test.js`如下：

```js
'use strict';

const log = require('../common/log');

module.exports = (options) => {
  return async (ctx) => {
    log.debug('plugin test options', options);
    // 这个是接口代理数据
    ctx.proxyData = options;
    // 这个是模板注入数据
    ctx.renderData = options;
    return true;
  };
};
```

插件开发完成后放到 `plugin`目录下重启服务，并在接口代理或者页面渲染代理配置上插件即可使用：

```json
{
  "plugins": [
    {
      "key": "test",
      "options": {
        "tenantId": 1,
        "productId": 7,
        "userId": 1
      }
    }
  ]
}
```



## 插件列表

### 数据mock (mock)

### ip白名单 （white_ip）



### 微信网页登录 (wechat_login)

```json
{
  "key": "wechat_login",
  "options": {
    "isMock": false,
    "mockContent": {
      "openid": "x-wehchat-openid"
    },
    "sessionId": "wechat",
    "cookieOptions": {
      "maxAge": 86400000,
      "path": "/",
      "domain": "baidu.com.cn",
      "overwrite": true,
      "httpOnly": true,
      "rolling": true,
      "renew": true
    },
    "appId": "wxd7ab985cde7b886f",
    "state": "state",
    "scope": "snsapi_base",
    "type": "proxy",
    "url": "http://127.0.0.1/api/login",
    "componentAppId": "如果是第登录获取code的配置",
  }
}
```

- type proxy或render 使用的场景




