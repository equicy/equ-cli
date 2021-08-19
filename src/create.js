const ora = require('ora');
const Inquirer = require('inquirer');
const { promisify } = require('util');
let ncp = require('ncp');
const path = require('path');
const fs = require('fs');
const { exec, execSync } = require('child_process');

ncp = promisify(ncp);

// 拉取自己所有的项目列出来，让用户选
// 选择完之后显示所有的版本号
// 可能需要配置一些数据，来结合渲染
// https://api.github.com/orgs/zhu-cli/repos 获取组织下的仓库

// 封装loading的效果
const waitFnLoading = (fn, message) => async (...args) => {
  const spinner = ora(message);
  spinner.start();
  const result = await fn(...args);
  spinner.succeed();

  return result;
};

const resolve = (filePath) => path.resolve(__dirname, filePath);
const mergePackage = async (projectName) => {
  let context = fs.readFileSync(resolve('./template/package.json')).toString();
  context = JSON.parse(context);
  context.name = projectName;
  const dir = fs.existsSync(projectName);
  if (dir) {
    const { cover } = await Inquirer.prompt({
      name: 'cover', // 获取选择后的结果
      type: 'list',
      message: 'this project already exist, is cover?',
      choices: ['yes', 'no'],
    });
    if (cover) {
      fs.writeFileSync(resolve(`../${projectName}/package.json`), JSON.stringify(context, null, 2));
    }
  } else {
    fs.mkdirSync(projectName);
    fs.writeFileSync(resolve(`../${projectName}/package.json`), JSON.stringify(context, null, 2));
  }
};

module.exports = async (projectName) => {
  await mergePackage(projectName);
  // waitFnLoading(execSync('npm install'), 'installing');
  execSync(`cd ${projectName} && npm install`);
  // execSync('npm install');
};
