
const fs = require('fs');
const path = require('path');
const express = require('express');
const open = require('open');

const app = express();
const PORT = 5050;
const svgDir = path.join(__dirname, '../rawAssets');

// 获取所有 SVG 文件
const getSvgFiles = (dir) => {
  return fs.readdirSync(dir).filter(file => file.endsWith('.svg'));
};

// 读取 SVG 文件内容
const readSvgContent = (filePath) => {
  return fs.readFileSync(filePath, 'utf8');
};

app.get('/', (req, res) => {
  const svgFiles = getSvgFiles(svgDir);
  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SVG Gallery</title>
      <style>
        body {
          font-family: Arial, sans-serif;
        }
        .gallery {
          display: flex;
          flex-wrap: wrap;
        }
        .gallery div {
          margin: 10px;
          text-align: center;
        }
        svg {
          width: 100px;
          height: 100px;
        }
      </style>
    </head>
    <body>
      <h1>SVG Gallery</h1>
      <div class="gallery">
  `;

  svgFiles.forEach(file => {
    const filePath = path.join(svgDir, file);
    const svgContent = readSvgContent(filePath);
    html += `
      <div>
        ${svgContent}
        <p>${file}</p>
      </div>
    `;
  });

  html += `
      </div>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// 启动服务器并自动打开浏览器
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  open(`http://localhost:${PORT}`);
});
