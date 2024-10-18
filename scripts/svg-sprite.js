const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const SVGSpriter = require('svg-sprite');

// 设置路径
const rawAssetsDir = path.join(__dirname, '..', 'rawAssets'); // rawAssets 目录
const outputDir = path.join(__dirname, '..', 'src', 'components', 'IconSvg'); // 输出目录
const outputSpritePath = path.join(outputDir, 'svgSprite.svg'); // 雪碧图输出路径
const outputTypeDefPath = path.join(outputDir, 'iconTypes.ts'); // TypeScript 类型定义输出路径

// 如果输出目录不存在，创建它
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 生成 SVG 雪碧图的函数
function generateSprite() {
    console.log('开始生成新的雪碧图...');

    // 创建 SVG Spriter 实例
    const spriter = new SVGSpriter({
        mode: {
            symbol: {
                sprite: "svgSprite.svg", // 生成的雪碧图文件名
            }
        }
    });

    const iconIds = []; // 用于收集所有图标 ID

    // 读取 SVG 文件
    fs.readdir(rawAssetsDir, (err, files) => {
        if (err) {
            console.error('读取目录失败:', err);
            return;
        }

        // 过滤并处理所有 SVG 文件
        files.filter(file => path.extname(file) === '.svg').forEach(file => {
            const filePath = path.join(rawAssetsDir, file);
            const fileContent = fs.readFileSync(filePath, 'utf-8');

            const iconId = path.basename(file, '.svg'); // 获取图标 ID（去掉 .svg 后缀）
            iconIds.push(iconId); // 添加到图标 ID 列表中

            // 将 SVG 文件添加到 Spriter 中
            spriter.add(filePath, null, fileContent);
        });

        // 编译生成雪碧图
        spriter.compile((error, result) => {
            if (error) {
                console.error('生成雪碧图失败:', error);
            } else {
                // 保存生成的雪碧图
                fs.writeFileSync(outputSpritePath, result.symbol.sprite.contents);
                console.log('SVG 雪碧图已生成:', outputSpritePath);

                // 生成 TypeScript 类型定义
                const typeDefContent = `export type IconName = ${iconIds.map(id => `'${id}'`).join(' | ')};\n`;
                fs.writeFileSync(outputTypeDefPath, typeDefContent, 'utf8');
                console.log('TypeScript 类型定义已生成:', outputTypeDefPath);
            }
        });
    });
}

// 批量处理变动文件
let changeQueue = new Set();
let debounceTimeout;
const DEBOUNCE_DELAY = 1000;

// 使用 chokidar 监听 rawAssets 目录的变化
const watcher = chokidar.watch(rawAssetsDir, {
    ignored: /(^|[\/\\])\../, // 忽略隐藏文件
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
    }
});

// 监听文件的添加、修改和删除事件
watcher
    .on('add', (filePath) => {
        console.log(`文件已添加: ${filePath}`);
        queueChange(filePath);
    })
    .on('change', (filePath) => {
        console.log(`文件已修改: ${filePath}`);
        queueChange(filePath);
    })
    .on('unlink', (filePath) => {
        console.log(`文件已删除: ${filePath}`);
        queueChange(filePath);
    });

console.log(`正在监听 ${rawAssetsDir} 目录中的文件变化...`);

// 将变动的文件添加到队列并延迟生成雪碧图
function queueChange(filePath) {
    changeQueue.add(filePath);  // 将文件路径加入变动队列
    clearTimeout(debounceTimeout);  // 清除上一次的定时器

    // 延迟处理队列中的变动
    debounceTimeout = setTimeout(() => {
        console.log('处理变动文件:', Array.from(changeQueue));
        generateSprite();  // 生成雪碧图
        changeQueue.clear();  // 清空队列
    }, DEBOUNCE_DELAY);
}
