import { forwardRef } from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';

export const MosqueIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ color = 'currentColor', size = 24, strokeWidth = 2, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 21h20" />
      <path d="M3.5 21V10.5" />
      <path d="m2.5 10.5 1-3 1 3" />
      <path d="M20.5 21V10.5" />
      <path d="m19.5 10.5 1-3 1 3" />
      <path d="M6.5 21v-6c0-3 2.2-5.3 5.5-6.6 3.3 1.3 5.5 3.6 5.5 6.6v6" />
      <path d="M9.5 21v-3a2.5 2.5 0 0 1 5 0v3" />
      <path d="M12 8.4V6" />
      <path d="M13.6 2.2a2.1 2.1 0 1 0 .6 3.8 2.35 2.35 0 1 1-.6-3.8Z" />
    </svg>
  )
) as LucideIcon;

MosqueIcon.displayName = 'MosqueIcon';
