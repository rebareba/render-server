// 生产环境键部署脚本
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');




// 创建目录
exec('mkdir -p /data/render-server/{data,static,logs,api-test} && mkdir -p /opt/conf/render-server',  (error) => {
  if (error) {
    console.error(`创建目录 exec error: ${error}`);
    return;
  }
  const listData = fs.readdirSync(path.join(__dirname, '../data'));
  console.log('配置文件列表：', listData.join('  '));

  const listStatic = fs.readdirSync(path.join(__dirname, '../static'));
  console.log('静态文件列表：', listStatic.join('  '));


   // 拷贝文件
  exec(`cp -r ${path.join(__dirname, '../data')} /data/render-server/ && cp -r ${path.join(__dirname, '../api-test')} /data/render-server/ && cp ${path.join(__dirname, '../config/config.js')} /opt/conf/render-server && cp -r ${path.join(__dirname, '../static')} /data/render-server/`, (error) => {
    if (error) {
      console.error(`拷贝文件 exec error: ${error}`);
      return;
    }
    const listData = fs.readdirSync('/data/render-server/data');
    console.log('data/render-server/data文件列表：', listData.join('  '));
  
    const listStatic = fs.readdirSync('/data/render-server/static');
    console.log('静态文件/data/render-server/static列表：', listStatic.join('  '));
    
    console.log('pm2 启动服务')
    exec(`cd ${path.join(__dirname, '..')} && pm2 start pm2.json`, (error) => {
      if (error) {
        console.error(`启动服务 exec error: ${error}`);
        return;
      }
      console.log('部署完成')
    });
  });
  
 })