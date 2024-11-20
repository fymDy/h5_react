/*
 * @Author: Mark
 * @Date: 2024-10-22 14:23:22
 * @LastEditTime: 2024-10-22 14:23:23
 * @LastEditors: MarkMark
 * @Description: 佛祖保佑无bug
 * @FilePath: /h5_react_practise/router/routers.tsx
 */
import React, { LazyExoticComponent, ReactNode } from 'react';
   interface MyRouteObject {
    path: string;
    element?: ReactNode | LazyExoticComponent<any>;  // 允许 LazyExoticComponent 或 ReactNode
    children?: MyRouteObject[];
  }
  const routes: MyRouteObject[] = [

  ]
  export default routes