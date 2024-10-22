'use strict';
// 引入 Node.js 的 fs 模块，用于文件系统操作
const fs = require('fs');
// 引入 Node.js 的 path 模块，用于处理和转换文件路径
const path = require('path');
// 引入 webpack 核心模块
const webpack = require('webpack');
// 引入 resolve 模块，用于解析模块路径
const resolve = require('resolve');
// 引入 HtmlWebpackPlugin 插件，用于生成 HTML 文件并自动注入打包后的资源
const HtmlWebpackPlugin = require('html-webpack-plugin');
// 引入 CaseSensitivePathsPlugin 插件，强制模块路径区分大小写
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
// 引入 InlineChunkHtmlPlugin 插件，用于将特定的 chunk 直接内联到 HTML 中
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
// 引入 TerserPlugin，用于压缩 JavaScript 代码
const TerserPlugin = require('terser-webpack-plugin');
// 引入 MiniCssExtractPlugin 插件，用于将 CSS 抽取到单独的文件中
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// 引入 CssMinimizerPlugin 插件，用于压缩 CSS 
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
// 引入 WebpackManifestPlugin 插件，用于生成资源清单文件
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
// 引入 InterpolateHtmlPlugin 插件，用于处理 HTML 中的占位符变量
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
// 引入 WorkboxWebpackPlugin 插件，用于为 PWA 添加服务工作线程支持
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
// 引入 ModuleScopePlugin 插件，用于限制模块只能从 src 目录导入
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
// 引入 getCSSModuleLocalIdent 方法，用于生成 CSS 模块的本地标识符
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
// 引入 ESLintPlugin 插件，用于在编译时进行代码质量检查
const ESLintPlugin = require('eslint-webpack-plugin');
// 引入项目的路径配置
const paths = require('./paths');
// 引入项目的模块配置
const modules = require('./modules');
// 引入函数以获取客户端环境变量
const getClientEnvironment = require('./env');
// 引入 ModuleNotFoundPlugin 插件，用于更好地提示模块未找到的错误
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');
// 引入 ForkTsCheckerWebpackPlugin，用于在编译时进行 TypeScript 类型检查
const ForkTsCheckerWebpackPlugin =
  process.env.TSC_COMPILE_ON_ERROR === 'true'
    ? require('react-dev-utils/ForkTsCheckerWarningWebpackPlugin')
    : require('react-dev-utils/ForkTsCheckerWebpackPlugin');
    // 引入 ReactRefreshWebpackPlugin，用于在开发时实现 React 
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
// 引入 createEnvironmentHash 函数，用于创建环境变量的哈希值，以便持久缓存
const createEnvironmentHash = require('./webpack/persistentCache/createEnvironmentHash');
// 判断是否使用源映射，源映射对大型文件可能会造成内存问题
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';
// 引入 react-refresh 运行时的入口文件
const reactRefreshRuntimeEntry = require.resolve('react-refresh/runtime');
// 引入 react-refresh-webpack-plugin 运行时的入口文件
const reactRefreshWebpackPluginRuntimeEntry = require.resolve(
  '@pmmmwh/react-refresh-webpack-plugin'
);
// 引入 babel-preset-react-app 运行时的入口文件
const babelRuntimeEntry = require.resolve('babel-preset-react-app');
// 引入 Babel 运行时的辅助函数，用于支持类组件的 this 关键字
const babelRuntimeEntryHelpers = require.resolve(
  '@babel/runtime/helpers/esm/assertThisInitialized',
  { paths: [babelRuntimeEntry] }
);
// 引入 Babel 运行时的 regenerator，用于支持 async/await
const babelRuntimeRegenerator = require.resolve('@babel/runtime/regenerator', {
  paths: [babelRuntimeEntry],
});
// 有些应用程序不需要保存网络请求的好处，因此不需要内联块，使构建过程更加顺畅。
// 判断是否内联运行时 chunk，内联可以减少网络请求
const shouldInlineRuntimeChunk = process.env.INLINE_RUNTIME_CHUNK !== 'false';
// 是否将 ESLint 错误视为警告
const emitErrorsAsWarnings = process.env.ESLINT_NO_DEV_ERRORS === 'true';
// 是否禁用 ESLint 插件
const disableESLintPlugin = process.env.DISABLE_ESLINT_PLUGIN === 'true';
// 设置图像内联的大小限制，超过该大小的图像将作为文件引用
const imageInlineSizeLimit = parseInt(
  process.env.IMAGE_INLINE_SIZE_LIMIT || '10000'
);
// 检查项目是否设置了 TypeScript 配置
const useTypeScript = fs.existsSync(paths.appTsConfig);
// 检查项目是否有 Tailwind CSS 配置
const useTailwind = fs.existsSync(
  path.join(paths.appPath, 'tailwind.config.js')
);
// 获取未编译的服务工作线程文件路径（如果存在）
const swSrc = paths.swSrc;
// 样式文件的正则表达式
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;
// 检查是否支持 JSX 运行时，如果设置了禁用新 JSX 转换，则返回 false
const hasJsxRuntime = (() => {
  if (process.env.DISABLE_NEW_JSX_TRANSFORM === 'true') {
    return false;
  }
  try {
    require.resolve('react/jsx-runtime');
    return true;
  } catch (e) {
    return false;
  }
})();


// 这是生产和开发配置。它专注于开发人员体验、快速重建和最小捆绑。
module.exports = function (webpackEnv) {
  const isEnvDevelopment = webpackEnv === 'development';
  const isEnvProduction = webpackEnv === 'production';
// 用于在生产中启用分析的变量，传入别名对象。如果传递到构建命令中则使用标志
  const isEnvProductionProfile = isEnvProduction && process.argv.includes('--profile');
 // 我们将为我们的应用程序提供 `paths.publicUrlOrPath`， 在 JavaScript 中作为 `index.html` 和 `process.env.PUBLIC_URL` 中的 %PUBLIC_URL%省略尾部斜杠，因为 %PUBLIC_URL%/xyz 看起来比 %PUBLIC_URL%xyz 更好。
  //获取要注入到我们的应用程序中的环境变量。
  const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

  const shouldUseReactRefresh = env.raw.FAST_REFRESH;
 // 获取样式加载器的常用函数
  const getStyleLoaders = (cssOptions, preProcessor) => {
    const loaders = [
      isEnvDevelopment && require.resolve('style-loader'),
      isEnvProduction && {
        loader: MiniCssExtractPlugin.loader,
        // css位于`static/css`中，使用'../../'定位index.html文件夹
        // 在生产环境中 `paths.publicUrlOrPath` 可以是相对路径
        options: paths.publicUrlOrPath.startsWith('.')
          ? { publicPath: '../../' }
          : {},
      },
      {
        loader: require.resolve('css-loader'),
        options: cssOptions,
      },
      {
        // PostCSS 的选项，因为我们两次引用这些选项
        // 根据您指定的浏览器支持添加供应商前缀
        // 包.json
        loader: require.resolve('postcss-loader'),
        options: {
          postcssOptions: {
            // 外部 CSS 导入工作所必需的
            // https://github.com/facebook/create-react-app/issues/2677
            ident: 'postcss',
            config: false,
            plugins: !useTailwind
              ? [
                  'postcss-flexbugs-fixes',
                  [
                    'postcss-preset-env',
                    {
                      autoprefixer: {
                        flexbox: 'no-2009',
                      },
                      stage: 3,
                    },
                  ],
                  // 添加 PostCSS Normalize 作为具有默认选项的重置 css，
                  // 以便它遵循 package.json 中的 browserslist 配置
                  // 这又让用户可以根据自己的需要自定义目标行为。
                  'postcss-normalize',
                ]
              : [
                  'tailwindcss',
                  'postcss-flexbugs-fixes',
                  [
                    'postcss-preset-env',
                    {
                      autoprefixer: {
                        flexbox: 'no-2009',
                      },
                      stage: 3,
                    },
                  ],
                ],
          },
          sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
        },
      },
    ].filter(Boolean);
    if (preProcessor) {
      loaders.push(
        {
          loader: require.resolve('resolve-url-loader'),
          options: {
            sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
            root: paths.appSrc,
          },
        },
        {
          loader: require.resolve(preProcessor),
          options: {
            sourceMap: true,
          },
        }
      );
    }
    return loaders;
  };

  return {
     // 目标环境设置为 browserslist，以确保与指定的浏览器环境兼容
    target: ['browserslist'],
     // Webpack 的统计输出仅显示错误和警告，以减少无关紧要的信息
    stats: 'errors-warnings',
    // 设置构建模式，生产环境为 'production'，开发环境为 'development'
    mode: isEnvProduction ? 'production' : isEnvDevelopment && 'development',
    // 在生产环境中，如果出现错误，立即停止编译
    bail: isEnvProduction,
     // 配置 source map 生成方式，生产环境根据设置生成完整的 source-map，开发环境使用较快的 'cheap-module-source-map'
    devtool: isEnvProduction
      ? shouldUseSourceMap
        ? 'source-map'
        : false
      : isEnvDevelopment && 'cheap-module-source-map',
    // 入口文件路径，即应用程序的起始点
    // This means they will be the "root" imports that are included in JS bundle.
    entry: paths.appIndexJs,
    // 输出文件路径
    output: {
      // 输出目录，构建后的文件存放在此目录中
      path: paths.appBuild,
      // 开发环境中添加注释，以便调试时更容易定位代码
      pathinfo: isEnvDevelopment,
     // 输出的主文件名，生产环境带有内容哈希值以便于缓存控制，开发环境使用固定名称
      filename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].js'
        : isEnvDevelopment && 'static/js/bundle.js',
       // 代码分割时异步块的文件名，生产环境带有内容哈希值，开发环境使用固定名称
      chunkFilename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].chunk.js'
        : isEnvDevelopment && 'static/js/[name].chunk.js',
     // 静态资源的文件名模板，包含名称和哈希值
      assetModuleFilename: 'static/media/[name].[hash][ext]',
      // webpack 使用 `publicPath` 来确定应用程序的服务路径，需要以斜杠结尾，否则文件资源会获得错误路径。我们从主页推断出“公共路径”（例如 / 或 /my-project）。
      publicPath: paths.publicUrlOrPath,
       // 将源映射条目指向原始磁盘位置（在 Windows 上格式为 URL），指定 sourcemap 的文件路径模板，生产环境相对路径，开发环境使用绝对路径
      devtoolModuleFilenameTemplate: isEnvProduction
        ? info =>
            path
              .relative(paths.appSrc, info.absoluteResourcePath)
              .replace(/\\/g, '/')
        : isEnvDevelopment &&
          (info => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')),
    },
    //缓存设置
    cache: {
       // 使用文件系统缓存，提升构建速度
      type: 'filesystem',
       // 缓存版本号，使用环境变量的哈希值确保缓存的一致性
      version: createEnvironmentHash(env.raw),
       // 缓存目录路径
      cacheDirectory: paths.appWebpackCache,
       // 缓存的存储类型，使用 'pack' 格式以提升性能
      store: 'pack',
      //构建依赖
      buildDependencies: {
        // webpack 默认依赖
        defaultWebpack: ['webpack/lib/'],
        // 当前配置文件作为缓存的依赖
        config: [__filename],
        // TypeScript 配置文件作为缓存的依赖
        tsconfig: [paths.appTsConfig, paths.appJsConfig].filter(f =>
          fs.existsSync(f)
        ),
      },
    },
    // 基础设施日志级别设置为 'none'，以避免打印额外的信息
    infrastructureLogging: {
      level: 'none',
    },
    //代码压缩
    optimization: {
      // 生产环境开启代码压缩
      minimize: isEnvProduction,
      minimizer: [
       // 使用 TerserPlugin 进行 JavaScript 代码压缩，仅在生产模式下使用
        new TerserPlugin({
          terserOptions: {
            parse: {
              // 我们希望 terser 能够解析 ecma 8 代码。然而，我们不想要它
              // 应用任何可转换为有效 ecma 5 代码的缩小步骤
              // 进入无效的 ECMA 5 代码。这就是为什么“压缩”和“输出”
              // 部分仅应用 ecma 5 安全的转换
              // https://github.com/facebook/create-react-app/pull/4234
              // 解析 ECMAScript 8 代码，但不进行破坏 ECMAScript 5 代码的任何操作
              ecma: 8,
            },
             // 设置压缩选项，避免一些破坏代码的优化，确保安全性
            compress: {
              ecma: 5,
              warnings: false,
              // 由于 Uglify 的问题破坏了看似有效的代码而被禁用：
              // https://github.com/facebook/create-react-app/issues/2376
              // 等待进一步调查:
              // https://github.com/mishoo/UglifyJS2/issues/2011
              comparisons: false,
              // 由于 Terser 破坏有效代码的问题而被禁用：
              // https://github.com/facebook/create-react-app/issues/5250
              // 等待进一步调查:
              // https://github.com/terser-js/terser/issues/120
              inline: 2,
            },
            // 混淆变量名，支持 Safari 10
            mangle: {
              safari10: true,
            },
            // 保留类名和函数名以便于分析
            keep_classnames: isEnvProductionProfile,
            keep_fnames: isEnvProductionProfile,
            // 输出设置，确保编码为 ASCII，以解决某些字符无法正确压缩的问题
            output: {
              ecma: 5,
              comments: false,
              // 启用是因为表情符号和正则表达式未使用默认值正确缩小
              // https://github.com/facebook/create-react-app/issues/2488
              ascii_only: true,
            },
          },
        }),
         // 使用 CssMinimizerPlugin 压缩 CSS 代码，仅在生产模式下使用
        new CssMinimizerPlugin(),
      ],
    },
    resolve: {
 
      // https://github.com/facebook/create-react-app/issues/253
      // 设置模块解析目录，首先在 'node_modules' 和项目的 'appNodeModules' 中查找模块，如果有额外的模块路径配置（additionalModulePaths），也会被添加到模块解析中
      modules: ['node_modules', paths.appNodeModules].concat(
        modules.additionalModulePaths || []
      ),
      // 这些是 Node 生态系统支持的合理默认值。我们还包括 JSX 作为通用组件文件扩展名以支持，有些工具，尽管我们不建议使用它，请参阅：https://github.com/facebook/create-react-app/issues/290
      // 添加了“web”扩展前缀以获得更好的支持用于 React Native Web。
      extensions: paths.moduleFileExtensions
        .map(ext => `.${ext}`)
        .filter(ext => useTypeScript || !ext.includes('ts')),
      alias: {
        //支持 React Native Web，通过将 'react-native' 映射到 'react-native-web' 来支持在 Web 上使用 React Native 组件
        // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
        'react-native': 'react-native-web',
         // 允许在 ReactDevTools 中进行更好的性能分析
        ...(isEnvProductionProfile && {
          'react-dom$': 'react-dom/profiling',
          'scheduler/tracing': 'scheduler/tracing-profiling',
        }),
        // 包含用户自定义的 webpack 别名配置
        ...(modules.webpackAliases || {}),
        // 设置路径别名 '@'，指向项目的 'src' 目录，便于模块导入时简化路径
        '@': path.resolve(__dirname, '../src'),  
      },
      plugins: [
      // 使用 ModuleScopePlugin 限制模块只能从 src 目录（或 node_modules）中导入
      // 防止用户从 src 目录之外导入文件，以避免由于 Babel 只处理 src 内文件导致的混淆问题
      // 如果需要导入 src 之外的文件，请将它们链接到 node_modules 中，以便模块解析机制正常工作
        new ModuleScopePlugin(paths.appSrc, [
          paths.appPackageJson,
          reactRefreshRuntimeEntry,
          reactRefreshWebpackPluginRuntimeEntry,
          babelRuntimeEntry,
          babelRuntimeEntryHelpers,
          babelRuntimeRegenerator,
        ]),
      ],
    },
    //module.rules 配置通过使用各种 loader 和处理器，为项目中的不同类型文件提供了丰富的处理能力，包括源映射、图片、SVG、JavaScript、TypeScript、CSS、SASS 等文件的编译和打包。
    module: {
      //顶级属性：严格检查所有的模块导出，确保没有导入不存在的内容
      strictExportPresence: true,
      //这个数组包含一系列的规则，每个规则用于处理特定类型的文件
      rules: [
        // Handle node_modules packages that contain sourcemaps
        shouldUseSourceMap && {
          //表示这是一个预处理 loader，在所有普通 loader 之前执行
          enforce: 'pre',
          //排除对 @babel/runtime 文件夹的处理。
          exclude: /@babel(?:\/|\\{1,2})runtime/,
          // 匹配 .js, .mjs, .jsx, .ts, .tsx, .css 文件。
          test: /\.(js|mjs|jsx|ts|tsx|css)$/,
          // 匹配 .js, .mjs, .jsx, .ts, .tsx, .css 文件。
          loader: require.resolve('source-map-loader'),
        },
        {
          //oneOf 中的规则会逐个匹配，直到找到符合条件的规则。未匹配的会使用最后的默认 file 处理器。
          oneOf: [
            // TODO：一旦“image/avif”位于 mime-db 中，就合并此配置
            // https://github.com/jshttp/mime-db
            {
              //匹配 .avif 文件
              test: [/\.avif$/],
              //处理成 Webpack 资源模块
              type: 'asset',
              //指定文件类型
              mimetype: 'image/avif',
              //将小于指定大小的图片内嵌为 base64 格式。
              parser: {
                dataUrlCondition: {
                  maxSize: imageInlineSizeLimit,
                },
              },
            },
            // “url”加载器的工作方式类似于“file”加载器，只不过它嵌入了资源
            // 小于作为数据 URL 指定的字节限制，以避免请求。
            // 缺少 `test` 相当于匹配。
            {
              // 匹配不同格式的图片文件。
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              //处理成 Webpack 资源模块
              type: 'asset',
              //处理为资源模块，并将小于指定大小的图片内嵌为 base64。
              parser: {
                dataUrlCondition: {
                  maxSize: imageInlineSizeLimit,
                },
              },
            },
            {
              //匹配 .svg 文件
              test: /\.svg$/,
              use: [
                {
                  //将 SVG 转换为 React 组件
                  loader: require.resolve('@svgr/webpack'),
                  options: {
                    prettier: false,
                    svgo: false,
                    svgoConfig: {
                      plugins: [{ removeViewBox: false }],
                    },
                    titleProp: true,
                    ref: true,
                  },
                },
                {
                  //将文件复制到输出目录中，并生成哈希名称
                  loader: require.resolve('file-loader'),
                  options: {
                    name: 'static/media/[name].[hash].[ext]',
                  },
                },
              ],
              //指定该 loader 仅在特定文件类型中被引入时生效。
              issuer: {
                and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
              },
            },
            // 使用 Babel 处理应用程序 JS。预设包括 JSX、Flow、TypeScript 和一些 ESnext 功能。
            {
              //指定该 loader 仅在特定文件类型中被引入时生效。匹配所有 .js, .jsx, .ts, .tsx 文件
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              // 只处理 src 文件夹下的文件
              include: paths.appSrc,
              // 使用 babel-loader
              loader: require.resolve('babel-loader'),
              //配置 Babel 的选项
              options: {
                customize: require.resolve(
                  'babel-preset-react-app/webpack-overrides'// 使用 react-app 的预设
                ),
                //包含对 React、ES6+ 和 TypeScript 的支持
                presets: [
                  [ require.resolve('babel-preset-react-app'), {// 自动启用 JSX 运行时（React 17+）
                      runtime: hasJsxRuntime ? 'automatic' : 'classic',
                    },
                  ],
                  /**
                     * antMobile建议在项目中增加下面的 babel 配置，这样可以达到最大兼容性，为 iOS Safari >= 10 和 Chrome >= 49 
                     * 对于 TypeScript，我们兼容的版本是 >= 3.8
                     * 对于 React，我们兼容的版本是 ^16.8.0 ^17.0.0 ^18.0.0
                     * 由于 iOS 9 并不支持 CSS 变量，因此如果你需要支持 iOS 9，请参考 这篇文档 启用 CSS 变量自动降级，并且将 babel 配置中的 target ios 设置为 9。
                  */    
                  [
                    require.resolve('@babel/preset-env'), // 添加对 @babel/preset-env 的支持
                    {
                      "targets": {
                        browsers: ['> 0.25%, not dead'],
                        "chrome": "49",
                        "ios": "10"
                      }
                    }
                  ],
                  require.resolve('@babel/preset-typescript'),  // 添加 TypeScript 支持
                ],
               // 在开发环境中启用 React 热更新插件。
                plugins: [
                  isEnvDevelopment &&
                    shouldUseReactRefresh &&
                    require.resolve('react-refresh/babel'),
                      // 在这里添加你需要的 Babel 插件
                ].filter(Boolean),
                 //  启用 Babel 缓存，提高构建速度
                 //这是 webpack 的 `babel-loader` 的一个特性（不是 Babel 本身）。
                // 它启用在 ./node_modules/.cache/babel-loader/ 中缓存结果， 用于更快重建的目录。
                cacheDirectory: true,
                //有关为什么禁用缓存压缩的上下文，请参阅#6846
                cacheCompression: false,
                compact: isEnvProduction,
              },
            },
            // 使用 Babel 处理应用程序外部的任何 JS。与应用程序 JS 不同，我们只编译标准 ES 功能。
            {
              //匹配 .js, .mjs 文件
              test: /\.(js|mjs)$/,
              //排除 @babel/runtime
              exclude: /@babel(?:\/|\\{1,2})runtime/,
              //使用 babel-loader
              loader: require.resolve('babel-loader'),
              options: {
                babelrc: false,
                configFile: false,
                compact: false,
                presets: [
                  [
                    require.resolve('babel-preset-react-app/dependencies'),
                    { helpers: true },
                  ],
                ],
                cacheDirectory: true,
                // See #6846 for context on why cacheCompression is disabled
                cacheCompression: false,
                
                // 调试 node_modules 需要 Babel 源映射代码。  如果没有以下选项，VSCode 等调试器显示不正确的代码并在错误的行上设置断点。
                sourceMaps: shouldUseSourceMap,
                inputSourceMap: shouldUseSourceMap,
              },
            },
            // "postcss" loader applies autoprefixer to our CSS.
            // "css" loader resolves paths in CSS and adds assets as dependencies.
            // "style" loader turns CSS into JS modules that inject <style> tags.
            // In production, we use MiniCSSExtractPlugin to extract that CSS
            // to a file, but in development "style" loader enables hot editing
            // of CSS.
            // 普通 CSS 文件处理:
            {
              //匹配 .css 文件
              test: cssRegex,
              //排除 CSS 模块
              exclude: cssModuleRegex,
              //使用getStyleLoaders 方法来获取相关的 loader，例如 style-loader, css-loader, postcss-loader
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isEnvProduction
                  ? shouldUseSourceMap
                  : isEnvDevelopment,
                modules: {
                  mode: 'icss',
                },
              }),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
            },
            // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
            // CSS Modules 处理:
            {
              //匹配 CSS 模块（以 .module.css 结尾的文件）。
              test: cssModuleRegex,
              //use: 使用 CSS Modules 加载相关的样式，启用本地作用域。
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isEnvProduction
                  ? shouldUseSourceMap
                  : isEnvDevelopment,
                modules: {
                  mode: 'local',
                  getLocalIdent: getCSSModuleLocalIdent,
                },
              }),
            },
            // Opt-in support for SASS (using .scss or .sass extensions).
            // By default we support SASS Modules with the
            // extensions .module.scss or .module.sass
            //普通 SASS/SCSS 文件处理:
            {
              //: 匹配 .scss 或 .sass 文件。
              test: sassRegex,
              //使用 sass-loader 处理 SASS 文件
              exclude: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  sourceMap: isEnvProduction
                    ? shouldUseSourceMap
                    : isEnvDevelopment,
                  modules: {
                    mode: 'icss',
                  },
                },
                'sass-loader'
              ),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
            },
            // Adds support for CSS Modules, but using SASS
            // SASS Modules 处理:
            {
              //匹配 SASS 模块（以 .module.scss 或 .module.sass 结尾的文件）
              test: sassModuleRegex,
              //使用 SASS Modules 处理样式，启用本地作用域
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  sourceMap: isEnvProduction
                    ? shouldUseSourceMap
                    : isEnvDevelopment,
                  modules: {
                    mode: 'local',
                    getLocalIdent: getCSSModuleLocalIdent,
                  },
                },
                'sass-loader'
              ),
            },
            // "file" loader makes sure those assets get served by WebpackDevServer.
            // When you `import` an asset, you get its (virtual) filename.
            // In production, they would get copied to the `build` folder.
            // This loader doesn't use a "test" so it will catch all modules
            //其他文件处理
            {
              // Exclude `js` files to keep "css" loader working as it injects
              // its runtime that would otherwise be processed through "file" loader.
              // Also exclude `html` and `json` extensions so they get processed
              //排除 .js, .mjs, .jsx, .ts, .tsx, .html, .json 文件
              exclude: [/^$/, /\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              //将其他类型的文件处理为资源模块，将它们复制到输出目录
              type: 'asset/resource',
            },
            // ** STOP ** Are you adding a new loader?
            // Make sure to add the new loader(s) before the "file" loader.
          ],
        },
      ].filter(Boolean),
   
    },
    //plugins 部分包含了各种插件，这些插件的作用是帮助处理不同环境下的构建任务，并优化最终输出的代码。
    //通过这些插件，webpack 能够根据开发和生产环境的不同需求，提供各种必要的功能。这些功能涵盖了从生成 HTML、优化资源、类型检查到代码质量检测等各个方面，从而确保应用程序的质量和性能。
    plugins: [
      // 生成一个 index.html 文件，并自动将构建后的 <script> 标签注入到 HTML 文件中
      new HtmlWebpackPlugin(
        Object.assign(
          {},
          {
            inject: true,
            template: paths.appHtml,
          },
          //生产环境中的特性：如果是生产环境 (isEnvProduction)，它会对生成的 HTML 进行压缩，比如删除注释、折叠空白、移除冗余属性等，以减少文件大小
          isEnvProduction
            ? {
                minify: {
                  removeComments: true,
                  collapseWhitespace: true,
                  removeRedundantAttributes: true,
                  useShortDoctype: true,
                  removeEmptyAttributes: true,
                  removeStyleLinkTypeAttributes: true,
                  keepClosingSlash: true,
                  minifyJS: true,
                  minifyCSS: true,
                  minifyURLs: true,
                },
              }
            : undefined
        )
      ),
      // https://github.com/facebook/create-react-app/issues/5358
      //作用：InlineChunkHtmlPlugin：将 webpack 的 runtime 脚本直接内联到 HTML 中
      // 目的：runtime 脚本通常很小，将其内联可以避免额外的网络请求，从而提高页面加载速度。仅在生产环境下使用。
      isEnvProduction &&
        shouldInlineRuntimeChunk &&
        new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
      //InterpolateHtmlPlugin作用：使环境变量（如 %PUBLIC_URL%）可以在 index.html 中使用。
      // 示例：你可以在 index.html 中引用 %PUBLIC_URL% 来动态设置公共路径，例如 <link rel="icon" href="%PUBLIC_URL%/favicon.ico">。   
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
      // ModuleNotFoundPlugin：作用：当模块找不到时，提供一些额外的上下文信息，帮助开发者快速定位问题来源。
      new ModuleNotFoundPlugin(paths.appPath),
      // webpack.DefinePlugin：作用：定义一些全局变量，比如 process.env.NODE_ENV，这样 React 可以根据环境变量来决定运行在开发模式还是生产模式下。
      //重要性：在生产环境中，NODE_ENV 被设置为 production，这样 React 会自动应用一些性能优化。
      new webpack.DefinePlugin(env.stringified),
      // ReactRefreshWebpackPlugin作用：在开发环境中启用 React 的热重载功能（Hot Module Replacement），使组件在更改代码后可以立即更新，而不需要刷新页面。
      //目的：提高开发体验，保持应用状态不变的同时快速查看更改效果
      // https://github.com/facebook/react/tree/main/packages/react-refresh
      isEnvDevelopment &&
        shouldUseReactRefresh &&
        new ReactRefreshWebpackPlugin({
          overlay: false,
        }),
      // CaseSensitivePathsPlugin作用：在开发环境中检测路径的大小写错误
      //背景：在一些操作系统（例如 macOS）上，文件路径不区分大小写，但在其他系统（如 Linux）上是区分的。这个插件可以避免因为路径大小写不一致而导致的构建问题。
      // See https://github.com/facebook/create-react-app/issues/240
      isEnvDevelopment && new CaseSensitivePathsPlugin(),
      //MiniCssExtractPlugin作用：将 CSS 提取到单独的文件中。
      //生产环境中的特性：在生产环境中使用该插件，可以为每个 CSS 文件生成唯一的文件名（带有内容哈希），从而实现更好的缓存策略。
      isEnvProduction &&
        new MiniCssExtractPlugin({
          // 与 webpackOptions.output 中相同选项类似的选项, 两个选项都是可选的
          filename: 'static/css/[name].[contenthash:8].css',
          chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
        }),
      // 生成资产清单文件，内容如下
      // “files”键：将所有资源文件名映射到其对应的输出文件，以便工具无需解析即可获取它`index.html`
      // - “entrypoints”键：包含在 `index.html` 中的文件数组. 如有必要，可用于重建 HTML
      //WebpackManifestPlugin作用：生成资产清单文件 asset-manifest.json，其中包含所有构建输出文件的映射
      //用途：其他工具（例如服务器端渲染）可以使用这个清单文件来查找构建后的资源。
      new WebpackManifestPlugin({
        fileName: 'asset-manifest.json',
        publicPath: paths.publicUrlOrPath,
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce((manifest, file) => {
            manifest[file.name] = file.path;
            return manifest;
          }, seed);
          const entrypointFiles = entrypoints.main.filter(
            fileName => !fileName.endsWith('.map')
          );

          return {
            files: manifestFiles,
            entrypoints: entrypointFiles,
          };
        },
      }),
      // Moment.js 是一个非常流行的库，它捆绑了大型语言环境文件,默认情况下，由于 webpack 解释其代码的方式。这是一个实用的要求用户选择导入特定区域设置的解决方案
       // 如果您不使用 Moment.js，则可以删除它
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      //webpack.IgnorePlugin：作用：忽略某些特定的模块
      //示例：忽略 Moment.js 中的多语言文件，因为这些文件体积较大且不一定都需要，从而减少最终的打包大小。
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      }),
      // 生成一个服务工作线程脚本，该脚本将预缓存并保持最新,作为 webpack 构建一部分的 HTML 和资源
      //WorkboxWebpackPlugin.InjectManifest作用：在生产环境下生成一个 service worker，用于缓存 HTML 和其他静态资源，以支持离线访问。
      //特性：使用 InjectManifest 方法，允许开发者完全控制 service worker 的实现方式。
      isEnvProduction &&
        fs.existsSync(swSrc) &&
        new WorkboxWebpackPlugin.InjectManifest({
          swSrc,
          dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./,
          exclude: [/\.map$/, /asset-manifest\.json$/, /LICENSE/],
          // 增大预缓存的默认最大大小 (2mb)，
          // 减少延迟加载失败的可能性。
          // See https://github.com/cra-template/pwa/issues/13#issuecomment-722667270
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        }),
      // ForkTsCheckerWebpackPlugin：作用：在构建过程中进行 TypeScript 类型检查。
      //特性：可以在开发环境下以异步方式运行，确保开发体验流畅，同时保证代码类型的正确性。
      useTypeScript &&
        new ForkTsCheckerWebpackPlugin({
          async: isEnvDevelopment,
          typescript: {
            typescriptPath: resolve.sync('typescript', {
              basedir: paths.appNodeModules,
            }),
            configOverwrite: {
              compilerOptions: {
                sourceMap: isEnvProduction
                  ? shouldUseSourceMap
                  : isEnvDevelopment,
                skipLibCheck: true,
                inlineSourceMap: false,
                declarationMap: false,
                noEmit: true,
                incremental: true,
                tsBuildInfoFile: paths.appTsBuildInfoFile,
              },
            },
            context: paths.appPath,
            diagnosticOptions: {
              syntactic: true,
            },
            mode: 'write-references',
            // profile: true,
          },
          issue: {
            // This one is specifically to match during CI tests,
            // as micromatch doesn't match
            // '../cra-template-typescript/template/src/App.tsx'
            // otherwise.
            include: [
              { file: '../**/src/**/*.{ts,tsx}' },
              { file: '**/src/**/*.{ts,tsx}' },
            ],
            exclude: [
              { file: '**/src/**/__tests__/**' },
              { file: '**/src/**/?(*.){spec|test}.*' },
              { file: '**/src/setupProxy.*' },
              { file: '**/src/setupTests.*' },
            ],
          },
          logger: {
            infrastructure: 'silent',
          },
        }),
        //ESLintPlugin作用：在构建过程中检查代码质量，确保符合 ESLint 规则。
        //配置：可以指定检查的文件类型和路径，还可以配置缓存位置，以提高检查效率
      !disableESLintPlugin &&
        new ESLintPlugin({
          // Plugin options
          extensions: ['js', 'mjs', 'jsx', 'ts', 'tsx'],
          formatter: require.resolve('react-dev-utils/eslintFormatter'),
          eslintPath: require.resolve('eslint'),
          failOnError: !(isEnvDevelopment && emitErrorsAsWarnings),
          context: paths.appSrc,
          cache: true,
          cacheLocation: path.resolve(
            paths.appNodeModules,
            '.cache/.eslintcache'
          ),
          // ESLint class options
          cwd: paths.appPath,
          resolvePluginsRelativeTo: __dirname,
          baseConfig: {
            extends: [require.resolve('eslint-config-react-app/base')],
            rules: {
              ...(!hasJsxRuntime && {
                'react/react-in-jsx-scope': 'error',
              }),
            },
          },
        }),
    ].filter(Boolean),
    // 关闭性能处理
    performance: false,
  };
};
