// scripts/svgServer.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();

// 设置 rawAssets 目录路径
const rawAssetsDir = path.join(__dirname, '..', 'rawAssets'); // 上一级目录

// 定义路由
app.get('/', (req, res) => {
    fs.readdir(rawAssetsDir, (err, files) => {
        if (err) {
            return res.status(500).send('读取目录失败: ' + err.message);
        }

        // 过滤出 SVG 文件
        const svgContent = files
            .filter(file => path.extname(file) === '.svg')
            .map(file => {
                const filePath = path.join(rawAssetsDir, file);
                const data = fs.readFileSync(filePath, 'utf8'); // 直接同步读取文件
                return `<div class="svg-container">
                            <div class="svg-content">${data}</div>
                            <h3>${file}</h3>
                        </div>`;
            })
            .join('');

        const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SVG Viewer</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                }
                .wrap {
                    display: flex;
                    flex-wrap: wrap; /* 允许换行 */
                    justify-content: flex-start; /* 从左到右排列 */
                    align-items: flex-start; /* 从上到下排列 */
                }
                .svg-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin: 20px; /* 每个 SVG 的间距 */
                }
                .svg-content {
                    width: 100px; /* 设置宽度 */
                    height: 100px; /* 设置高度 */
                }
                svg {
                    width: 100%; /* 适应容器宽度 */
                    height: 100%; /* 适应容器高度 */
                }
            </style>
        </head>
        <body>
            <h1>SVG Viewer</h1>
            <section class='wrap'> 
                ${svgContent}
            </section>
        </body>
        </html>
        `;

        res.send(htmlContent);
    });
});

// 启动服务器
const PORT = 3030;
app.listen(PORT, () => {
    console.log(`服务器正在运行，访问 http://localhost:${PORT} 查看 SVG 文件`);

    // 根据操作系统选择打开方式
    const platform = process.platform;
    const url = `http://localhost:${PORT}`;
    
    if (platform === 'win32') {
        exec(`start ${url}`); // Windows
    } else if (platform === 'darwin') {
        exec(`open ${url}`); // macOS
    } else {
        exec(`xdg-open ${url}`); // Linux
    }
});
