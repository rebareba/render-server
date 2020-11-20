'use strict';
const Joi = require('@hapi/joi');
const log = require('./log');
const C = require('../common/constant');

const appConfig = Joi.object(
  {
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(200).required(''),
    account: Joi.string().max(100),
    pageIndex: Joi.string().pattern(/^\//).empty(''),
    viewRender: Joi.array().items(
      Joi.object({
        paths: Joi.array().items(Joi.string().min(1)).min(1).required(),
        hosts: Joi.array().items(Joi.string().min(1)),
        plugins: Joi.array().items(Joi.object({
          key: Joi.string().min(1).max(100).required(),
          options: Joi.any(),
        })),
        defaultData: Joi.any(),
        viewType: Joi.string().valid(C.VIEW_TYPES.PATH, C.VIEW_TYPES.DATA).required(),
        viewPath: Joi.when('viewType', {is: C.VIEW_TYPES.PATH, then: Joi.string().max(100).required()}),
        viewData: Joi.when('viewType', {is: C.VIEW_TYPES.DATA, then: Joi.string().required()}),
      })
    ),
    apiProxy: Joi.array().items(
      Joi.object({
        methods: Joi.array().items(Joi.string().valid('GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH')), //CONNECT TRACE
        paths: Joi.array().items(Joi.string().min(1)).min(1).required(),
        referers: Joi.array().items(Joi.string().min(1)),
        allRequest: Joi.string().valid(true, false),
        pathPrefix: Joi.string().max(100).empty(''), // 要去除的路径前缀
        prefixPath: Joi.string().max(100).empty(''), // 要拼接的路径前缀
        plugins: Joi.array().items(Joi.object({
          key: Joi.string().min(1).max(100).required(),
          options: Joi.any(),
        })),
        defaultData: Joi.any(),
      })
    ),
    staticPrefix: Joi.array().items(Joi.string().min(1).max(100)),
  }
);
const key = Joi.string().min(1).max(100).required();

// 定义 各种操作的schemas
const schemas = {
  // 登录校验
  login: Joi.object(
    {
      name: Joi.string().max(50).required(),
      password: Joi.string().length(32).required(),
    }
  ),
  info: Joi.object(
    {
      key: key,
    }
  ),
  edit: Joi.object(
    {
      key: key,
      config: appConfig,
    }
  ),
  delete: Joi.object(
    {
      key: key,
    }
  ),
  add: appConfig.append({
    key: key,
  }),
  notify: Joi.object(
    {
      type: Joi.string().valid(...Object.keys(C.ACTIONS)).required(),
      data: Joi.when('type', {is: C.ACTIONS.ADD, then: appConfig}).when('type', {is: C.ACTIONS.EDIT, then: appConfig}).when('type', {is: C.ACTIONS.DELETE, then: key}),
    }
  ),
};



module.exports = (data, schema, options = {allowUnknown: true}) => {
  const useSchema = schemas[schema];
  if (!useSchema) {
    throw new Error('schemas not exist');
  }
  const {error, value} = useSchema.validate(data, options);
  if (error) {
    log.error(`parse validate ${schema}:`, error.message, value);
  } else {
    log.debug(`validate ${schema} data:`, value);
  }
  return {error, value};
};
