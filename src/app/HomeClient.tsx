"use client";

/* eslint-disable @next/next/no-img-element */

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Box3, Vector3, type Group } from "three";

const cactusGlb = "/Refugio_Murar/3D/Cactus/AnotherCactus.glb";
const logoSrc = "/Refugio_Murar/Logo/murar_logo_hneda.png";
const audioSrc = "/Refugio_Murar/Sound/260130_133313_LABOR.mp3";
const contactApiUrl =
  "https://refugiomurar.0david0strobach0.workers.dev/api/contact";

const CACTUS_MODEL_Y = 0;
const CAMERA_POSITION: [number, number, number] = [0.25, -0.35, 13];
const CAMERA_FOV = 47;

useGLTF.preload(cactusGlb);

const formatDatePart = (datePart: string) => {
  if (datePart.length !== 6) {
    return "unknown date";
  }
  const year = `20${datePart.slice(0, 2)}`;
  const month = datePart.slice(2, 4);
  const day = datePart.slice(4, 6);
  return `${day}.${month}.${year}`;
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
  return `you are listening to the sounds of ${title} recorded on ${formatDatePart(
    datePart ?? "",
  )} at ${formatTimePart(timePart ?? "")}`;
};

const formatMissingFields = (fields: string[]) => {
  if (fields.length === 0) {
    return "";
  }
  if (fields.length === 1) {
    return fields[0];
  }
  if (fields.length === 2) {
    return `${fields[0]} and ${fields[1]}`;
  }
  const head = fields.slice(0, -1).join(", ");
  const tail = fields[fields.length - 1];
  return `${head}, and ${tail}`;
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
      position={[0, CACTUS_MODEL_Y, 0]}
    />
  );
}

export default function Home() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [submitMessage, setSubmitMessage] = useState("");
  const currentFileName = audioSrc.split("/").pop() ?? "audio";
  const listeningLabel = formatListeningLabel(currentFileName);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const missingFields: string[] = [];
    if (!name) {
      missingFields.push("name");
    }
    if (!email) {
      missingFields.push("e-mail address");
    }
    if (!message) {
      missingFields.push("message");
    }

    if (missingFields.length > 0) {
      setSubmitStatus("error");
      setSubmitMessage(
        `Please fill out ${formatMissingFields(missingFields)}.`,
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setSubmitMessage("");

    try {
      const response = await fetch(contactApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, message }),
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setSubmitStatus("error");
        setSubmitMessage(result.error ?? "Could not send your message.");
        return;
      }

      setSubmitStatus("success");
      setSubmitMessage("Message sent. We will get back to you soon.");
      form.reset();
    } catch {
      setSubmitStatus("error");
      setSubmitMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      void audio.play().catch(() => {
        // If blocked again, user can interact with the page and retry.
      });
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

    const handleLoaded = () => setCurrentTime(0);

    audio.addEventListener("loadeddata", handleLoaded);
    audio.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      audio.removeEventListener("loadeddata", handleLoaded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
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
  }, []);

  const formatTime = (value: number) => {
    const totalSeconds = Math.floor(value);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const padded = (time: number) => String(time).padStart(2, "0");
    return `${padded(hours)}:${padded(minutes)}:${padded(seconds)}`;
  };

  const visualLayerStyle = {
    top: "0px",
    height: "100lvh",
  } as const;

  const canvasLayerStyle = {
    top: "-34svh",
    height: "calc(100lvh + 112svh)",
  } as const;

  return (
    <>
      <div className="relative" style={{ minHeight: "100lvh" }}>
        <audio
          ref={audioRef}
          src={audioSrc}
          muted={isMuted}
          preload="auto"
          loop
        />

        {/* Scene layer (independent from UI layer). */}
        <div
          className="pointer-events-none absolute left-0 top-0 h-screen w-full"
          style={{ height: "100lvh" }}
        >
          {/* Gray background */}
          <div
            className="absolute left-0 top-0 z-5 h-screen w-full bg-[#d2d2d2]"
            style={visualLayerStyle}
          />

          {/* 3D cactus — transparent so logo shows through */}
          <div
            className="absolute left-0 top-0 z-20 h-screen w-full"
            style={{
              ...canvasLayerStyle,
              transform: "translateY(-4svh)",
              touchAction: "none",
              overscrollBehavior: "none",
              WebkitOverflowScrolling: "auto",
            }}
          >
            <Canvas
              style={{ height: "100%", width: "100%", touchAction: "none" }}
              camera={{ position: CAMERA_POSITION, fov: CAMERA_FOV }}
              dpr={[1, 1.25]}
              resize={{ scroll: false }}
              gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
            >
              <ambientLight intensity={1.2} />
              <directionalLight position={[4, 6, 4]} intensity={1.7} />
              <directionalLight position={[-4, -2, 6]} intensity={0.9} />
              <Suspense fallback={null}>
                <CactusModel scale={70} />
              </Suspense>
            </Canvas>
          </div>
        </div>
      </div>

      {/* Logo layer (independent from cactus and UI layers). */}
      <div
        className="pointer-events-none fixed inset-0 z-10 flex h-screen w-full items-center justify-center"
        style={{ height: "100lvh" }}
      >
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

      {/* UI layer (independent from scene layer). */}
      <div
        className="fixed inset-0 z-50 grid h-screen w-full grid-rows-[auto,1fr] overflow-hidden font-sans text-[#b026ff]"
        style={{ height: "100dvh" }}
      >
        <div className="row-start-1 px-4 sm:px-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 relative z-50">
          <div className="flex items-start justify-between gap-3 text-[#b026ff]">
            <button
              type="button"
              aria-label={isMuted ? "Unmute" : "Mute"}
              onClick={toggleMute}
              className="shrink-0 relative z-30 flex h-8 w-8 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-[#b026ff] text-[#b026ff] transition-colors hover:bg-[#b026ff]/10 cursor-pointer"
            >
              {isMuted ? (
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 sm:h-5 sm:w-5 pointer-events-none"
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
                  className="h-4 w-4 sm:h-5 sm:w-5 pointer-events-none"
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

            <span className="min-w-0 flex-1 mx-auto max-w-[18rem] text-center text-xs leading-snug tracking-[0.15em] text-[#b026ff]/80 sm:max-w-[34rem] sm:text-lg lg:max-w-[42rem]">
              {listeningLabel}
            </span>

            <span className="shrink-0 rounded-full border border-[#b026ff] px-3 py-1 text-xs tracking-[0.2em] text-[#b026ff]/80 sm:text-lg">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>

        <div
          className="row-start-2 relative z-50 min-h-0 overflow-y-scroll overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
        >
          <div className="flex items-start justify-center px-5 pt-6 sm:pt-8 pb-[calc(env(safe-area-inset-bottom)+12rem)] sm:pb-[calc(env(safe-area-inset-bottom)+2rem)]">
          <div className="flex w-full max-w-[44rem] flex-col items-center justify-start gap-4 sm:gap-5 text-[#b026ff] text-center">
            <p
              className="max-w-2xl text-center text-xl font-normal sm:text-3xl lg:text-4xl"
              style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
            >
              refugio murar is currently under construction, in every way
              imaginable. if you'd like to inquire about a visit or have any
              other questions, drop us a message.
            </p>
            <form
              className="mx-auto mt-8 sm:mt-6 flex w-full max-w-2xl flex-col items-center gap-3 sm:gap-5 sm:px-0"
              onSubmit={handleFormSubmit}
            >
              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <label className="flex w-full flex-col items-center gap-1.5 text-center text-base uppercase tracking-wide sm:text-xl">
                  name:
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full rounded-full border border-[#b026ff] bg-transparent px-4 py-2 text-lg text-[#b026ff] placeholder:text-[#b026ff] text-center sm:text-2xl"
                    placeholder="your name"
                  />
                </label>
                <label className="flex w-full flex-col items-center gap-1.5 text-center text-base uppercase tracking-wide sm:text-xl">
                  e-mail address:
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full rounded-full border border-[#b026ff] bg-transparent px-4 py-2 text-lg text-[#b026ff] placeholder:text-[#b026ff] text-center sm:text-2xl"
                    placeholder="your@email.address"
                  />
                </label>
              </div>
              <label className="flex w-full flex-col items-center gap-1.5 text-center text-base uppercase tracking-wide sm:text-xl">
                message:
                <textarea
                  name="message"
                  required
                  rows={4}
                  className="w-full min-h-[96px] sm:min-h-[140px] rounded-3xl border border-[#b026ff] bg-transparent px-4 py-2 text-lg text-[#b026ff] placeholder:text-[#b026ff] text-center sm:text-2xl"
                  placeholder="your message"
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="self-center rounded-full border border-[#b026ff] px-8 py-2 text-base uppercase tracking-[0.2em] text-[#b026ff] transition-colors hover:bg-[#b026ff]/10 sm:text-xl"
              >
                {isSubmitting ? "sending..." : "send"}
              </button>
              {submitMessage ? (
                <p
                  className={`text-base sm:text-xl ${
                    submitStatus === "error"
                      ? "text-[#ff6a9f]"
                      : "text-[#b026ff]"
                  }`}
                >
                  {submitMessage}
                </p>
              ) : null}
            </form>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}
