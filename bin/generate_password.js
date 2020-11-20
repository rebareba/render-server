// 加密密码生成器
// node generate_password.js [password] [salt]
const util = require('../common/util');

let password = process.argv[2];
let salt = process.argv[3];
console.log('input password:', password, '|input salt:', salt);
if (!salt) {
  console.log('if salt undefined will use default salt:changfeng');
}
if (!password) {
  console.log('node generate_password.js [password] [salt]');
  process.exit(0);
}

console.log(util.encodePassword(util.md5(password), salt))
