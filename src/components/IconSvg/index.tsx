import React from 'react';
import sprite from './svgSprite.svg'; // 引入生成的 SVG 雪碧图
import { IconName } from './iconTypes'; // 引入自动生成的图标类型定义

interface IconSvgProps extends React.SVGProps<SVGSVGElement> {
    name: IconName;  // 自定义的 name 属性，必须是生成的 IconName 类型
    size?:number
}

const IconSvg: React.FC<IconSvgProps> = ({
     name,
     size=24,
    ...props  // 接受并传递所有 SVG 元素的标准属性
    }) => {
        // const testIcon: IconName = 'icon-be';  // 这里应该提供智能提示
    return (
        <svg {...props} width={size} height={size} >
            <use xlinkHref={`${sprite}#${name}`} />
        </svg>
    );
};

export default IconSvg;
