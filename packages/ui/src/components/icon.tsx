import type { ImgHTMLAttributes } from 'react';

interface IconProps extends ImgHTMLAttributes<HTMLImageElement> {
    /** 아이콘 이름 (파일명에서 icon_ 제거) */
    name: string;
}

declare const require: {
    context: (path: string, useSubdirectories: boolean, regExp: RegExp) => {
        (id: string): string;
        keys(): string[];
    };
};

/** SVG 아이콘들을 동적으로 로드 */
const iconContext = require.context(
    '../assets/icon/',
    false,
    /icon_.*\.svg$/
);

/**
 * Icon 컴포넌트 — 아이콘 이름으로 SVG 자동 렌더링
 *
 * @example
 * <Icon name="ai-generator" />
 * <Icon name="ai-generator" className="w-6 h-6" />
 */
export function Icon({ name, alt, ...props }: IconProps) {
    try {
        const iconSrc = iconContext(`./icon_${name}.svg`)?.default;
        return (
            <img
                src={iconSrc?.src}
                alt={alt || name}
                {...props}
            />
        );
    } catch {
        console.warn(`Icon "${name}" not found`);
        return null;
    }
}
