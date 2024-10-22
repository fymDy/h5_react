const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer').default;

// 提示用户输入要删除的目录名
inquirer.prompt([
  {
    type: 'input',
    name: 'directory',
    message: "请输入要删除的views内目录名，如：'account'",
    validate: function (input) {
      if (input.length) {
        return true;
      } else {
        return '请输入有效的目录名';
      }
    }
  }
]).then((answers) => {
  const dirPath = path.join(__dirname, '../src/views', answers.directory);

  // 检查目录是否存在
  if (fs.existsSync(dirPath)) {
    // 删除目录及其内容
    fs.rm(dirPath, { recursive: true, force: true }, (err) => {
      if (err) {
        console.error(`删除目录时出错: ${err.message}`);
      } else {
        console.log(`目录及目录内所有文件已成功删除: ${dirPath}`);
      }
    });
  } else {
    console.log(`目录不存在: ${dirPath}`);
  }
});
