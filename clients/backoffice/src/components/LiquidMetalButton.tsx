import { liquidMetalFragmentShader, ShaderMount } from '@paper-design/shaders';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

/**
 * Metallic shader CTA from the design package (@paper-design liquid metal),
 * adapted for this app: `type="submit"` support for forms, variable width,
 * and a disabled state. Reserved for key CTAs — each mount is a WebGL canvas.
 */
export function LiquidMetalButton({
  label = 'Get Started',
  onClick,
  type = 'button',
  width = 142,
  disabled = false,
}: {
  label?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  width?: number;
  disabled?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const shaderRef = useRef<HTMLDivElement>(null);
  const shaderMount = useRef<any>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleId = useRef(0);

  const height = 46;
  const dims = { width, height, innerWidth: width - 4, innerHeight: height - 4 };

  useEffect(() => {
    const styleId = 'shader-canvas-style-exploded';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .shader-container-exploded canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          border-radius: 100px !important;
        }
        @keyframes ripple-animation {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    try {
      if (shaderRef.current) {
        if (shaderMount.current?.destroy) shaderMount.current.destroy();
        shaderMount.current = new ShaderMount(
          shaderRef.current,
          liquidMetalFragmentShader,
          {
            u_repetition: 4,
            u_softness: 0.5,
            u_shiftRed: 0.3,
            u_shiftBlue: 0.3,
            u_distortion: 0,
            u_contour: 0,
            u_angle: 45,
            u_scale: 8,
            u_shape: 1,
            u_offsetX: 0.1,
            u_offsetY: -0.1,
          },
          undefined,
          0.6,
        );
      }
    } catch (error) {
      console.error('Failed to load metal shader:', error); // button still clickable on plain black
    }

    return () => {
      if (shaderMount.current?.destroy) {
        shaderMount.current.destroy();
        shaderMount.current = null;
      }
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (shaderMount.current?.setSpeed) {
      shaderMount.current.setSpeed(2.4);
      setTimeout(() => shaderMount.current?.setSpeed?.(isHovered ? 1 : 0.6), 300);
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const ripple = { x: e.clientX - rect.left, y: e.clientY - rect.top, id: rippleId.current++ };
      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== ripple.id)), 600);
    }
    onClick?.();
  };

  const spring = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease';

  return (
    <div className="relative inline-block" style={{ opacity: disabled ? 0.5 : 1 }}>
      <div style={{ perspective: '1000px', perspectiveOrigin: '50% 50%' }}>
        <div style={{ position: 'relative', width: dims.width, height: dims.height, transformStyle: 'preserve-3d', transition: spring }}>
          {/* label layer */}
          <div
            style={{
              position: 'absolute', top: 0, left: 0, width: dims.width, height: dims.height,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transformStyle: 'preserve-3d', transition: spring, transform: 'translateZ(20px)', zIndex: 30, pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: 14, color: '#666666', fontWeight: 400, textShadow: '0px 1px 2px rgba(0, 0, 0, 0.5)', whiteSpace: 'nowrap' }}>
              {label}
            </span>
          </div>

          {/* dark core */}
          <div
            style={{
              position: 'absolute', top: 0, left: 0, width: dims.width, height: dims.height,
              transformStyle: 'preserve-3d', transition: spring,
              transform: `translateZ(10px) ${isPressed ? 'translateY(1px) scale(0.98)' : 'translateY(0) scale(1)'}`, zIndex: 20,
            }}
          >
            <div
              style={{
                width: dims.innerWidth, height: dims.innerHeight, margin: 2, borderRadius: 100,
                background: 'linear-gradient(180deg, #202020 0%, #000000 100%)',
                boxShadow: isPressed ? 'inset 0px 2px 4px rgba(0,0,0,0.4), inset 0px 1px 2px rgba(0,0,0,0.3)' : 'none',
                transition: `${spring}, box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)`,
              }}
            />
          </div>

          {/* metal rim (shader) */}
          <div
            style={{
              position: 'absolute', top: 0, left: 0, width: dims.width, height: dims.height,
              transformStyle: 'preserve-3d', transition: spring,
              transform: `translateZ(0px) ${isPressed ? 'translateY(1px) scale(0.98)' : 'translateY(0) scale(1)'}`, zIndex: 10,
            }}
          >
            <div
              style={{
                height: dims.height, width: dims.width, borderRadius: 100, background: 'rgb(0 0 0 / 0)',
                boxShadow: isPressed
                  ? '0px 0px 0px 1px rgba(0,0,0,0.5), 0px 1px 2px 0px rgba(0,0,0,0.3)'
                  : isHovered
                    ? '0px 0px 0px 1px rgba(0,0,0,0.4), 0px 12px 6px 0px rgba(0,0,0,0.05), 0px 8px 5px 0px rgba(0,0,0,0.1), 0px 4px 4px 0px rgba(0,0,0,0.15), 0px 1px 2px 0px rgba(0,0,0,0.2)'
                    : '0px 0px 0px 1px rgba(0,0,0,0.3), 0px 36px 14px 0px rgba(0,0,0,0.02), 0px 20px 12px 0px rgba(0,0,0,0.08), 0px 9px 9px 0px rgba(0,0,0,0.12), 0px 2px 5px 0px rgba(0,0,0,0.15)',
                transition: `${spring}, box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)`,
              }}
            >
              <div
                ref={shaderRef}
                className="shader-container-exploded"
                style={{ borderRadius: 100, overflow: 'hidden', position: 'relative', width: dims.width, maxWidth: dims.width, height: dims.height, transition: 'width 0.4s ease, height 0.4s ease' }}
              />
            </div>
          </div>

          {/* hit target */}
          <button
            ref={buttonRef}
            type={type}
            disabled={disabled}
            onClick={handleClick}
            onMouseEnter={() => { setIsHovered(true); shaderMount.current?.setSpeed?.(1); }}
            onMouseLeave={() => { setIsHovered(false); setIsPressed(false); shaderMount.current?.setSpeed?.(0.6); }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            style={{
              position: 'absolute', top: 0, left: 0, width: dims.width, height: dims.height,
              background: 'transparent', border: 'none', cursor: disabled ? 'default' : 'pointer', outline: 'none', zIndex: 40,
              transformStyle: 'preserve-3d', transform: 'translateZ(25px)', transition: spring, overflow: 'hidden', borderRadius: 100,
            }}
            aria-label={label}
          >
            {ripples.map((ripple) => (
              <span
                key={ripple.id}
                style={{
                  position: 'absolute', left: ripple.x, top: ripple.y, width: 20, height: 20, borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)',
                  pointerEvents: 'none', animation: 'ripple-animation 0.6s ease-out',
                }}
              />
            ))}
          </button>
        </div>
      </div>
    </div>
  );
}
