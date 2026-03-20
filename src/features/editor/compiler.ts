import type { Preset } from "./presets";

/**
 * Compiles structured markdown into a standalone HTML presentation.
 *
 * Markdown format:
 * ---
 * # Title slide
 * Subtitle here
 * ---
 * ## Slide title
 * - Bullet point
 * - Another point
 * ---
 * ## Code example
 * ```bash
 * git commit -m "hello"
 * ```
 * ---
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type SlideContent = {
  type: "title" | "content";
  heading: string;
  subtitle?: string;
  bullets: string[];
  code?: { lang: string; content: string };
  paragraphs: string[];
  images: { src: string; alt: string }[];
};

function parseSlide(md: string): SlideContent {
  const lines = md.trim().split("\n");
  const slide: SlideContent = {
    type: "content",
    heading: "",
    bullets: [],
    paragraphs: [],
    images: [],
  };

  let inCode = false;
  let codeLang = "";
  let codeLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (!inCode) {
        inCode = true;
        codeLang = line.slice(3).trim() || "text";
        codeLines = [];
      } else {
        inCode = false;
        slide.code = { lang: codeLang, content: codeLines.join("\n") };
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgMatch) {
      slide.images.push({ alt: imgMatch[1], src: imgMatch[2] });
      continue;
    }

    if (line.startsWith("# ") && !line.startsWith("## ")) {
      slide.type = "title";
      slide.heading = line.slice(2).trim();
    } else if (line.startsWith("## ")) {
      slide.heading = line.slice(3).trim();
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      slide.bullets.push(line.slice(2).trim());
    } else if (line.trim() && !slide.heading) {
      slide.subtitle = line.trim();
    } else if (line.trim() && slide.heading) {
      if (!slide.subtitle && slide.type === "title") {
        slide.subtitle = line.trim();
      } else {
        slide.paragraphs.push(line.trim());
      }
    }
  }

  return slide;
}

function renderSlide(slide: SlideContent, index: number, total: number): string {
  const num = String(index).padStart(2, "0");

  if (slide.type === "title") {
    return `
    <!-- === SLIDE ${index + 1}: TITLE === -->
    <section class="slide" aria-label="${escapeHtml(slide.heading)}">
      <div class="slide-content" style="align-items:center;text-align:center;">
        <h1 class="reveal" style="font-size:var(--title-size);font-weight:700;color:var(--accent);text-shadow:0 0 20px var(--accent-glow);line-height:1;margin-bottom:clamp(0.3rem,1vw,0.8rem);">${escapeHtml(slide.heading)}</h1>
        ${slide.subtitle ? `<p class="reveal" style="font-size:var(--body-size);color:var(--text-secondary);">${escapeHtml(slide.subtitle)}</p>` : ""}
        ${slide.images.map((img) => `<div class="reveal" style="margin-top:clamp(0.5rem,1vw,1rem);"><img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}" style="max-width:min(60vw,500px);max-height:40vh;object-fit:contain;border-radius:8px;" /></div>`).join("\n        ")}
        <p class="reveal" style="margin-top:clamp(1rem,3vw,3rem);font-size:var(--small-size);color:var(--text-dim);">${total} slides</p>
      </div>
    </section>`;
  }

  let content = "";

  if (slide.paragraphs.length > 0 && !slide.code && slide.bullets.length === 0) {
    content = slide.paragraphs
      .map((p) => `<p class="reveal" style="font-size:var(--body-size);color:var(--text-secondary);line-height:1.6;max-width:min(80vw,700px);">${escapeHtml(p)}</p>`)
      .join("\n        ");
  }

  if (slide.bullets.length > 0) {
    const items = slide.bullets
      .map((b) => `<li class="reveal">${escapeHtml(b)}</li>`)
      .join("\n            ");
    content += `
        <ul style="list-style:none;display:flex;flex-direction:column;gap:clamp(0.3rem,0.8vh,0.6rem);max-width:min(80vw,700px);">
          ${items}
        </ul>`;
  }

  if (slide.images.length > 0) {
    content += slide.images
      .map((img) => `
        <div class="reveal" style="display:flex;justify-content:center;">
          <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}" style="max-width:min(80vw,700px);max-height:50vh;object-fit:contain;border-radius:8px;" />
        </div>`)
      .join("\n");
  }

  if (slide.code) {
    const codeHtml = escapeHtml(slide.code.content)
      .split("\n")
      .map((line) => `<code>${line}</code>`)
      .join("\n              ");
    content += `
        <div class="reveal" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:6px;overflow:hidden;max-width:min(85vw,750px);">
          <div style="display:flex;align-items:center;gap:clamp(4px,0.5vw,6px);padding:clamp(4px,0.6vw,8px) clamp(8px,1vw,12px);background:rgba(255,255,255,0.03);border-bottom:1px solid var(--border);">
            <span style="width:clamp(6px,0.7vw,10px);height:clamp(6px,0.7vw,10px);border-radius:50%;background:#f85149;"></span>
            <span style="width:clamp(6px,0.7vw,10px);height:clamp(6px,0.7vw,10px);border-radius:50%;background:#e3b341;"></span>
            <span style="width:clamp(6px,0.7vw,10px);height:clamp(6px,0.7vw,10px);border-radius:50%;background:var(--accent);"></span>
            <span style="font-size:var(--small-size);color:var(--text-dim);margin-left:clamp(4px,0.5vw,8px);">${escapeHtml(slide.code.lang)}</span>
          </div>
          <div style="padding:clamp(0.5rem,1.5vw,1.2rem);font-family:var(--font-display);font-size:var(--code-size);line-height:1.6;white-space:pre;overflow-x:auto;">
            ${codeHtml}
          </div>
        </div>`;
  }

  return `
    <!-- === SLIDE ${index + 1} === -->
    <section class="slide" aria-label="${escapeHtml(slide.heading)}">
      <div class="slide-content" style="gap:clamp(0.5rem,1.5vw,1.5rem);">
        <div class="reveal" style="display:flex;align-items:center;gap:clamp(0.5rem,1vw,1rem);">
          <span style="font-size:var(--small-size);color:var(--text-dim);min-width:clamp(24px,3vw,40px);">${num}</span>
          <h2 style="font-size:var(--h2-size);font-weight:700;color:var(--accent);text-shadow:0 0 10px var(--accent-glow);">${escapeHtml(slide.heading)}</h2>
        </div>
        ${content}
      </div>
    </section>`;
}

export function compileMarkdownToHtml(markdown: string, preset: Preset, title: string): string {
  const slides = markdown
    .split(/^---\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean);

  const parsedSlides = slides.map(parseSlide);
  const slideHtml = parsedSlides
    .map((slide, i) => renderSlide(slide, i, parsedSlides.length))
    .join("\n");

  const cssVars = Object.entries(preset.colors)
    .map(([k, v]) => `${k}: ${v};`)
    .join("\n            ");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <link href="${preset.fonts}" rel="stylesheet">
    <style>
        :root {
            ${cssVars}
            --font-display: ${preset.fontFamily.display};
            --font-body: ${preset.fontFamily.body};
            --title-size: clamp(1.8rem, 5vw, 4rem);
            --h2-size: clamp(1.2rem, 3vw, 2rem);
            --h3-size: clamp(0.9rem, 2vw, 1.4rem);
            --body-size: clamp(0.7rem, 1.3vw, 1rem);
            --small-size: clamp(0.6rem, 0.9vw, 0.8rem);
            --code-size: clamp(0.65rem, 1.1vw, 0.9rem);
            --slide-padding: clamp(1.5rem, 4vw, 4rem);
            --content-gap: clamp(0.5rem, 2vw, 2rem);
            --element-gap: clamp(0.25rem, 1vw, 1rem);
            --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
            --duration-normal: 0.6s;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; overflow-x: hidden; }
        html { scroll-snap-type: y mandatory; scroll-behavior: smooth; }
        body { background: var(--bg-primary); color: var(--text-primary); font-family: var(--font-body); }
        .slide {
            width: 100vw; height: 100vh; height: 100dvh;
            overflow: hidden; scroll-snap-align: start;
            display: flex; flex-direction: column; position: relative;
        }
        .slide::before {
            content: ''; position: absolute; inset: 0;
            background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px);
            pointer-events: none; z-index: 5;
        }
        .slide-content {
            flex: 1; display: flex; flex-direction: column;
            justify-content: center; max-height: 100%;
            overflow: hidden; padding: var(--slide-padding);
        }
        ul { list-style: none; }
        li { font-size: var(--body-size); color: var(--text-secondary); line-height: 1.5; padding-left: 1.2em; position: relative; }
        li::before { content: '→'; color: var(--accent); position: absolute; left: 0; }
        code { font-family: var(--font-display); display: block; color: var(--text-primary); white-space: pre; }
        .reveal {
            opacity: 0; transform: translateY(20px);
            transition: opacity var(--duration-normal) var(--ease-out-expo),
                        transform var(--duration-normal) var(--ease-out-expo);
        }
        .slide.visible .reveal { opacity: 1; transform: translateY(0); }
        .slide.visible .reveal:nth-child(1) { transition-delay: 0.05s; }
        .slide.visible .reveal:nth-child(2) { transition-delay: 0.15s; }
        .slide.visible .reveal:nth-child(3) { transition-delay: 0.25s; }
        .slide.visible .reveal:nth-child(4) { transition-delay: 0.35s; }
        .slide.visible .reveal:nth-child(5) { transition-delay: 0.45s; }
        .progress-bar {
            position: fixed; top: 0; left: 0; height: 2px;
            background: var(--accent); box-shadow: 0 0 8px var(--accent-glow);
            z-index: 100; transition: width 0.3s ease;
        }
        .nav-dots {
            position: fixed; right: clamp(0.5rem,2vw,1.5rem); top: 50%;
            transform: translateY(-50%); display: flex; flex-direction: column;
            gap: clamp(4px,0.5vw,8px); z-index: 100;
        }
        .nav-dot {
            width: clamp(4px,0.5vw,6px); height: clamp(4px,0.5vw,6px);
            border-radius: 50%; background: var(--text-dim);
            border: none; cursor: pointer; transition: all 0.3s ease; padding: 0;
        }
        .nav-dot.active {
            background: var(--accent); box-shadow: 0 0 6px var(--accent-glow);
            transform: scale(1.5);
        }
        @media (max-height: 700px) {
            :root { --slide-padding: clamp(0.75rem,3vw,2rem); --title-size: clamp(1.25rem,4.5vw,2.5rem); }
        }
        @media (max-height: 600px) {
            .nav-dots { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.2s !important; }
            html { scroll-behavior: auto; }
        }
    </style>
</head>
<body>
    <div class="progress-bar" id="progressBar"></div>
    <nav class="nav-dots" id="navDots" aria-label="Navigation"></nav>
    ${slideHtml}
    <script>
    class SlidePresentation {
        constructor() {
            this.slides = document.querySelectorAll('.slide');
            this.currentSlide = 0;
            this.isScrolling = false;
            this.scrollTimeout = null;
            this.setupIntersectionObserver();
            this.setupKeyboardNav();
            this.setupTouchNav();
            this.setupWheelNav();
            this.setupProgressBar();
            this.setupNavDots();
            this.slides[0].classList.add('visible');
        }
        setupIntersectionObserver() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        this.currentSlide = Array.from(this.slides).indexOf(entry.target);
                        this.updateProgressBar();
                        this.updateNavDots();
                    }
                });
            }, { threshold: 0.5 });
            this.slides.forEach(slide => observer.observe(slide));
        }
        setupKeyboardNav() {
            document.addEventListener('keydown', (e) => {
                switch(e.key) {
                    case 'ArrowDown': case 'ArrowRight': case ' ': case 'PageDown':
                        e.preventDefault(); this.goToSlide(this.currentSlide + 1); break;
                    case 'ArrowUp': case 'ArrowLeft': case 'PageUp':
                        e.preventDefault(); this.goToSlide(this.currentSlide - 1); break;
                }
            });
        }
        setupTouchNav() {
            let startY = 0;
            document.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; }, { passive: true });
            document.addEventListener('touchend', (e) => {
                const delta = startY - e.changedTouches[0].clientY;
                if (Math.abs(delta) > 50) this.goToSlide(this.currentSlide + (delta > 0 ? 1 : -1));
            }, { passive: true });
        }
        setupWheelNav() {
            document.addEventListener('wheel', (e) => {
                e.preventDefault();
                if (this.isScrolling) return;
                this.isScrolling = true;
                this.goToSlide(this.currentSlide + (e.deltaY > 0 ? 1 : -1));
                clearTimeout(this.scrollTimeout);
                this.scrollTimeout = setTimeout(() => { this.isScrolling = false; }, 800);
            }, { passive: false });
        }
        goToSlide(index) {
            if (index < 0 || index >= this.slides.length) return;
            this.currentSlide = index;
            this.slides[index].scrollIntoView({ behavior: 'smooth' });
            this.updateProgressBar();
            this.updateNavDots();
        }
        setupProgressBar() {
            this.progressBar = document.getElementById('progressBar');
            this.updateProgressBar();
        }
        updateProgressBar() {
            this.progressBar.style.width = ((this.currentSlide + 1) / this.slides.length * 100) + '%';
        }
        setupNavDots() {
            const c = document.getElementById('navDots');
            this.slides.forEach((_, i) => {
                const d = document.createElement('button');
                d.classList.add('nav-dot');
                if (i === 0) d.classList.add('active');
                d.addEventListener('click', () => this.goToSlide(i));
                c.appendChild(d);
            });
            this.navDots = c.querySelectorAll('.nav-dot');
        }
        updateNavDots() {
            this.navDots.forEach((d, i) => d.classList.toggle('active', i === this.currentSlide));
        }
    }
    new SlidePresentation();
    </script>
</body>
</html>`;
}
