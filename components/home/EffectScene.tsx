"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { useEffect, useRef, useState } from "react";
import { LinearFilter, type Mesh, Vector2, VideoTexture } from "three";
import { AsciiEffect } from "./AsciiEffect";

function FloatingContent() {
  const meshRef = useRef<Mesh>(null);
  const [videoTexture, setVideoTexture] = useState<VideoTexture | null>(null);

  useEffect(() => {
    const video = document.createElement("video");
    video.src = "/video/cat-in-city.mp4";
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;

    let texture: VideoTexture | null = null;
    video.addEventListener("canplay", () => {
      if (texture) return;
      texture = new VideoTexture(video);
      texture.minFilter = LinearFilter;
      texture.magFilter = LinearFilter;
      setVideoTexture(texture);
    });

    video.play().catch(console.error);

    return () => {
      video.pause();
      video.src = "";
      texture?.dispose();
    };
  }, []);

  // Scale plane to cover the full viewport (like CSS object-fit: cover)
  const { viewport } = useThree();
  const videoAspect = 16 / 9;
  const viewportAspect = viewport.width / viewport.height;

  // Cover viewport fully with slight overscale to prevent edge gaps
  const scale = 1.05;
  const planeWidth =
    (viewportAspect > videoAspect
      ? viewport.width
      : viewport.height * videoAspect) * scale;
  const planeHeight = planeWidth / videoAspect;

  // Shift video down slightly (crop more from top, show more bottom)
  const yOffset = (planeHeight - viewport.height) / 2 - viewport.height * 0.1;

  // On narrow/mobile viewports, shift video left so subject is more visible
  const isMobile = viewportAspect < 1;
  const xOffset = isMobile ? -viewport.width * 0.35 : 0;

  useFrame(() => {
    if (meshRef.current && videoTexture) {
      videoTexture.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Video plane - fills width, anchored to bottom, crops top */}
      {videoTexture && (
        <mesh ref={meshRef} position={[xOffset, yOffset, 0]}>
          <planeGeometry args={[planeWidth, planeHeight]} />
          <meshBasicMaterial map={videoTexture} toneMapped={false} />
        </mesh>
      )}
    </>
  );
}

export function EffectScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState(new Vector2(0, 0));
  const [resolution, setResolution] = useState(new Vector2(1920, 1080));
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = rect.height - (e.clientY - rect.top);
        setMousePos(new Vector2(x, y));
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);

      const rect = container.getBoundingClientRect();
      setResolution(new Vector2(rect.width, rect.height));

      const handleResize = () => {
        const rect = container.getBoundingClientRect();
        setResolution(new Vector2(rect.width, rect.height));
      };
      window.addEventListener("resize", handleResize);

      return () => {
        container.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
        style={{ background: "#000000" }}
      >
        {/* Animated 3D content that gets converted to ASCII */}
        <FloatingContent />

        {/* ASCII Effect with PostFX */}
        <EffectComposer>
          <AsciiEffect
            style="standard"
            cellSize={10}
            invert={false}
            color={true}
            resolution={resolution}
            mousePos={mousePos}
            postfx={{
              scanlineIntensity: 0,
              scanlineCount: 200,
              targetFPS: 0,
              jitterIntensity: 0,
              jitterSpeed: 1,
              mouseGlowEnabled: false,
              mouseGlowRadius: 200,
              mouseGlowIntensity: 1.5,
              vignetteIntensity: 0,
              vignetteRadius: 0.8,
              colorPalette: "original",
              curvature: 0,
              aberrationStrength: 0,
              noiseIntensity: 0,
              noiseScale: 1,
              noiseSpeed: 1,
              waveAmplitude: 0,
              waveFrequency: 10,
              waveSpeed: 1,
              glitchIntensity: 0,
              glitchFrequency: 0,
              brightnessAdjust: 0,
              contrastAdjust: 1,
            }}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
