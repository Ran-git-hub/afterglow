import Link from "next/link";

export const metadata = {
  title: "About | Afterglow",
  description: "About Afterglow and its creator."
};

export default function AboutPage() {
  return (
    <main className="min-h-screen px-5 py-6 text-slate-100 sm:px-8 lg:px-10">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col">
        <header>
          <Link className="font-mono text-xs uppercase tracking-[0.14em] text-dim transition hover:text-mist" href="/">
            Back to Afterglow
          </Link>
        </header>

        <div className="grid flex-1 place-items-center py-16">
          <div className="w-full max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-ember/80">About</p>
            <h1 className="mt-4 font-serif text-4xl font-semibold text-slate-100 sm:text-5xl">Afterglow</h1>
            <div className="mt-8 border-t border-white/10 pt-8 text-base leading-8 text-mist">
              <p>
                Afterglow is a daily experiment in machine perception. It selects news, cultural signals, and
                technological events, then translates them into AI-generated images, titles, and short reflections.
                It is not a primary news source or factual report. It is a visual afterimage of the day — what
                remains after the world has passed through another kind of seeing.
              </p>
            </div>
            <div className="mt-10 space-y-5 border-t border-white/10 pt-8 font-mono text-sm uppercase tracking-[0.12em] text-dim">
              <p className="text-ember/80">Contact</p>
              <p>Name: <span className="text-mist">Ran He</span></p>
              <p>
                LinkedIn:{" "}
                <a
                  className="text-mist transition hover:text-slate-100"
                  href="https://www.linkedin.com/in/ran-he-1968885"
                  rel="noreferrer"
                  target="_blank"
                >
                  linkedin.com/in/ran-he-1968885
                </a>
              </p>
              <p>
                Email:{" "}
                <a className="text-mist transition hover:text-slate-100" href="mailto:allenheran@gmail.com">
                  allenheran@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
