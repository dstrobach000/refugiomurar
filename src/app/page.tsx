"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import Image from "next/image";
import { Suspense, useMemo, useRef, useState } from "react";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { Box3, Vector3, type Group } from "three";

const cactusMtl = "/Refugio_Murar/3D/Cactus/Refugio_Murar.mtl";
const cactusObj = "/Refugio_Murar/3D/Cactus/Refugio_Murar.obj";
const logoSrc = "/Refugio_Murar/Logo/murar_oranzova.png";
const audioSrc = "/Refugio_Murar/audio/field-recording.mp3";

function CactusModel({
  offsetX,
  offsetY,
  scale,
}: {
  offsetX: number;
  offsetY: number;
  scale: number;
}) {
  const materials = useLoader(MTLLoader, cactusMtl);
  const object = useLoader(OBJLoader, cactusObj, (loader) => {
    materials.preload();
    loader.setMaterials(materials);
  });
  const modelRef = useRef<Group | null>(null);

  useFrame((state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.12;
    }
  });

  const centeredObject = useMemo(() => {
    const clone = object.clone(true);
    const box = new Box3().setFromObject(clone);
    const center = new Vector3();
    box.getCenter(center);
    clone.position.sub(center);
    return clone;
  }, [object]);

  return (
    <primitive
      ref={modelRef}
      object={centeredObject}
      scale={scale}
      position={[offsetX, offsetY, 0]}
    />
  );
}

export default function Home() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const fileName = audioSrc.split("/").pop() ?? "audio";

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  const toggleLoop = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.loop = !audio.loop;
    setIsLooping(audio.loop);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#d2d2d2] font-sans text-[#d97831]">
      <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-6 text-center">
        <audio ref={audioRef} src={audioSrc} loop={isLooping} muted={isMuted} />
        <div className="absolute top-5 z-20 flex w-full items-center justify-center gap-4 px-4 text-[#d97831]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d97831] text-[#d97831] transition-colors hover:bg-[#d97831]/10"
            >
              {isPlaying ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <rect x="6" y="5" width="4" height="14" fill="currentColor" />
                  <rect
                    x="14"
                    y="5"
                    width="4"
                    height="14"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <polygon points="6,4 20,12 6,20" fill="currentColor" />
                </svg>
              )}
            </button>
            <button
              type="button"
              aria-label={isMuted ? "Unmute" : "Mute"}
              onClick={toggleMute}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d97831] text-[#d97831] transition-colors hover:bg-[#d97831]/10"
            >
              {isMuted ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <polygon
                    points="4,9 8,9 13,5 13,19 8,15 4,15"
                    fill="currentColor"
                  />
                  <line
                    x1="16"
                    y1="8"
                    x2="21"
                    y2="13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="21"
                    y1="8"
                    x2="16"
                    y2="13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <polygon
                    points="4,9 8,9 13,5 13,19 8,15 4,15"
                    fill="currentColor"
                  />
                  <path
                    d="M16 9c1.5 1.2 1.5 4.8 0 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
            <button
              type="button"
              aria-label={isLooping ? "Disable loop" : "Enable loop"}
              onClick={toggleLoop}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d97831] text-[#d97831] transition-colors hover:bg-[#d97831]/10"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M7 7h8a3 3 0 0 1 0 6h-2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <polyline
                  points="11,10 13,13 10,13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17 17H9a3 3 0 0 1 0-6h2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <polyline
                  points="13,14 11,11 14,11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <span className="text-sm tracking-wide text-[#d97831]/80">
            {fileName}
          </span>
        </div>
        <div className="relative flex h-[92vh] w-full items-center justify-center">
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
            <Image
              src={logoSrc}
              alt="Refugio Murar"
              width={720}
              height={720}
              priority
              className="h-auto w-[720px] sm:w-[1120px] lg:w-[1640px] animate-spin-slow"
            />
          </div>
          <Canvas camera={{ position: [0, 0, 7], fov: 30 }} className="relative z-10">
            <ambientLight intensity={0.6} />
            <directionalLight position={[4, 6, 4]} intensity={0.9} />
            <Suspense fallback={null}>
              <CactusModel offsetX={0} offsetY={-2} scale={4.8} />
            </Suspense>
          </Canvas>
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <span
              className="text-3xl font-normal text-[#d97831] sm:text-4xl lg:text-5xl"
              style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
            >
              Refugio Murar
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
