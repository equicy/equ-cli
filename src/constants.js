// 存放用户所需要的常量
const { version } = require('../package.json');

// 判断当前的系统是mac或者window
const downloadDirectory = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.template`;

module.exports = {
  version,
  downloadDirectory,
};
