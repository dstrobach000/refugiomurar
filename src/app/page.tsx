"use client";

/* eslint-disable @next/next/no-img-element */

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  Suspense,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { Box3, Vector3, type Group } from "three";
const cactusGlb = "/Refugio_Murar/3D/Cactus/AnotherCactus.glb";
const logoSrc = "/Refugio_Murar/Logo/murar_logo_hneda.png";
const audioSources = ["/Refugio_Murar/Sound/260130_133313_LABOR.mp3"];

useGLTF.preload(cactusGlb);

const formatDatePart = (datePart: string) => {
  if (datePart.length !== 6) {
    return "unknown date";
  }
  const year = `20${datePart.slice(0, 2)}`;
  const month = datePart.slice(2, 4);
  const day = datePart.slice(4, 6);
  return `${day}. ${month}. ${year}`;
};

const formatTimePart = (timePart: string) => {
  if (timePart.length !== 6) {
    return "00:00:00";
  }
  const hours = timePart.slice(0, 2);
  const minutes = timePart.slice(2, 4);
  const seconds = timePart.slice(4, 6);
  return `${hours}:${minutes}:${seconds}`;
};

const formatListeningLabel = (fileName: string) => {
  const baseName = fileName.replace(/\.[^/.]+$/, "");
  const [datePart, timePart, ...rest] = baseName.split("_");
  const title = rest.join("_").toLowerCase() || "audio";
  return `You're listening to ${title} recorded on ${formatDatePart(
    datePart ?? "",
  )} at ${formatTimePart(timePart ?? "")}`;
};

function CactusModel({ scale }: { scale: number }) {
  const gltf = useGLTF(cactusGlb);
  const modelRef = useRef<Group | null>(null);

  useFrame((_state, delta) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += delta * 0.12;
    }
  });

  const centeredObject = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const box = new Box3().setFromObject(clone);
    const center = new Vector3();
    box.getCenter(center);
    clone.position.sub(center);
    return clone;
  }, [gltf.scene]);

  return (
    <primitive
      ref={modelRef}
      object={centeredObject}
      scale={scale}
      position={[0, 0, 0]}
    />
  );
}

export default function Home() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState(() =>
    audioSources.length > 1
      ? Math.floor(Math.random() * audioSources.length)
      : 0,
  );
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const currentFileName =
    audioSources[currentTrack]?.split("/").pop() ?? "audio";
  const listeningLabel = formatListeningLabel(currentFileName);

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    const subject = `refugio murar inquiry${name ? ` from ${name}` : ""}`;
    const body = [
      `Name: ${name || "-"}`,
      `Email: ${email || "-"}`,
      "",
      message || "-",
    ].join("\n");

    const mailto = `mailto:hello@refugiomurar.es?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoaded = () => {
      setCurrentTime(0);
    };

    const handleEnded = async () => {
      setCurrentTrack((prev) => (prev + 1) % audioSources.length);
    };

    audio.addEventListener("loadeddata", handleLoaded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadeddata", handleLoaded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.load();
    const playAudio = async () => {
      try {
        await audio.play();
      } catch {
        // Autoplay can be blocked; user can unmute to hear once allowed.
      }
    };
    void playAudio();
  }, [currentTrack]);

  const formatTime = (value: number) => {
    const totalSeconds = Math.floor(value);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const padded = (time: number) => String(time).padStart(2, "0");
    return `${padded(hours)}:${padded(minutes)}:${padded(seconds)}`;
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={audioSources[currentTrack]}
        muted={isMuted}
        preload="auto"
        loop
      />

      {/* Purple strips behind iOS Safari bars — height is 0 on desktop */}
      <div
        className="pointer-events-none fixed top-0 left-0 right-0 z-[100] bg-[#b026ff]"
        style={{ height: "env(safe-area-inset-top, 0px)" }}
      />
      <div
        className="pointer-events-none fixed bottom-0 left-0 right-0 z-[100] bg-[#b026ff]"
        style={{ height: "env(safe-area-inset-bottom, 0px)" }}
      />

      {/* Gray background */}
      <div className="pointer-events-none fixed inset-0 z-[5] bg-[#d2d2d2]" />

      {/* Spinning logo */}
      <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center">
        <img
          src={logoSrc}
          alt="refugio murar"
          width={720}
          height={720}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="h-auto w-[720px] sm:w-[1120px] lg:w-[1640px] animate-spin-slow"
        />
      </div>

      {/* 3D cactus — transparent so logo shows through */}
      <div className="pointer-events-none fixed inset-0 z-20">
        <Canvas
          camera={{ position: [0, 0, 13], fov: 50 }}
          dpr={[1, 1.25]}
          gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        >
          <ambientLight intensity={1.2} />
          <directionalLight position={[4, 6, 4]} intensity={1.7} />
          <directionalLight position={[-4, -2, 6]} intensity={0.9} />
          <Suspense fallback={null}>
            <CactusModel scale={16} />
          </Suspense>
        </Canvas>
      </div>

      <div className="fixed inset-0 z-50 grid grid-rows-[auto,1fr] overflow-y-auto font-sans text-[#b026ff]">
        <div className="row-start-1 px-4 sm:px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 relative z-50">
          <div className="flex items-start justify-between gap-3 text-[#b026ff]">
            <button
              type="button"
              aria-label={isMuted ? "Unmute" : "Mute"}
              onClick={toggleMute}
              className="shrink-0 relative z-30 flex h-10 w-10 items-center justify-center rounded-full border border-[#b026ff] text-[#b026ff] transition-colors hover:bg-[#b026ff]/10 cursor-pointer"
            >
              {isMuted ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 pointer-events-none"
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
                  className="h-4 w-4 pointer-events-none"
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

            <span className="min-w-0 flex-1 mx-auto max-w-64 text-center text-xs leading-snug tracking-[0.15em] text-[#b026ff]/80 sm:max-w-80 sm:text-sm">
              {listeningLabel}
            </span>

            <span className="shrink-0 rounded-full border border-[#b026ff] px-3 py-1 text-xs tracking-[0.2em] text-[#b026ff]/80 sm:text-sm">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>

        <div className="row-start-2 relative z-50 flex items-center justify-center px-5 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <div className="flex w-full max-w-[44rem] flex-col items-center justify-center gap-3 sm:gap-4 text-[#b026ff] text-center">
            <p
              className="max-w-2xl text-center text-base font-normal sm:text-lg lg:text-xl"
              style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
            >
              refugio murar is currently under construction, in every way
              imaginable. If you would like to inquire about a visit, drop us a
              message.
            </p>
            <form
              className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 sm:px-0"
              onSubmit={handleFormSubmit}
            >
              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <label className="flex w-full flex-col items-center gap-1.5 text-center text-sm uppercase tracking-wide">
                  name:
                  <input
                    type="text"
                    name="name"
                    className="w-full rounded-full border border-[#b026ff] bg-transparent px-4 py-2 text-base text-[#b026ff] placeholder:text-[#b026ff] text-center"
                    placeholder="your name"
                  />
                </label>
                <label className="flex w-full flex-col items-center gap-1.5 text-center text-sm uppercase tracking-wide">
                  e-mail address:
                  <input
                    type="email"
                    name="email"
                    className="w-full rounded-full border border-[#b026ff] bg-transparent px-4 py-2 text-base text-[#b026ff] placeholder:text-[#b026ff] text-center"
                    placeholder="your@email.address"
                  />
                </label>
              </div>
              <label className="flex w-full flex-col items-center gap-1.5 text-center text-sm uppercase tracking-wide">
                message:
                <textarea
                  name="message"
                  rows={4}
                  className="w-full min-h-[110px] rounded-3xl border border-[#b026ff] bg-transparent px-4 py-2 text-base text-[#b026ff] placeholder:text-[#b026ff] text-center"
                  placeholder="your message"
                />
              </label>
              <button
                type="submit"
                className="self-center rounded-full border border-[#b026ff] px-8 py-2 text-sm uppercase tracking-[0.2em] text-[#b026ff] transition-colors hover:bg-[#b026ff]/10"
              >
                send
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
