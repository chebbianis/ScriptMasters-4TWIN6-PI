declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }
  
  export const Loader: FC<IconProps>;
  export const Sparkles: FC<IconProps>;
  export const Plus: FC<IconProps>;
  export const Upload: FC<IconProps>;
  export const Link: FC<IconProps>;
  export const Trash2: FC<IconProps>;
  export const X: FC<IconProps>;
  export const BellOff: FC<IconProps>;
} 