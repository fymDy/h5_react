/*
 * @Author: Mark
 * @Date: 2024-10-22 14:22:31
 * @LastEditTime: 2024-10-22 14:22:32
 * @LastEditors: MarkMark
 * @Description: 佛祖保佑无bug
 * @FilePath: /h5_react_practise/router/interface.ts
 */
/*
 * @Author: Mark
 * @Date: 2024-10-19 16:23:56
 * @LastEditTime: 2024-10-19 16:23:57
 * @LastEditors: MarkMark
 * @Description: 佛祖保佑无bug
 * @FilePath: /gold-h5/src/router/interface.ts
 */
export interface IFRouterConfig {
    /**
     * @zh 跟文件夹路径保持同名
     */
    name: string

    /**
     * @zh 当前路由是否需要登录鉴权
     */
    author?: boolean

    /**
     * @zh 路由路径，建议无需配置，根据文件路径自动生成，当有动态路由需求时，可配置
     * xx/xxx/xx:xx?
     */
    path?: string
    /**
     * @zh 填写了自定义路径，则自定义路径展示路由
     */
    customPath?: string
    /**
     * @zh 当有多级子路由时 该字段有用 可指定默认展示子路由
     * -views
     *   -home
     *      -testPage1
     *      -testPage2
     * 如果defaultRoute = 'testPage2'
     * 那么默认展示的路由则是home下的testPage2
     */
    defaultRoute?: string

    /**
     * @zh 指定该路由是否是根路由 
     * -views
     *   -home
     *     -testPage1
     *     -testPage2
     * 如果testPage1 ，testPage2
     * 不设置isRootRouter = true，那么testPage1 与 ，testPage2是home的子路由
     * 如果设置isRootRouter = true，那么testPage1 与 ，testPage2与home一样是一级路由
     */
    isRootRouter?: boolean

    /**
     * @zh 当前路由是否需要懒加载，一般来说不需要设置，只有首屏内容需要设置该字段，用于首屏内容更快加载展示
     */
    lazyLoad?: boolean

    /**
     * @zh 注意该字段只有当 lazyLoad = true时才生效 ，通常来说无需配置
     */
    component?: any

    /**
     * 指定父路由
     */
    parentRouterName?: string
}


