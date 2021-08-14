const axios = require('axios');
const ora = require('ora');
const Inquirer = require('inquirer');
const { promisify } = require('util');
let downloadGitRepo = require('download-git-repo');
let ncp = require('ncp');
const path = require('path');
const Metalsmith = require('metalsmith'); // 遍历文件夹 找需不需要渲染
let { render } = require('consolidate').ejs;
const fs = require('fs');
const { downloadDirectory } = require('./constants');

downloadGitRepo = promisify(downloadGitRepo);
ncp = promisify(ncp);
render = promisify(render);

// 拉取自己所有的项目列出来，让用户选
// 选择完之后显示所有的版本号
// 可能需要配置一些数据，来结合渲染
// https://api.github.com/orgs/zhu-cli/repos 获取组织下的仓库

// 获取仓库列表
const fetchRepoList = async () => {
  const { data } = await axios.get('https://api.github.com/orgs/zhu-cli/repos');
  return data;
};

const fetchTagList = async (repo) => {
  const { data } = await axios.get(`https://api.github.com/repos/zhu-cli/${repo}/tags`);

  return data;
};

// 封装loading的效果
const waitFnLoading = (fn, message) => async (...args) => {
  const spinner = ora(message);
  spinner.start();
  const result = await fn(...args);
  spinner.succeed();

  return result;
};

const download = async (repo, tag) => {
  let api = `zhu-cli/${repo}`;
  if (tag) {
    api += `#${tag}`;
  }
  // /usr/xxx/.template/repo
  const dest = `${downloadDirectory}/${repo}`;
  await downloadGitRepo(api, dest);
  return dest; // 下载的最终目录
};

module.exports = async (projectName) => {
  // 获取项目所有模版

  let repos = await waitFnLoading(fetchRepoList, 'fetching template ...')();
  repos = repos.map((item) => item.name);

  console.log(repos);

  // 获取之前显示loading ora
  // 选择模版 inquirer

  const { repo } = await Inquirer.prompt({
    name: 'repo', // 获取选择后的结果
    type: 'list',
    message: 'please choice a template to create project',
    choices: repos,
  });

  // 通过当前选择的项目，拉取对应的版本
  // https://api.github.com/repos/zhu-cli/vue-template/tags
  let tags = await waitFnLoading(fetchTagList, 'fetching tags ...')(repo);
  tags = tags.map((item) => item.name);

  const { tag } = await Inquirer.prompt({
    name: 'tag', // 获取选择后的结果
    type: 'list',
    message: 'please choice a tag to create project',
    choices: tags,
  });
  console.log(repo, tag);
  // 把模版放到一个临时目录里 存好，以备以后时候

  // download-git-repo
  // 下载的目录
  const dest = await waitFnLoading(download, 'downloading ...')(repo, tag);
  console.log(dest);

  // 简单的直接拷贝
  // 判断这个项目名字是否存在，如果存在

  // 如果有ask.js
  if (!fs.existsSync(path.join(dest, 'ask.js'))) {
    await ncp(dest, path.resolve(projectName));
  } else {
    console.log('复杂模版');
    // 让用户填信息
    // 用用户的信息去渲染模版
    await new Promise((resolve, reject) => {
      Metalsmith(__dirname) // 如果传入路径 默认会遍历当前路径下的src文件夹
        .source(dest)
        .destination(path.resolve(projectName))
        .use(async (files, metal, done) => {
          const args = require(path.join(dest, 'ask.js'));
          const result = await Inquirer.prompt(args);
          const meta = metal.metadata();
          Object.assign(meta, result);
          // eslint-disable-next-line no-param-reassign
          delete files['ask.js'];
          done();
        })
        .use((files, metal, done) => {
          // 根据用户的输入 下载模版
          Reflect.ownKeys(files).forEach(async (file) => {
            // 这个是要处理的 <%
            const obj = metal.metadata();
            if (file.includes('js') || file.includes('json')) {
              let content = files[file].contents.toString();
              if (content.includes('<%')) {
                content = await render(content, obj);
                // eslint-disable-next-line no-param-reassign
                files[file].contents = Buffer.from(content);
              }
            }
          });
          done();
        })
        .build((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });
  }

  // 复杂的需要模版渲染，渲染后再拷贝
  // 把git上的项目下载，如果有ask 文件就是一个复杂的模版，我们需要用户选择，选择后编译
  // metalsmith 只要是编译都需要
  // consolidate 统一了所有模版引擎

  // Metalsmith;
};
