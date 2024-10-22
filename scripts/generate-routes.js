const fs = require('fs');
const path = require('path');

// 定义 views 目录的路径和 router.tsx 文件的路径
const viewsDir = path.join(__dirname, '../src/views');
const outputRouterFile = path.join(__dirname, '../src/router/routers.tsx');

// 清空路由文件内容
function clearRouterFile(filePath) {
  fs.writeFileSync(filePath, '// 自动生成的路由文件，请勿手动编辑\n', 'utf8');
  console.log(`已清空路由文件: ${filePath}`);
}

// 递归遍历目录，查找所有 routerConfig.ts 文件
function findRouterConfigs(dir, parentPath = '') {
  const files = fs.readdirSync(dir);
  let routes = [];

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 检查当前目录下是否有 routerConfig.ts 文件
      const routerConfigPath = path.join(filePath, 'routerConfig.ts');
      if (fs.existsSync(routerConfigPath)) {
        const customPath = extractCustomPathFromConfig(routerConfigPath);

        // 如果有子目录，递归处理子目录并生成子路由
        const childRoutes = findRouterConfigs(filePath, `${parentPath}/${file}`);
        const componentImportPath = path.relative(path.join(__dirname, '../src/router'), routerConfigPath)
          .replace(/\\/g, '/')
          .replace('routerConfig.ts', 'index');

        const route = {
          path: customPath || `${parentPath}/${file}`,
          element: `React.lazy(() => import('${componentImportPath}'))`,
        };

        // 如果有子路由，添加 children
        if (childRoutes.length > 0) {
          route.children = childRoutes;
        }

        routes.push(route);
      } else {
        // 如果当前目录没有 routerConfig.ts 文件，继续递归查找子目录
        const childRoutes = findRouterConfigs(filePath, `${parentPath}/${file}`);
        if (childRoutes.length > 0) {
          routes.push({
            path: `${parentPath}/${file}`,
            children: childRoutes,
          });
        }
      }
    }
  });

  return routes;
}

// 读取 routerConfig.ts 文件内容并提取 customPath
function extractCustomPathFromConfig(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const customPathRegex = /customPath\s*:\s*['"`]([^'"`]+)['"`]/; // 匹配 customPath
  const match = fileContent.match(customPathRegex);
  return match ? match[1] : null; // 如果匹配到 customPath，返回其值
}

// 生成嵌套的路由配置内容
function generateNestedRouteConfig(routes) {
  let routeConfigContent = `import React, { LazyExoticComponent, ReactNode } from 'react';`;
// 定义自定义 RouteObject，允许 LazyExoticComponent 作为 element

  routeConfigContent += `
   interface MyRouteObject {
    path: string;
    element?: ReactNode | LazyExoticComponent<any>;  // 允许 LazyExoticComponent 或 ReactNode
    children?: MyRouteObject[];
  }
  const routes: MyRouteObject[] = [\n`;

  routes.forEach(route => {
    routeConfigContent += generateRouteString(route, 2);
  });

  routeConfigContent += `];\n\nexport default routes;\n`;

  return routeConfigContent;
}

// 生成路由字符串，递归处理嵌套路由
function generateRouteString(route, indentLevel) {
  let indent = ' '.repeat(indentLevel);
  let routeStr = `${indent}{\n`;

  routeStr += `${indent}  path: '${route.path}',\n`;

  if (route.element) {
    routeStr += `${indent}  element: ${route.element},\n`;
  }

  // 只有存在子路由时，才生成 children
  if (route.children && route.children.length > 0) {
    routeStr += `${indent}  children: [\n`;
    route.children.forEach(childRoute => {
      routeStr += generateRouteString(childRoute, indentLevel + 4);
    });
    routeStr += `${indent}  ],\n`;
  }

  routeStr += `${indent}},\n`;
  return routeStr;
}

// 主函数：生成嵌套路由
function generateRoutes() {
  // 先清空 router.tsx 文件的内容
  clearRouterFile(outputRouterFile);

  const routes = findRouterConfigs(viewsDir); // 获取所有 routerConfig.ts 文件路径及路由配置
  const routeConfigContent = generateNestedRouteConfig(routes); // 生成嵌套路由配置内容

  // 追加写入到 router.tsx 文件
  fs.appendFileSync(outputRouterFile, routeConfigContent, 'utf8');
  console.log(`路由文件已生成: ${outputRouterFile}`);
}

// 执行生成路由
generateRoutes();
