// 解析用户的参数
const program = require('commander');
const path = require('path');

const { version } = require('./constants');

// npx eslint --init

const mapActions = {
  create: {
    alias: 'c',
    description: 'create a project',
    examples: [
      'mini-cli create <project-name>',
    ],
  },
  config: {
    alias: 'conf',
    description: 'config project variable',
    examples: [
      'mini-cli config set <k> <v>',
      'mini-cli config get <k>',
    ],
  },
  '*': {
    alias: '',
    description: 'command not found',
    examples: [],
  },
};

// Reflect可以遍历symbol
Reflect.ownKeys(mapActions).forEach((action) => {
  program
    .command(action) // 配置命令的名字
    .alias(mapActions[action].alias) // 命令的别名
    .description(mapActions[action].description)
    .action(() => {
      if (action === '*') {
        console.log(mapActions[action].description);
      } else {
        // mini-cli create xxx  [node, mini-cli, create, xxx]
        require(path.resolve(__dirname, action))(...process.argv.slice(3));
      }
    });
});

// 监听用户help
program.on('--help', () => {
  console.log('\nExamples:');
  Reflect.ownKeys(mapActions).forEach((action) => {
    mapActions[action].examples.forEach((example) => {
      console.log(`  ${example}`);
    });
  });
});

// 解析用户传递过来的参数
program.version(version).parse(process.argv);
