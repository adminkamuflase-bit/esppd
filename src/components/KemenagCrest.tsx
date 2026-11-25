import React from 'react';

interface KemenagCrestProps {
  variant?: 'color' | 'monochrome';
  className?: string;
}

/**
 * Clean geometric emblem inspired by Kementerian Agama RI institutional insignia
 * (Pentagon frame, book of knowledge, upright star, and padi-kapas motif).
 */
export const KemenagCrest: React.FC<KemenagCrestProps> = ({
  variant = 'color',
  className = 'w-10 h-10',
}) => {
  const isMono = variant === 'monochrome';
  const outerStroke = isMono ? '#000000' : '#065F46';
  const fillBg = isMono ? 'none' : '#065F46';
  const accent = isMono ? '#000000' : '#F59E0B';
  const innerStroke = isMono ? '#000000' : '#FFFFFF';

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Pentagon shield */}
      <path
        d="M32 4L58 22L48 56H16L6 22L32 4Z"
        fill={fillBg}
        stroke={outerStroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M32 9L53 24L45 52H19L11 24L32 9Z"
        stroke={innerStroke}
        strokeWidth="1.2"
        strokeLinejoin="round"
        opacity={isMono ? 1 : 0.45}
      />
      {/* Top five-pointed star */}
      <path
        d="M32 14L34.2 20.5H41L35.5 24.4L37.6 31L32 27L26.4 31L28.5 24.4L23 20.5H29.8L32 14Z"
        fill={isMono ? 'none' : accent}
        stroke={isMono ? '#000000' : accent}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Open book at base */}
      <path
        d="M19 37C24 35 28.5 36.2 32 38.5C35.5 36.2 40 35 45 37V47C40 45 35.5 46 32 48.2C28.5 46 24 45 19 47V37Z"
        fill={isMono ? 'none' : '#FFFFFF'}
        stroke={innerStroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <line
        x1="32"
        y1="38.5"
        x2="32"
        y2="48.2"
        stroke={isMono ? '#000000' : '#065F46'}
        strokeWidth="1.5"
      />
    </svg>
  );
};
