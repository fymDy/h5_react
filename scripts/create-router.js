const inquirer = require("inquirer").default;
const fs = require("fs");
const path = require("path");
const { exec } = require('child_process'); // 用于执行命令
// 定义问题
const questions = [
  {
    type: "input",
    name: "directory",
    message:
      "请输入要创建的目录路径（相对于 'src/views'），如：'main' 或 'main/mine':",
    validate: function (value) {
      return value.length ? true : "请输入有效的目录路径";
    },
  },
];

// 执行问题询问
inquirer.prompt(questions).then((answers) => {
  const directory = answers.directory;
  const pathParts = directory.split("/");
  const componentName = pathParts[pathParts.length - 1]; // 组件名为路径的最后一部分

  // 目标目录为 src/views/自定义目录
  const targetDir = path.join(__dirname, "../src/views", directory);

  // 如果目录存在，直接取消操作
  if (fs.existsSync(targetDir)) {
    console.log(`目录 ${targetDir} 已存在，取消创建。`);
    return;
  }

  // 将路径转换为驼峰命名，用作 routerConfig 中的 path
  const fullPath = pathParts.join("/"); // 完整的路径
  const currentFileName = pathParts[pathParts.length - 1]; // 当前文件名

  // 文件模板
  const componentTemplate = `
import React from 'react';
import styles from './index.module.scss';

const ${
    componentName.charAt(0).toUpperCase() + componentName.slice(1)
  }: React.FC = () => {
  return (
    <div className={styles.${componentName}}>
      <h1>${componentName} 页面</h1>
    </div>
  );
};

export default ${
    componentName.charAt(0).toUpperCase() + componentName.slice(1)
  };
`;

  const scssTemplate = `
.${componentName} {
  // ${componentName} 页面样式
}
`;

  const routerConfigTemplate = `
import { IFRouterConfig } from '@/router/interface'
const routerConfig:IFRouterConfig[] = [
  {
    name: '${currentFileName}', // 使用当前文件名作为路由路径
    customPath: '/${fullPath}', // 使用完整路径作为自定义路径
    author: false, // 默认不需要登录验证
  }
];
export default routerConfig;
`;

  // 创建文件夹和文件的函数
  function createFiles(dir, componentName) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`创建文件夹: ${dir}`);

    // 创建文件
    fs.writeFileSync(path.join(dir, "index.tsx"), componentTemplate, "utf8");
    console.log(`创建文件: ${path.join(dir, "index.tsx")}`);

    fs.writeFileSync(path.join(dir, "index.module.scss"), scssTemplate, "utf8");
    console.log(`创建文件: ${path.join(dir, "index.module.scss")}`);

    fs.writeFileSync(
      path.join(dir, "routerConfig.ts"),
      routerConfigTemplate,
      "utf8"
    );
    console.log(`创建文件: ${path.join(dir, "routerConfig.ts")}`);
  }

  // 递归处理每个层级，创建目录和文件
  function processDirectoryStructure(baseDir, parts) {
    let currentDir = baseDir;

    parts.forEach((part, index) => {
      currentDir = path.join(currentDir, part);
      // 如果目录不存在，创建目录并创建文件
      if (!fs.existsSync(currentDir)) {
        createFiles(currentDir, parts[index]);
      }
    });
  }

  // 开始递归处理目录结构
  processDirectoryStructure(path.join(__dirname, "../src/views"), pathParts);
   
});
