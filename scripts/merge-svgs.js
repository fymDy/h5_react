
const fs = require('fs');
const path = require('path');
const { parse, stringify } = require('svgson');

// 定义原始SVG文件的目录和目标Sprite文件路径
const svgDir = path.join(__dirname, '../rawAssets');
const outputFile = path.join(__dirname, '../src/compoments/icon/iconSprite.svg');
const outputFilePath = path.join(__dirname, '../src/compoments/icon/iconTypes.ts');
// 初始化sprite文件的内容
let spriteContent = `<svg xmlns="http://www.w3.org/2000/svg"><defs>`;
let ids = [];

// 读取目录下的所有文件
fs.readdir(svgDir, (err, files) => {
  if (err) {
    console.error('无法读取目录:', err);
    return;
  }

  // 创建一个Promise数组来处理所有文件的解析
  const parsePromises = files.map(file => {
    if (path.extname(file) === '.svg') {
      const filePath = path.join(svgDir, file);
      const svgContent = fs.readFileSync(filePath, 'utf8');

      return parse(svgContent).then(json => {
        const symbolId = path.basename(file, '.svg');
        json.name = 'symbol';
        json.attributes.id = symbolId;
        delete json.attributes.xmlns; // 删除不必要的命名空间属性
        delete json.attributes['xmlns:xlink']; // 删除xlink命名空间属性

        const symbolContent = stringify(json);
        spriteContent += symbolContent;
        ids.push(symbolId); // 将ID添加到数组中
      }).catch(err => {
        console.error('解析SVG文件出错:', err);
      });
    }
  });

  // 等待所有Promise完成后，关闭defs标签，写入sprite文件并生成类型定义
  Promise.all(parsePromises).then(() => {
    spriteContent += `</defs></svg>`;
    fs.writeFileSync(outputFile, spriteContent, 'utf8');
    console.log('SVG Sprite文件已生成:', outputFile);

    // 生成TypeScript类型定义
    const typeDef = `export type IconName = ${ids.map(id => `'${id}'`).join(' | ')};\n`;
    fs.writeFileSync(outputFilePath, typeDef, 'utf8');
    console.log('TypeScript类型定义已生成:', outputFilePath);
  }).catch(err => {
    console.error('处理SVG文件时出错:', err);
  });
});
