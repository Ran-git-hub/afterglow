"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { dailySets } from "@/lib/mockData";
import { fetchDailySetsFromSupabase, hasSupabaseConfig } from "@/lib/supabaseData";

export default function Home() {
  const [availableDailySets, setAvailableDailySets] = useState(hasSupabaseConfig ? [] : dailySets);
  const [selectedDate, setSelectedDate] = useState(hasSupabaseConfig ? "" : dailySets[0]?.runDate ?? "");
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasSlideTransition, setHasSlideTransition] = useState(true);
  const [isLoadingDailySets, setIsLoadingDailySets] = useState(hasSupabaseConfig);
  const touchStartX = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const imageFrameRef = useRef<HTMLDivElement | null>(null);
  const slideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeDateRef = useRef<HTMLButtonElement | null>(null);

  const selectedSet = useMemo(() => {
    return availableDailySets.find((set) => set.runDate === selectedDate) ?? availableDailySets[0];
  }, [availableDailySets, selectedDate]);

  const memories = useMemo(() => selectedSet?.memories.slice(0, 3) ?? [], [selectedSet]);
  const activeMemory = memories[activeIndex] ?? memories[0];
  const previousMemory = memories[(activeIndex - 1 + memories.length) % memories.length];
  const nextMemory = memories[(activeIndex + 1) % memories.length];
  const selectedDateIndex = availableDailySets.findIndex((set) => set.runDate === selectedDate);

  useEffect(() => {
    let isMounted = true;

    fetchDailySetsFromSupabase().then((supabaseDailySets) => {
      if (!isMounted) {
        return;
      }

      const nextDailySets = supabaseDailySets?.length ? supabaseDailySets : dailySets;
      setAvailableDailySets(nextDailySets);
      setSelectedDate(nextDailySets[0]?.runDate ?? "");
      setActiveIndex(0);
      setIsLoadingDailySets(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    activeDateRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center"
    });
  }, [selectedDate]);

  useEffect(() => {
    return () => {
      if (slideTimeoutRef.current) {
        clearTimeout(slideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        slideToImage(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        slideToImage(1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [memories.length]);

  function chooseDate(date: string) {
    setSelectedDate(date);
    setActiveIndex(0);
    setDragOffset(0);
    dragOffsetRef.current = 0;
    setIsDragging(false);
    setHasSlideTransition(true);
  }

  function showPrevious() {
    slideToImage(-1);
  }

  function showNext() {
    slideToImage(1);
  }

  function slideToImage(direction: -1 | 1) {
    if (memories.length < 2) {
      return;
    }

    if (slideTimeoutRef.current) {
      return;
    }

    const frameWidth = imageFrameRef.current?.clientWidth ?? 360;
    const endOffset = direction === 1 ? -frameWidth : frameWidth;

    touchStartX.current = null;
    dragOffsetRef.current = endOffset;
    setIsDragging(false);
    setHasSlideTransition(true);
    setDragOffset(endOffset);

    slideTimeoutRef.current = setTimeout(() => {
      setHasSlideTransition(false);
      slideTimeoutRef.current = null;

      requestAnimationFrame(() => {
        setActiveIndex((current) => {
          if (direction === 1) {
            return (current + 1) % memories.length;
          }

          return current === 0 ? memories.length - 1 : current - 1;
        });
        dragOffsetRef.current = 0;
        setDragOffset(0);

        requestAnimationFrame(() => {
          setHasSlideTransition(true);
        });
      });
    }, 300);
  }

  function chooseAdjacentDate(direction: -1 | 1) {
    const nextDate = availableDailySets[selectedDateIndex + direction]?.runDate;
    if (nextDate) {
      chooseDate(nextDate);
    }
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (slideTimeoutRef.current) {
      clearTimeout(slideTimeoutRef.current);
      slideTimeoutRef.current = null;
    }

    touchStartX.current = event.touches[0]?.clientX ?? null;
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(true);
    setHasSlideTransition(false);
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) {
      return;
    }

    const touchX = event.touches[0]?.clientX;
    if (touchX === undefined) {
      return;
    }

    const distance = touchX - touchStartX.current;
    const frameWidth = imageFrameRef.current?.clientWidth ?? 360;
    const maxDrag = frameWidth * 0.38;
    const nextOffset = Math.max(Math.min(distance, maxDrag), -maxDrag);
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  }

  function handleTouchEnd() {
    if (touchStartX.current === null) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    const frameWidth = imageFrameRef.current?.clientWidth ?? 360;
    const threshold = Math.min(120, frameWidth * 0.22);
    const distance = dragOffsetRef.current;

    touchStartX.current = null;
    setIsDragging(false);
    setHasSlideTransition(true);

    if (Math.abs(distance) < threshold) {
      dragOffsetRef.current = 0;
      setDragOffset(0);
      return;
    }

    slideToImage(distance < 0 ? 1 : -1);
  }

  function handleTouchCancel() {
    touchStartX.current = null;
    dragOffsetRef.current = 0;
    setIsDragging(false);
    setHasSlideTransition(true);
    setDragOffset(0);
  }

  if (!activeMemory) {
    if (isLoadingDailySets) {
      return <LoadingPage />;
    }

    return (
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <h1 className="font-serif text-5xl text-slate-100">Afterglow</h1>
          <p className="mt-4 text-mist">Afterglow has not been generated yet.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-6 text-slate-100 sm:px-8 lg:px-10">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col">
        <header className="flex flex-col gap-7 sm:gap-8">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-normal text-slate-100 sm:text-4xl">
              Afterglow
            </h1>
            <p className="mt-2 text-sm text-dim">What remains after the world is seen</p>
          </div>

          <div className="mx-auto grid w-full max-w-5xl grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2">
            <button
              aria-label="Previous date"
              className="grid h-10 place-items-center border border-white/10 bg-white/[0.03] font-mono text-lg text-mist transition hover:border-ember/40 hover:text-slate-100 disabled:cursor-default disabled:opacity-25 disabled:hover:border-white/10 disabled:hover:text-mist"
              type="button"
              disabled={selectedDateIndex <= 0}
              onClick={() => chooseAdjacentDate(-1)}
            >
              ‹
            </button>

            <div className="no-scrollbar flex gap-2 overflow-x-auto scroll-smooth px-1" aria-label="Select date">
              {availableDailySets.map((set) => {
                const isSelected = selectedDate === set.runDate;

                return (
                  <button
                    key={set.runDate}
                    ref={isSelected ? activeDateRef : null}
                    className={`shrink-0 border px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition ${
                      isSelected
                        ? "border-ember/60 bg-ember/10 text-slate-100"
                        : "border-white/10 bg-white/[0.03] text-dim hover:border-ember/40 hover:text-mist"
                    }`}
                    type="button"
                    onClick={() => chooseDate(set.runDate)}
                  >
                    {set.runDate}
                  </button>
                );
              })}
            </div>

            <button
              aria-label="Next date"
              className="grid h-10 place-items-center border border-white/10 bg-white/[0.03] font-mono text-lg text-mist transition hover:border-ember/40 hover:text-slate-100 disabled:cursor-default disabled:opacity-25 disabled:hover:border-white/10 disabled:hover:text-mist"
              type="button"
              disabled={selectedDateIndex >= availableDailySets.length - 1}
              onClick={() => chooseAdjacentDate(1)}
            >
              ›
            </button>
          </div>
        </header>

        <div
          className="flex flex-1 touch-pan-y flex-col justify-center py-8 sm:py-10"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          <div className="relative overflow-hidden px-6 sm:px-12">
            <div className="pointer-events-none absolute left-0 top-1/2 hidden aspect-[4/3] w-56 -translate-x-[72%] -translate-y-1/2 overflow-hidden rounded-md border border-white/10 opacity-30 blur-[0.2px] sm:block lg:w-80">
              <Image
                key={previousMemory.id}
                src={previousMemory.imageUrl}
                alt=""
                fill
                sizes="16rem"
                className="object-cover"
              />
            </div>
            <div className="pointer-events-none absolute right-0 top-1/2 hidden aspect-[4/3] w-56 translate-x-[72%] -translate-y-1/2 overflow-hidden rounded-md border border-white/10 opacity-30 blur-[0.2px] sm:block lg:w-80">
              <Image
                key={nextMemory.id}
                src={nextMemory.imageUrl}
                alt=""
                fill
                sizes="16rem"
                className="object-cover"
              />
            </div>

            <button
              aria-label="Previous image"
              className="absolute left-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-[#0b0d12]/85 font-mono text-xl text-white/75 shadow-glow transition hover:scale-105 hover:border-white/35 hover:bg-[#11141a] hover:text-white sm:left-8 sm:h-14 sm:w-14 sm:text-3xl lg:left-16 lg:opacity-55 lg:hover:opacity-100"
              type="button"
              onClick={showPrevious}
            >
              ‹
            </button>

            <div className="mx-auto max-w-5xl">
              <div
                ref={imageFrameRef}
                className="relative aspect-[16/10] overflow-hidden rounded-md border border-ember/25 bg-slate-950/50 shadow-glow image-fade lg:aspect-[16/9]"
              >
                <div
                  className={`flex h-full w-[300%] ${
                    isDragging || !hasSlideTransition ? "" : "transition-transform duration-300 ease-out"
                  }`}
                  style={{
                    transform: `translateX(calc(-33.333333% + ${dragOffset}px))`
                  }}
                >
                  {[previousMemory, activeMemory, nextMemory].map((memory, index) => (
                    <div key={`${memory.id}-${index}`} className="relative h-full w-1/3 shrink-0">
                      <Image
                        src={memory.imageUrl}
                        alt={index === 1 ? memory.visualDescription : ""}
                        fill
                        priority={index === 1}
                        sizes="(min-width: 1024px) 72vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              aria-label="Next image"
              className="absolute right-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-[#0b0d12]/85 font-mono text-xl text-white/75 shadow-glow transition hover:scale-105 hover:border-white/35 hover:bg-[#11141a] hover:text-white sm:right-8 sm:h-14 sm:w-14 sm:text-3xl lg:right-16 lg:opacity-55 lg:hover:opacity-100"
              type="button"
              onClick={showNext}
            >
              ›
            </button>
          </div>

            <div className="relative mx-auto mt-7 grid min-h-[25rem] w-full max-w-6xl content-start gap-6 sm:min-h-[21rem] lg:h-[22rem] lg:grid-cols-[0.9fr_1.4fr] lg:items-start lg:overflow-hidden">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-ember/80">
                {activeMemory.rank.toString().padStart(2, "0")} / 03
              </p>
              <h2 className="mt-4 text-balance text-3xl leading-tight text-slate-100 sm:text-4xl lg:text-5xl">
                {activeMemory.newsTitle}
              </h2>
            </div>

            <div className="max-w-[43rem] lg:pt-1">
              <p className="text-pretty text-base leading-8 text-mist sm:text-lg lg:text-[1.18rem] lg:leading-9">
                {activeMemory.visualDescription}
              </p>
              {activeMemory.feelingTags ? (
                <p className="mt-6 border-t border-white/10 pt-4 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-ember/75">
                  {activeMemory.feelingTags}
                </p>
              ) : null}
            </div>

            <div className="flex h-5 justify-start gap-2 lg:absolute lg:bottom-0 lg:left-0" aria-label="Image position">
              {memories.map((memory, index) => (
                <button
                  key={memory.id}
                  aria-label={`Show image ${index + 1}`}
                  className="group grid h-5 w-8 place-items-center"
                  type="button"
                  onClick={() => setActiveIndex(index)}
                >
                  <span
                    className={`h-1.5 rounded-full transition ${
                      activeIndex === index ? "w-8 bg-ember/80" : "w-1.5 bg-white/20 group-hover:bg-white/40"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <footer className="border-t border-white/10 py-5 text-xs leading-6 text-dim sm:flex sm:items-center sm:justify-between sm:gap-8">
          <p>
            Disclaimer: Afterglow is an AI-generated visual interpretation of selected news themes, not a
            primary news source or factual report.
          </p>
          <p className="mt-3 shrink-0 font-mono uppercase tracking-[0.12em] text-dim sm:mt-0">
            © 2026 Afterglow. All rights reserved.
          </p>
        </footer>
      </section>
    </main>
  );
}

function LoadingPage() {
  return (
    <main className="min-h-screen px-5 py-6 text-slate-100 sm:px-8 lg:px-10" aria-busy="true">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col">
        <header className="flex flex-col gap-7 sm:gap-8">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-normal text-slate-100 sm:text-4xl">
              Afterglow
            </h1>
            <p className="mt-2 text-sm text-dim">What remains after the world is seen</p>
          </div>

          <div className="mx-auto grid w-full max-w-5xl grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2">
            <div className="h-10 border border-white/10 bg-white/[0.03]" />
            <div className="flex gap-2">
              <div className="h-10 w-28 border border-ember/30 bg-ember/[0.08]" />
              <div className="h-10 w-28 border border-white/10 bg-white/[0.03]" />
            </div>
            <div className="h-10 border border-white/10 bg-white/[0.03]" />
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-center py-8 sm:py-10">
          <div className="relative overflow-hidden px-6 sm:px-12">
            <div className="mx-auto max-w-5xl">
              <div className="relative aspect-[16/10] overflow-hidden rounded-md border border-white/10 bg-slate-950/70 lg:aspect-[16/9]">
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.06] via-white/[0.025] to-transparent" />
              </div>
            </div>
          </div>

          <div className="relative mx-auto mt-7 grid min-h-[25rem] w-full max-w-6xl content-start gap-6 sm:min-h-[21rem] lg:h-[22rem] lg:grid-cols-[0.9fr_1.4fr] lg:items-start lg:overflow-hidden">
            <div>
              <div className="h-4 w-16 bg-ember/25" />
              <div className="mt-5 h-12 w-4/5 max-w-md bg-white/[0.08]" />
              <div className="mt-3 h-12 w-2/3 max-w-sm bg-white/[0.06]" />
            </div>

            <div className="max-w-[43rem] lg:pt-1">
              <div className="h-5 w-full bg-white/[0.07]" />
              <div className="mt-4 h-5 w-11/12 bg-white/[0.06]" />
              <div className="mt-4 h-5 w-4/5 bg-white/[0.05]" />
              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="h-3 w-2/5 bg-ember/20" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
