'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface MotionCard3DProps {
  children: React.ReactNode;
  className?: string;
  tiltMaxAngle?: number;
  glareEffect?: boolean;
  onClick?: () => void;
}

export function MotionCard3D({
  children,
  className = '',
  tiltMaxAngle = 10,
  glareEffect = true,
  onClick,
}: MotionCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Raw mouse coordinates relative to card center (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring physics
  const springConfig = { stiffness: 350, damping: 25 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Calculate 3D rotations based on normalized cursor position
  const rotateX = useTransform(springY, [-0.5, 0.5], [tiltMaxAngle, -tiltMaxAngle]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-tiltMaxAngle, tiltMaxAngle]);

  // Specular glare positioning
  const glareX = useTransform(springX, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(springY, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Normalize coordinates between -0.5 and 0.5
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <div
      style={{ perspective: '1000px' }}
      className="inline-block w-full transition-transform"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.985 }}
        className={`relative overflow-hidden card-3d ${className}`}
        onClick={onClick}
      >
        {/* Dynamic Specular Glare Layer */}
        {glareEffect && isHovered && (
          <motion.div
            className="pointer-events-none absolute -inset-full opacity-40 mix-blend-overlay transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 350px at ${glareX} ${glareY}, rgba(255,255,255,0.45), transparent 70%)`,
            }}
          />
        )}

        {/* Content Container with 3D Z-translation */}
        <div style={{ transform: 'translateZ(20px)' }} className="relative z-10 w-full h-full">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
