"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dailySets } from "@/lib/mockData";
import { fetchDailySetsFromSupabase, hasSupabaseConfig, updateMemoryCollection } from "@/lib/supabaseData";

export default function Home() {
  const [availableDailySets, setAvailableDailySets] = useState(hasSupabaseConfig ? [] : dailySets);
  const [selectedDate, setSelectedDate] = useState(hasSupabaseConfig ? "" : dailySets[0]?.runDate ?? "");
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasSlideTransition, setHasSlideTransition] = useState(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionOverflowing, setIsDescriptionOverflowing] = useState(false);
  const [isLoadingDailySets, setIsLoadingDailySets] = useState(hasSupabaseConfig);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [collectionUpdateId, setCollectionUpdateId] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const imageFrameRef = useRef<HTMLDivElement | null>(null);
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const selectedDateButtonRef = useRef<HTMLButtonElement | null>(null);
  const slideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dateWheelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedSet = useMemo(() => {
    return availableDailySets.find((set) => set.runDate === selectedDate) ?? availableDailySets[0];
  }, [availableDailySets, selectedDate]);

  const memories = useMemo(() => selectedSet?.memories.slice(0, 3) ?? [], [selectedSet]);
  const activeMemory = memories[activeIndex] ?? memories[0];
  const selectedDateIndex = availableDailySets.findIndex((set) => set.runDate === selectedDate);
  const previousLocation = getAdjacentMemoryLocation(-1);
  const nextLocation = getAdjacentMemoryLocation(1);
  const previousMemory = previousLocation
    ? availableDailySets[previousLocation.dateIndex]?.memories[previousLocation.memoryIndex]
    : activeMemory;
  const nextMemory = nextLocation
    ? availableDailySets[nextLocation.dateIndex]?.memories[nextLocation.memoryIndex]
    : activeMemory;

  function getAdjacentMemoryLocation(direction: -1 | 1) {
    if (!availableDailySets.length || selectedDateIndex < 0 || !memories.length) {
      return null;
    }

    if (direction === 1) {
      if (activeIndex < memories.length - 1) {
        return { dateIndex: selectedDateIndex, memoryIndex: activeIndex + 1 };
      }

      const nextDateIndex = selectedDateIndex + 1;
      const nextDateMemories = availableDailySets[nextDateIndex]?.memories.slice(0, 3) ?? [];
      return nextDateMemories.length ? { dateIndex: nextDateIndex, memoryIndex: 0 } : null;
    }

    if (activeIndex > 0) {
      return { dateIndex: selectedDateIndex, memoryIndex: activeIndex - 1 };
    }

    const previousDateIndex = selectedDateIndex - 1;
    const previousDateMemories = availableDailySets[previousDateIndex]?.memories.slice(0, 3) ?? [];
    return previousDateMemories.length
      ? { dateIndex: previousDateIndex, memoryIndex: previousDateMemories.length - 1 }
      : null;
  }

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
    setIsDescriptionExpanded(false);
  }, [activeMemory?.id]);

  useEffect(() => {
    const selectedDateButton = selectedDateButtonRef.current;
    if (!selectedDateButton) {
      return;
    }

    requestAnimationFrame(() => {
      selectedDateButton.scrollIntoView({
        block: "nearest",
        inline: "nearest"
      });
    });
  }, [selectedDate]);

  useEffect(() => {
    function measureDescriptionOverflow() {
      const description = descriptionRef.current;
      if (!description) {
        setIsDescriptionOverflowing(false);
        return;
      }

      const wasExpanded = description.classList.contains("is-expanded");
      if (wasExpanded) {
        description.classList.remove("is-expanded");
      }

      const isOverflowing = description.scrollHeight > description.clientHeight + 1;

      if (wasExpanded) {
        description.classList.add("is-expanded");
      }

      setIsDescriptionOverflowing(isOverflowing);
      if (!isOverflowing) {
        setIsDescriptionExpanded(false);
      }
    }

    const animationFrame = requestAnimationFrame(measureDescriptionOverflow);
    window.addEventListener("resize", measureDescriptionOverflow);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", measureDescriptionOverflow);
    };
  }, [activeMemory?.id]);

  useEffect(() => {
    return () => {
      if (slideTimeoutRef.current) {
        clearTimeout(slideTimeoutRef.current);
      }

      if (dateWheelTimeoutRef.current) {
        clearTimeout(dateWheelTimeoutRef.current);
      }
    };
  }, []);

  function chooseDate(date: string) {
    const scrollTop = window.scrollY;
    setSelectedDate(date);
    setActiveIndex(0);
    setDragOffset(0);
    dragOffsetRef.current = 0;
    setIsDragging(false);
    setHasSlideTransition(true);
    requestAnimationFrame(() => window.scrollTo({ top: scrollTop }));
  }

  function chooseImage(index: number) {
    const scrollTop = window.scrollY;
    setActiveIndex(index);
    requestAnimationFrame(() => window.scrollTo({ top: scrollTop }));
  }

  function setMemoryCollection(memoryId: string, isCollected: boolean) {
    setAvailableDailySets((currentDailySets) =>
      currentDailySets.map((dailySet) => ({
        ...dailySet,
        memories: dailySet.memories.map((memory) =>
          memory.id === memoryId ? { ...memory, isCollected } : memory
        )
      }))
    );
  }

  async function toggleCollection() {
    if (!activeMemory || collectionUpdateId) {
      return;
    }

    const nextIsCollected = !activeMemory.isCollected;
    setCollectionUpdateId(activeMemory.id);
    setMemoryCollection(activeMemory.id, nextIsCollected);

    const didUpdate = await updateMemoryCollection(activeMemory.id, nextIsCollected);
    if (!didUpdate && hasSupabaseConfig) {
      setMemoryCollection(activeMemory.id, !nextIsCollected);
    }

    setCollectionUpdateId(null);
  }

  function showPrevious() {
    slideToImage(-1);
  }

  function showNext() {
    slideToImage(1);
  }

  const slideToImage = useCallback(
    (direction: -1 | 1) => {
      const targetLocation = direction === 1 ? nextLocation : previousLocation;

      if (!targetLocation) {
        return;
      }

      const targetDate = availableDailySets[targetLocation.dateIndex]?.runDate;
      if (!targetDate) {
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
        const scrollTop = window.scrollY;

        requestAnimationFrame(() => {
          setSelectedDate(targetDate);
          setActiveIndex(targetLocation.memoryIndex);
          dragOffsetRef.current = 0;
          setDragOffset(0);

          requestAnimationFrame(() => {
            window.scrollTo({ top: scrollTop });
            setHasSlideTransition(true);
          });
        });
      }, 300);
    },
    [availableDailySets, nextLocation, previousLocation]
  );

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

      if (event.key === "Escape" && isLightboxOpen) {
        event.preventDefault();
        setIsLightboxOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, slideToImage]);

  function chooseAdjacentDate(direction: -1 | 1) {
    const nextDate = availableDailySets[selectedDateIndex + direction]?.runDate;
    if (nextDate) {
      chooseDate(nextDate);
    }
  }

  function handleDateWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (dateWheelTimeoutRef.current || Math.abs(event.deltaY) < 8) {
      return;
    }

    event.preventDefault();
    chooseAdjacentDate(event.deltaY > 0 ? 1 : -1);

    dateWheelTimeoutRef.current = setTimeout(() => {
      dateWheelTimeoutRef.current = null;
    }, 220);
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
    <main className="min-h-screen px-5 pb-28 pt-6 text-slate-100 sm:px-8 lg:px-10">
      <section className="page-shell mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col">
        <header className="site-header flex flex-col gap-7 sm:gap-8">
          <div>
            <h1 className="brand-mark font-serif text-3xl font-semibold tracking-normal text-slate-100 sm:text-4xl">
              <span>Afterglow</span>
              <span className="brand-flag" aria-hidden="true" />
            </h1>
            <p className="mt-2 text-sm text-dim">The world, after passing through machine imagination.</p>
          </div>

          <div
            className="date-nav viewer-width mx-auto grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2"
            onWheel={handleDateWheel}
          >
            <button
              aria-label="Previous date"
              className="grid h-10 place-items-center border border-white/10 bg-white/[0.03] font-mono text-lg text-mist transition hover:border-ember/40 hover:text-slate-100 disabled:cursor-default disabled:opacity-25 disabled:hover:border-white/10 disabled:hover:text-mist"
              type="button"
              disabled={selectedDateIndex <= 0}
              onClick={() => chooseAdjacentDate(-1)}
            >
              ‹
            </button>

            <div className="date-scroller no-scrollbar flex gap-2 overflow-x-auto scroll-smooth px-1" aria-label="Select date">
              {availableDailySets.map((set) => {
                const isSelected = selectedDate === set.runDate;

                return (
                  <button
                    key={set.runDate}
                    ref={isSelected ? selectedDateButtonRef : null}
                    className={`date-button shrink-0 whitespace-nowrap border px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition ${
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
          className="memory-stage flex flex-1 touch-pan-y flex-col justify-center py-8 sm:py-10 lg:py-8"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          <div className="gallery-row relative overflow-hidden px-6 sm:px-12">
            <div className="side-preview pointer-events-none absolute left-0 top-1/2 hidden aspect-[4/3] w-56 -translate-x-[72%] -translate-y-1/2 overflow-hidden rounded-md border border-white/10 opacity-30 blur-[0.2px] sm:block">
              <Image
                key={previousMemory.id}
                src={previousMemory.imageUrl}
                alt=""
                fill
                sizes="16rem"
                className="object-cover"
              />
            </div>
            <div className="side-preview pointer-events-none absolute right-0 top-1/2 hidden aspect-[4/3] w-56 translate-x-[72%] -translate-y-1/2 overflow-hidden rounded-md border border-white/10 opacity-30 blur-[0.2px] sm:block">
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

            <div className="viewer-width mx-auto">
              <div
                ref={imageFrameRef}
                className="gallery-frame relative aspect-[16/10] overflow-hidden rounded-md border border-ember/25 bg-slate-950/50 shadow-glow image-fade lg:aspect-[16/9]"
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
                    <button
                      key={`${memory.id}-${index}`}
                      aria-label={index === 1 ? "Open image" : undefined}
                      className={`relative h-full w-1/3 shrink-0 ${index === 1 ? "cursor-zoom-in" : "cursor-default"}`}
                      disabled={index !== 1}
                      type="button"
                      onClick={() => setIsLightboxOpen(true)}
                    >
                      <Image
                        src={memory.imageUrl}
                        alt={index === 1 ? memory.visualDescription : ""}
                        fill
                        priority={index === 1}
                        sizes="(min-width: 1024px) 72vw, 100vw"
                        className="object-cover"
                      />
                    </button>
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

            <div className="memory-copy relative mx-auto mt-7 grid w-full max-w-6xl content-start gap-6 lg:grid-cols-[0.9fr_1.4fr] lg:items-start">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-ember/80">
                {(activeIndex + 1).toString().padStart(2, "0")} / {memories.length.toString().padStart(2, "0")}
              </p>
              <h2 className="memory-title mt-4 text-balance text-slate-100">
                {activeMemory.newsTitle}
              </h2>
              <button
                className={`mt-5 border px-4 py-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition ${
                  activeMemory.isCollected
                    ? "border-ember/60 bg-ember/10 text-slate-100"
                    : "border-white/10 bg-white/[0.03] text-dim hover:border-ember/40 hover:text-mist"
                } disabled:cursor-wait disabled:opacity-60`}
                type="button"
                disabled={collectionUpdateId === activeMemory.id}
                onClick={toggleCollection}
              >
                Collection
              </button>
            </div>

            <div className="max-w-[43rem] lg:pt-1">
              <p
                ref={descriptionRef}
                className={`memory-description text-pretty text-mist ${
                  isDescriptionExpanded ? "is-expanded" : ""
                }`}
              >
                {activeMemory.visualDescription}
              </p>
              {isDescriptionOverflowing ? (
                <button
                  className="memory-toggle mt-3 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-mist/75 transition hover:text-slate-100"
                  type="button"
                  onClick={() => setIsDescriptionExpanded((isExpanded) => !isExpanded)}
                >
                  {isDescriptionExpanded ? "Collapse" : "Read full"}
                </button>
              ) : null}
              {activeMemory.artworkStyle || activeMemory.feelingTags ? (
                <div className="memory-meta mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-4 font-mono text-[0.68rem] uppercase tracking-[0.14em]">
                  {activeMemory.feelingTags ? <p className="text-ember/75">{activeMemory.feelingTags}</p> : null}
                  {activeMemory.artworkStyle ? (
                    <p className="basis-full text-mist">Style: {activeMemory.artworkStyle}</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-6 max-w-2xl lg:absolute lg:bottom-0 lg:left-0 lg:mt-0">
              <div className="image-position flex h-5 justify-start gap-2" aria-label="Image position">
                {memories.map((memory, index) => (
                  <button
                    key={memory.id}
                    aria-label={`Show image ${index + 1}`}
                    className="group grid h-5 w-8 place-items-center"
                    type="button"
                    onClick={() => chooseImage(index)}
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
        </div>

      </section>
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#080b10]/95 px-5 py-4 text-center font-mono uppercase backdrop-blur-sm">
        <p className="text-[0.68rem] leading-5 tracking-[0.08em] text-dim/75">
          Disclaimer: Afterglow presents AI-generated interpretations of selected news and themes, translated into
          images by AI. It is not a primary news source or a factual report.
        </p>
        <p className="mt-1 text-xs leading-5 tracking-[0.12em] text-dim">
          © 2026 Afterglow. All rights reserved. <span className="px-2 text-dim/70">|</span>{" "}
          <Link className="transition hover:text-mist" href="/about">
            About
          </Link>
        </p>
      </footer>
      {isLightboxOpen ? (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-[#05070a]/95 px-4 py-16 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          <button
            aria-label="Close image preview"
            className="absolute right-5 top-5 z-10 grid h-11 w-11 place-items-center border border-white/15 bg-white/[0.04] font-mono text-xl text-mist transition hover:border-white/30 hover:text-slate-100"
            type="button"
            onClick={() => setIsLightboxOpen(false)}
          >
            ×
          </button>
          <button
            aria-label="Previous image"
            className="absolute left-5 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/[0.04] font-mono text-3xl text-mist transition hover:border-white/30 hover:text-slate-100"
            type="button"
            onClick={() => slideToImage(-1)}
          >
            ‹
          </button>
          <div className="relative h-full max-h-[82vh] w-full max-w-[92vw]">
            <Image
              src={activeMemory.imageUrl}
              alt={activeMemory.visualDescription}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>
          <button
            aria-label="Next image"
            className="absolute right-5 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-white/[0.04] font-mono text-3xl text-mist transition hover:border-white/30 hover:text-slate-100"
            type="button"
            onClick={() => slideToImage(1)}
          >
            ›
          </button>
        </div>
      ) : null}
    </main>
  );
}

function LoadingPage() {
  return (
    <main className="min-h-screen px-5 pb-28 pt-6 text-slate-100 sm:px-8 lg:px-10" aria-busy="true">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col">
        <header className="flex flex-col gap-7 sm:gap-8">
          <div>
            <h1 className="brand-mark font-serif text-3xl font-semibold tracking-normal text-slate-100 sm:text-4xl">
              <span>Afterglow</span>
              <span className="brand-flag" aria-hidden="true" />
            </h1>
            <p className="mt-2 text-sm text-dim">The world, after passing through machine imagination.</p>
          </div>

          <div className="viewer-width mx-auto grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2">
            <div className="h-10 border border-white/10 bg-white/[0.03]" />
            <div className="flex gap-2">
              <div className="h-10 w-28 border border-ember/30 bg-ember/[0.08]" />
              <div className="h-10 w-28 border border-white/10 bg-white/[0.03]" />
            </div>
            <div className="h-10 border border-white/10 bg-white/[0.03]" />
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-center py-8 sm:py-10 lg:py-8">
          <div className="relative overflow-hidden px-6 sm:px-12">
            <div className="viewer-width mx-auto">
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
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#080b10]/95 px-5 py-4 text-center font-mono uppercase backdrop-blur-sm">
        <p className="text-[0.68rem] leading-5 tracking-[0.08em] text-dim/75">
          Disclaimer: Afterglow presents AI-generated interpretations of selected news and themes, translated into
          images by AI. It is not a primary news source or a factual report.
        </p>
        <p className="mt-1 text-xs leading-5 tracking-[0.12em] text-dim">
          © 2026 Afterglow. All rights reserved. <span className="px-2 text-dim/70">|</span>{" "}
          <Link className="transition hover:text-mist" href="/about">
            About
          </Link>
        </p>
      </footer>
    </main>
  );
}
