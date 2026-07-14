"use client"

import { Effects } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { Particles } from "./particles"
import { VignetteShader } from "./shaders/vignetteShader"

// Tuned defaults lifted from the original leva controls in the template.
const CONFIG = {
  speed: 1.0,
  noiseScale: 0.6,
  noiseIntensity: 0.52,
  timeScale: 1,
  focus: 3.8,
  aperture: 1.79,
  pointSize: 10.0,
  opacity: 0.8,
  planeScale: 10.0,
  size: 512 as const,
  vignetteDarkness: 1.5,
  vignetteOffset: 0.4,
  useManualTime: false,
  manualTime: 0,
}

export const GL = ({ hovering = false }: { hovering?: boolean }) => {
  return (
    <div id="webgl" className="h-full w-full">
      <Canvas
        camera={{
          position: [1.2629783123314589, 2.664606471394044, -1.8178993743288914],
          fov: 50,
          near: 0.01,
          far: 300,
        }}
      >
        <color attach="background" args={["#000"]} />
        <Particles
          speed={CONFIG.speed}
          aperture={CONFIG.aperture}
          focus={CONFIG.focus}
          size={CONFIG.size}
          noiseScale={CONFIG.noiseScale}
          noiseIntensity={CONFIG.noiseIntensity}
          timeScale={CONFIG.timeScale}
          pointSize={CONFIG.pointSize}
          opacity={CONFIG.opacity}
          planeScale={CONFIG.planeScale}
          useManualTime={CONFIG.useManualTime}
          manualTime={CONFIG.manualTime}
          introspect={hovering}
        />
        <Effects multisamping={0} disableGamma>
          <shaderPass
            args={[VignetteShader]}
            uniforms-darkness-value={CONFIG.vignetteDarkness}
            uniforms-offset-value={CONFIG.vignetteOffset}
          />
        </Effects>
      </Canvas>
    </div>
  )
}
