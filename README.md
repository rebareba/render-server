
## 简介

Render-Server 作为中间件服务，根据路由的匹配配置来渲染对应的前端入口页面和接口代理转发，结合相应的插件可以实现后端服务的对接、数据mock、登录验证等功能

[Render-Server使用教程](https://segmentfault.com/a/1190000038972576)


**功能列表**

- 一键部署 npm run deploy
- 支持集群部署配置
- 是一个文件服务
- 是一个静态资源服务
- 在线可视化部署前端项目
- 配置热更新
- 在线Postman及接口文档
- 支持前端路由渲染， 支持模板
- 接口代理及路径替换
- Web安全支持 Ajax请求验证，Referer 校验
- 支持插件开发和在线配置 可实现： 前端模板参数注入、请求头注入、IP白名单、接口mock、会话、第三方登陆等等


## 部署说明


### 一键部署（推荐）

第一次部署可以选择该方式部署，

拷贝压缩包`render-server_x.x.x.tgz`到`/opt/workspace/`目录下：
解压后 进入项目 执行`npm run deploy` 进行一键部署会按推荐方式创建部署的相关目录和配置文件， 并启动服务：


```
[deploy workspace]$ tar -zxvf  render-server_x.x.x.tgz
...
[deploy workspace]$ cd  render-server
[deploy@ render-server] $ npm run deploy
...
[deploy@ render-server] $ pm2 ls
┌────────────────┬────┬─────────┬─────────┬───────┬────────┬─────────┬────────┬──────┬────────────┬────────┬──────────┐
│ App name       │ id │ version │ mode    │ pid   │ status │ restart │ uptime │ cpu  │ mem        │ user   │ watching │
├────────────────┼────┼─────────┼─────────┼───────┼────────┼─────────┼────────┼──────┼────────────┼────────┼──────────┤
│ render-server  │ 32 │ 2.0.0   │ cluster │ 29359 │ online │ 0       │ 43h    │ 0.3% │ 56.0 MB    │ deploy │ disabled │
│ render-server  │ 33 │ 2.0.0   │ cluster │ 29366 │ online │ 0       │ 43h    │ 0.2% │ 50.4 MB    │ deploy │ disabled │
└────────────────┴────┴─────────┴─────────┴───────┴────────┴─────────┴────────┴──────┴────────────┴────────┴──────────┘

```

部署成功 默认端口8888

### 手动部署


使用推荐的部署方式，和部署相关的项目代码下的文件和目录

- `config/config_prd.js` 推荐的配置文件拷贝到外部配置文件`/opt/conf/render-server/config.js`
- `data/*` 页面代理和接口渲染服务的配置存放目录
- `static/*` 打包静态文件和模板的存放目录
- `pm2.json` 服务启动配置文件 `pm2 start pm2.json` 可以修改部配置文件地址
- `bin/echo_config.js` 查看配置文件正确与否。执行`node echo_config.js`
- `bin/generate_password.js` 生成账号的密码 执行`node generate_password.js [password] [salt]`

相关目录：

- 创建`/data/render-server/data` 目录 并拷贝项目下的`data`目录内容到这里
- 创建`/data/render-server/logs` 目录 
- 创建`/data/render-server/static` 目录并拷贝项目下的`static`目录内容到这里, 后面静态文件都放这里

修改配置`/opt/conf/render-server/config.js` 中端口号等后进入项目执行

```
[deploy@ workspace]$ cd render-server
[deploy@ render-server]$ pm2 start pm2.json
```

### 配置文件说明

```js
'use strict';
/* eslint-disable */

module.exports = {
  debug: false, // 是否打印日志到日志文件中
  projectName: 'render-server',
  env: 'prd',
  port: 8888, // 服务的端口
  renderConfigPath: '/data/render-server/data', //面代理和接口渲染服务的配置存放目录 上面新建的对应
  staticOption: {
    rootPath: '/data/render-server/static', //打包静态文件的存放目录 上面新建的对应
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
      level: 'debug', //debug info warn error
      dirname: '/data/render-server/logs/', //日志存放目录 上面新建的对应
      maxFiles: '60d',
      // zippedArchive: true,
      // maxSize: '20m',
    },
  },
  // 视图的相关设置
  viewOption: {
    viewPath: '/data/render-server/static', //页面模板的目录 上面新建的对应
    options: {
      extension: 'ejs',
      map: {html: 'ejs' }
    },
  },
  // 通知自己服务订正数据 部署了几台机器就配置几台 支持高可用
  notifyHosts: ['http://127.0.0.1:8888'], // 更新配置的通知服务地址， 部署几台机器都有添加上，注意端口和上面对应
  // 会话相关配置，存在cookie中 加密
  sessionOptions: {
    sessionId: 'SESSION-RENDER-SERVER',
    maxAge: 86400 * 1000,
    path: '/',
    domain: '',
    overwrite: true,
    httpOnly: true,
    rolling: true,
  },
  // 默认的管理员账号 admin 密码123456
  accounts: [
    {
      name: 'admin', // 登录账号
      password: '0218fcb2204b59d9b89fcde783e4981a', //加盐密码 123456 密码盐 changfeng
      nickname: '超级管理员',
      // salt: 'changfeng', // 密码盐 默认chanfeng
      permission: 15, // + 1 查看 + 2 新建 + 4 编辑 + 8 删除  默认权限 &2才有新建配置项权限
      //如果不存在apps: {} 则说明有全部权限 // 指定配置的权限 如 {gateway: 5} 则对配置key为gateway 的有查看编辑权限
    },
  ],
  // 自带接口的白名单设置 参考npm包 ip-range-check
  whiteIps: ['0/0'],
  // 自带接口的ajax 请求的referer规则校验 path-to-regexp包判断
  referers: [],
  // 下面 cookie的aes-cdc的加密密钥及内容通知接口签名密钥
  aesKey: 'b7133978e6eb1a9efc3aae86b5b3a10f', // md5('changfeng')
};

```


### 添加账号

往配置项`accounts`添加， 如添加所有的只读账号 `read` 密码 `read`

`node bin/generate_password.js [password] [salt]`

```ssh
$ node bin/generate_password.js read 
input password: read |input salt: undefined
if salt undefined will use default salt:changfeng
acbddb0fd4b177b0fcd60709d20a8606

```

添加

```js
{
  accounts: [
    {
      name: 'read', // 登录账号
      password: 'acbddb0fd4b177b0fcd60709d20a8606', //加盐密码 123456 密码盐 changfeng
      nickname: '只读账号',
      permission: 1, // + 1 查看 + 2 新建 + 4 编辑 + 8 删除  默认权限 &2才有新建配置项权限
    },
  ]
}
```

添加空白账号 `test` 密码 `read`

```js
{
  accounts: [
    {
      name: 'test', // 登录账号
      password: 'acbddb0fd4b177b0fcd60709d20a8606', //加盐密码 123456 密码盐 changfeng
      nickname: '测试',
      permission: 3, // + 1 查看 + 2 新建 + 4 编辑 + 8 删除  默认权限 &2才有新建配置项权限
      apps: {}
    },
  ]
}
```


### 修改默认配置文件路径和进实例数

修改 `pm2.json` 的`CONFIG_PATH`配置项，指定配置文件的绝对路径

修改 `instances`配置项 为目标数，默认0为和cup的核心数一致

```json
{
  "apps": [
    {
      "name": "render-server",
      "script": "app.js",
      "instances": 0,
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production",
        "CONFIG_PATH":""
      }
    }
  ]
}

```


### 管理平台IP白名单配置

配置项 `whiteIps` 的配置 参考 [ip-range-check](https://github.com/danielcompton/ip-range-check#readme)



## 使用示例

http://127.0.0.1:8888/render-server/home
账号: admin
密码：123456

假设当前有一个前端项目`admin-front` 使用`webpack`进行打包， 设置的打包的`publicPath` 为 `/admin-front/1.1.0/`

打包出来的文件列表如下：

```
admin-front
└── 1.1.0
    ├── 0.css
    ├── assets
    ├── index.css
    ├── index.html
    ├── index.js
    └── vendor.js
```

**admin-front/1.1.0/index.html**内容如下

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Render-Server</title>
<link href="/admin-front/1.1.0/0.css" rel="stylesheet"><link href="/admin-front/1.1.0/index.css" rel="stylesheet"></head>
<script>
</script>
<script type="text/javascript">
    var appData = <%- JSON.stringify(appData) %>
</script>
<body>
<div id="root" style="width: 100%; height: 100%;"></div>
<script type="text/javascript" src="/admin-front/1.1.0/vendor.js"></script><script type="text/javascript" src="/admin-front/1.1.0/index.js"></script></body>
</html>

```

拷贝index.html 到`admin-front`目录下作为模板

```
admin-front
└── 1.1.0
    ├── 0.css
    ├── assets
    ├── index.css
    ├── index.html
    ├── index.js
    └── vendor.js
    index.html
```

### 第一步 拷贝打包文件到服务器


将前端项目打包出来文件拷贝到服务器的该目录下：

```
$scp -r dist/admin-front deploy@127.0.0.1:/data/render-server/static
```

登陆服务器查看

```ssh
[deploy@nodejs 1.1.0]$ pwd
/data/render-server/static/admin-front
[deploy@nodejs 1.1.0]$ ls 
index.html 1.1.0
[deploy@nodejs ]$ ls
0.css  assets  index.css  index.html  index.js  vendor.js
```

模板文件`/data/render-server/static/admin-front/index.html` 和服务设置的静态路径 `/data/render-server/static` 的相对路径是`admin-front/index.html` ，这个值在第二步配置`viewPath`使用到

### 第二步 在线配置服务

访问http://127.0.0.1:8888/render-server/home

登录后 右上角有按钮，新建一个服务配置项目， 配置内容如下

```json
{
    "key": "admin-front",
    "name": "管理后台前端",
    "description": "描述",
    "viewRender": [
        {
            "paths": [
                "/admin-front/(.*)",
                "/admin-front"
            ],
            "hosts": [],
            "plugins": [],
            "defaultData": {},
            "viewType": "path",
            "viewPath": "admin-front/index.html",
            "viewData": ""
        }
    ],
    "apiProxy": [
        {
            "methods": [],
            "paths": [
                "/admin-front/api/(.*)"
            ],
            "backHost": "http://127.0.0.1:80"
        }
    ]
}

```



保存配置 访问 `http://127.0.0.1:8888/admin-front` 就能看到渲染的前端页面

`apiProxy` 配置所有`/admin-front/api` 前缀的ajax请求都能代理到后端的 `http://127.0.0.1:80`这个服务。

### 第三步 代码更新和回滚

- scp 上传最新版本的文件和模板文件
- 回滚：拷贝服务器对应版本号下的`index.html`文件 替换模板`admin-front/index.html`

## 配置说明

### 示例

```json
{
	"key": "app",
	"account": "admin",
	"name": "应用服务",
	"pageIndex": "/app",
	"description": "描述",
	"viewRender": [
		{
			"paths": [
				"/app/(.*)",
				"/app"
			],
			"hosts": [
				"www.baidu.com"
			],
			"plugins": [],
			"defaultData": {},
			"viewType": "path",
			"viewPath": "app/index",
			"viewData": "直接是html的内容"
		}
	],
	"apiProxy": [
		{
			"methods": [],
			"paths": [
				"/app/(.*)",
				"/app"
			],
			"allRequest": false,
			"referers": [],
			"pathPrefix": "/app",
			"prefixPath": "",
			"plugins": [
				{
					"key": "test",
					"options": {
						"tenantId": 1,
						"productId": 7,
						"userId": 1
					}
				}
			],
			"headerMap": {
				"tenantId": "X-Access-TenantId",
				"productId": "X-Access-ProductId"
			},
			"defaultData": {},
			"backHost": "http://127.0.0.1:9017"
		}
	],
	"staticPrefix": [
		"/app/static/platform"
	]
}
```


### 配置项

`*` 标识为必填项


#### key*

`key` 值对应配置项的标识，对应配置项存储目录`/data/render-server/data` 下的`key.json`文件， 一旦设置无法修改，只能删除。 如`gateway`会有对应的`gateway.json`文件


#### account 

对应添加配置项的登录用户，无法修改和删除。新建的时候自动添加， 该账户对该配置有所有权限。

#### pageIndex

首页地址，仅为管理界面跳转使用


#### name*

配置的应用的名称

#### description*

配置的应用的功能描述

#### viewRender[]

路径匹配页面渲染，ajax请求时候请求头有`x-requested-with` 为`XMLHttpRequest` 不匹配, 且只匹配`GET`请求， 多个应用的配置可能会有互相干扰 注意路径分配。

##### viewRender[].paths[] *

使用 [path-to-regexp](https://github.com/pillarjs/path-to-regexp#readme)这个npm包来校验请求路径。

`["/app-gateway/(.*)"]` 匹配请求路径`ctx.path` 为`/app-gateway/`前缀的所有路径


##### viewRender[].hosts[]

非必须，空数组忽略
使用 [path-to-regexp](https://github.com/pillarjs/path-to-regexp#readme)来校验,支持多个正则匹配，结合paths的规则一起匹配， 并校验请求头的`host`值。

##### viewRender[].plugins[]

路径渲染前的插件列表 可以做一些登录判断，重定向等。

##### viewRender[].defaultData

这里的数据作为`ejs` 模板引擎的默认数据，可以使用插件覆盖数据， 插件往`ctx.renderData`赋值

##### viewRender[].viewType*

`path` 和 `data`两个值，默认`data` 对应下面的`viewData`数据，`path`对应`viewPath`路径

##### viewRender[].viewPath*

指定模板路径`/data/render-server/view`下的模板路径的相对地址

##### viewRender[].viewData*

模板的转义字符串值，和文件模板效果一致

```js
let ejsHtml = `esj模板的html的数据`

console.log(JSON.stringify(ejsHtml));
// 打印内容

```

#### apiProxy[]

API接口的代理配置，默认对ajax请求的代理，可配置多个代理配置，**多个应用的配置可能会有互相干扰**，需要合理分类路由，或设置不同的referers

##### apiProxy[].methods[]

非必须 空数组为全部方法。支持：'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'

##### apiProxy[].paths[]

使用 [path-to-regexp](https://github.com/pillarjs/path-to-regexp#readme)这个npm包来校验请求路径,支持多个正则匹配 ， 匹配请求的路由

##### apiProxy[].allRequest

Boolean 默认false， 是否判断请求头 `x-requested-with` 为`XMLHttpRequest` ， true 则不判断

##### apiProxy[].referers[]

请求头的header的referer判断，使用 [path-to-regexp](https://github.com/pillarjs/path-to-regexp#readme)这个npm包来校验，一般`CSRF跨站点请求伪造`攻击的安全措施

##### apiProxy[].pathPrefix

非必须 统一路径前缀剔除, 比如值为`/app-gateway`， 接口请求地址为 `/app-gateway/api/login` 则到后端接口请求的地址为`/api/login`

##### apiProxy[].prefixPath

非必须，统一后端请求路径前缀添加, 比如`pathPrefix`值为`/app-gateway`，`prefixPath`为`/api/gateway/v1` 当页面接口请求地址为 `/app-gateway/api/login` 则后端接口请求的地址为`/api/gateway/v1/api/login`

##### apiProxy[].plugins[]

非必须插件可以支持多个插件，按顺序执行， 具体使用可以参考下面插件开发说明。 一般有数据mock, 请求头注入设置，登录校验，会话处理等，请求白名单。

##### apiProxy[].headerMap{}

非必须， 对请求头的注入，会先剔除改请求头， 如请求头对应的key的值有就注入到请求头中，插件往`ctx.proxyData`赋值作为key的值
比如headerMap


```json
{
  "tenantId": "X-Access-TenantId",
  "productId": "X-Access-ProductId"
}
```

```js
ctx.proxyData = {
  tenantId: 1
}
// 最终到后端的请求头只有：
req.headers['X-Access-TenantId'] = 1
```

##### apiProxy[].defaultData[]

非必须作为 `ctx.proxyData`的默认值

##### apiProxy[].backHost*

后端服务的接口地址如`http://127.0.0.1:9017` 不支持负载均衡，后端服务自己实现高可用地址透出。


#### staticPrefix[]

一般情况可以忽略这个配置项。
静态文件的前缀剔除后再次寻找本地静态文件比如配置 `["/prefix/app"]`，静态文件请求地址为`/prefix/app/gateway/a.css` 则会先寻找配置的静态文件目录下的相对地址`prefix/app/gateway/a.css` 寻找文件，寻找不到再去`gateway/a.css`相对路径下寻找
。

## 插件开发

### 说明

插件代码存放在项目的 `plugin/` 目录下， 插件的key 就是文件名，比如`plugin/test.js` 的`key`就是`test`. 插件接收一个参数，必须有返回值`true`或`false`；

插件不区分是页面渲染使用还是接口代理使用，需用户自己判断添加，具体插件列表参考**插件**页说明；

返回值说明:

- true 返回true的时候，程序会继续往下走，会走到下一个插件，或页面渲染、或接口代理， 一般这个插件不会给`ctx.body` 赋值。一般给`ctx.proxyData`或`ctx.renderData`赋值
- false 一般插件这时候已经完成的请求处理，对请求返回内容已经做出响应。比如登录、登录验证失败，重定向等。

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

## TODO LIST

- 在线静态文件上传 (使用文件共享服务如：nfs、oss对接)
- 在线插件版本更新
- 集成应用网关（在线接口文档测试）
- Docker化


## CHANGELOG