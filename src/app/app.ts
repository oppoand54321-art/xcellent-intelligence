import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';

interface Section {
  id: string;
  nav: string;
  title: string;
  tag: string;
  intro: string;
  shape: 'erp' | 'ai' | 'mobile' | 'three-d' | 'devops';
  image: string;
  imageName: string;
  points: string[];
}

interface Mesh {
  v: number[][];
  e: [number, number][];
  dots?: boolean;
}

interface SocialLink {
  name: string;
  mark: string;
  url: string;
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);

  // Replace with your own, e.g. 'mailto:you@domain.com' or 'https://wa.me/92XXXXXXXXXX'
  protected readonly contactHref = '#contact';

  protected readonly sections: Section[] = [
    {
      id: 'erp-saas',
      nav: 'ERP & SaaS',
      title: 'ERP & SaaS',
      tag: 'Business systems and cloud software',
      intro: 'Complete business management and cloud products, built to run in the browser.',
      shape: 'erp',
      image: '/images/image-1.png',
      imageName: 'image-1.png',
      points: [
        'ERP: accounting, inventory, CRM and workflow automation in one connected system.',
        'Dashboards that turn daily records into clear business views.',
        'SaaS: multi-tenant cloud software with a private workspace for every customer.',
        'Subscription handling, admin controls and instant updates for all users.',
      ],
    },
    {
      id: 'ai',
      nav: 'AI',
      title: 'Artificial Intelligence',
      tag: 'AI and machine learning',
      intro: 'Intelligent software that works alongside people and removes repetitive work.',
      shape: 'ai',
      image: '/images/image-3.png',
      imageName: 'image-3.png',
      points: [
        'AI agents and agent orchestration for multi-step tasks.',
        'AI coding assistants and developer tools.',
        'LLM integrations and AI APIs connected to your own systems.',
        'Automation and intelligent workflows, backed by GPU computing infrastructure.',
      ],
    },
    {
      id: 'mobile',
      nav: 'Mobile & APK',
      title: 'Mobile & APK',
      tag: 'Android and mobile applications',
      intro: 'Mobile applications designed for real phones, from first screen to installable APK.',
      shape: 'mobile',
      image: '/images/image-5.png',
      imageName: 'image-5.png',
      points: [
        'Android APK applications with a native-feeling experience.',
        'Progressive Web Apps where a browser-based app fits better.',
        'Offline support and push notifications.',
        'Connected to the same backend as your ERP or SaaS product.',
      ],
    },
    {
      id: 'three-d',
      nav: '3D & AR',
      title: '3D & AR',
      tag: '3D programming and augmented reality',
      intro: 'Real-time graphics and spatial experiences, programmed from the ground up.',
      shape: 'three-d',
      image: '/images/image-4.png',
      imageName: 'image-4.png',
      points: [
        '3D programming and rendering, including interactive web-based 3D.',
        'Real-time visualization and technical simulations.',
        '3D product visualization that customers can rotate and explore.',
        'ARKit augmented reality experiences for Apple devices.',
      ],
    },
    {
      id: 'devops',
      nav: 'DevOps',
      title: 'DevOps & Cloud',
      tag: 'Infrastructure and delivery',
      intro: 'Reliable infrastructure and automated delivery behind every product.',
      shape: 'devops',
      image: '/images/image-2.png',
      imageName: 'image-2.png',
      points: [
        'CI/CD pipelines that test and deploy every change.',
        'Docker and Kubernetes for consistent, scalable deployments.',
        'Server monitoring and automation.',
        'Cloud infrastructure with clear deployment workflows.',
      ],
    },
  ];

  protected readonly socialLinks: SocialLink[] = [
    { name: 'X / Twitter', mark: 'X', url: '' },
    { name: 'Facebook', mark: 'f', url: '' },
    { name: 'Instagram', mark: '◎', url: '' },
    { name: 'LinkedIn', mark: 'in', url: '' },
  ];

  private raf = 0;
  private cleanups: Array<() => void> = [];
  private observer?: IntersectionObserver;
  private mouse = { x: -1000, y: -1000 };

  protected go(id: string, e: Event) {
    e.preventDefault();
    this.host.nativeElement.querySelector('#' + id)?.scrollIntoView({ behavior: 'smooth' });
  }

  protected onImageError(event: Event) {
    const image = event.target as HTMLImageElement;
    image.closest('.service-image')?.classList.add('is-empty');
    image.hidden = true;
  }

  protected onImageLoad(event: Event) {
    const image = event.target as HTMLImageElement;
    image.closest('.service-image')?.classList.remove('is-empty');
    image.hidden = false;
  }

  ngAfterViewInit() {
    const root = this.host.nativeElement;

    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(
        (entries) =>
          entries.forEach((en) =>
            en.target.querySelectorAll('.reveal').forEach((el) => el.classList.toggle('in', en.isIntersecting)),
          ),
        { threshold: 0.1 },
      );
      // Watch the untransformed section; the image itself starts off-screen for its entrance animation.
      root.querySelectorAll('.panel').forEach((el) => this.observer!.observe(el));
    }

    const cloth = root.querySelector<HTMLCanvasElement>('canvas.cloth');
    const meshes = Array.from(root.querySelectorAll<HTMLCanvasElement>('canvas.mesh'));
    const dot = root.querySelector<HTMLElement>('.dot');

    // Animation runs outside Angular so it never blocks change detection or tests.
    this.zone.runOutsideAngular(() => {
      const on = <K extends keyof WindowEventMap>(type: K, fn: (e: WindowEventMap[K]) => void) => {
        window.addEventListener(type, fn as EventListener);
        this.cleanups.push(() => window.removeEventListener(type, fn as EventListener));
      };

      on('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        if (dot) dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      });

      const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      const logo = root.querySelector<HTMLElement>('.x-image');
      const drawCloth = cloth ? this.makeCloth(cloth, calm, logo) : null;
      const drawMeshes = meshes.map((c) => this.makeMesh(c, calm));

      const loop = () => {
        drawCloth?.();
        drawMeshes.forEach((d) => d?.());
        this.raf = requestAnimationFrame(loop);
      };
      loop();
    });
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.raf);
    this.cleanups.forEach((fn) => fn());
    this.observer?.disconnect();
  }

  private fitCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.max(1, r.width * dpr);
    canvas.height = Math.max(1, r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: r.width, h: r.height };
  }

  // A sheet of tiny arrows that billows like cloth and turns away from the mouse.
  private makeCloth(canvas: HTMLCanvasElement, calm: boolean, logo: HTMLElement | null) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const step = 24;
    let size = this.fitCanvas(canvas, ctx);

    const resize = () => (size = this.fitCanvas(canvas, ctx));
    window.addEventListener('resize', resize);
    this.cleanups.push(() => window.removeEventListener('resize', resize));

    return () => {
      const r = canvas.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const { w, h } = size;
      const t = calm ? 0 : performance.now() / 1000;
      const mx = this.mouse.x - r.left;
      const my = this.mouse.y - r.top;
      const reach = 150;

      // Over the round logo the arrows fade to a faint shimmer so the logo stays clear.
      const lr = logo?.getBoundingClientRect();
      const lx = lr ? lr.left + lr.width / 2 - r.left : -9999;
      const ly = lr ? lr.top + lr.height / 2 - r.top : -9999;
      const lrad = lr ? Math.min(lr.width, lr.height) / 2 : 1;

      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';

      for (let gy = step / 2; gy < h; gy += step) {
        for (let gx = step / 2; gx < w; gx += step) {
          const wave =
            Math.sin(gx * 0.012 + t * 1.4) +
            Math.cos(gy * 0.015 + t * 1.1) +
            Math.sin((gx + gy) * 0.008 - t * 0.9);

          let px = gx + Math.sin(gy * 0.02 + t * 1.2) * 7;
          let py = gy + Math.cos(gx * 0.02 + t) * 7;
          let ang = wave * 0.9;

          const dx = px - mx;
          const dy = py - my;
          const d = Math.hypot(dx, dy);
          if (d < reach) {
            const f = 1 - d / reach;
            let diff = Math.atan2(dy, dx) - ang;
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));
            ang += diff * f;
            px += (dx / (d || 1)) * f * 20;
            py += (dy / (d || 1)) * f * 20;
          }

          const light = 0.5 + 0.5 * Math.sin(wave * 1.2);
          const n = Math.hypot(px - lx, py - ly) / lrad;
          const k = Math.min(1, Math.max(0, (n - 0.9) / 0.25));
          const fade = 0.18 + 0.82 * k * k * (3 - 2 * k);
          ctx.strokeStyle = `rgba(225, 235, 250, ${(0.3 + 0.65 * light) * fade})`;

          const c = Math.cos(ang);
          const s = Math.sin(ang);
          const tx = px + c * 7;
          const ty = py + s * 7;
          ctx.beginPath();
          ctx.moveTo(px - c * 7, py - s * 7);
          ctx.lineTo(tx, ty);
          ctx.lineTo(tx - Math.cos(ang - 0.5) * 4, ty - Math.sin(ang - 0.5) * 4);
          ctx.moveTo(tx, ty);
          ctx.lineTo(tx - Math.cos(ang + 0.5) * 4, ty - Math.sin(ang + 0.5) * 4);
          ctx.stroke();
        }
      }
    };
  }

  // ---------- Wireframe 3D objects (plain canvas maths, no libraries) ----------

  private boxMesh(w: number, h: number, d: number, cy = 0): Mesh {
    const v: number[][] = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) v.push([(x * w) / 2, cy + (y * h) / 2, (z * d) / 2]);
    const e: [number, number][] = [];
    for (let i = 0; i < 8; i++) {
      for (let j = i + 1; j < 8; j++) {
        const diff = i ^ j;
        if (diff === 1 || diff === 2 || diff === 4) e.push([i, j]);
      }
    }
    return { v, e };
  }

  private prismMesh(n: number, r: number, h: number): Mesh {
    const v: number[][] = [];
    const e: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      v.push([Math.cos(a) * r, -h / 2, Math.sin(a) * r]);
    }
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      v.push([Math.cos(a) * r, h / 2, Math.sin(a) * r]);
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      e.push([i, j], [n + i, n + j], [i, n + i]);
    }
    return { v, e };
  }

  private merge(...parts: Mesh[]): Mesh {
    const out: Mesh = { v: [], e: [] };
    for (const p of parts) {
      const off = out.v.length;
      out.v.push(...p.v);
      p.e.forEach(([a, b]) => out.e.push([a + off, b + off]));
    }
    return out;
  }

  private buildMesh(shape: string): Mesh {
    switch (shape) {
      case 'erp':
        return this.merge(this.boxMesh(1.5, 0.28, 1.1, -0.5), this.boxMesh(1.5, 0.28, 1.1, 0), this.boxMesh(1.5, 0.28, 1.1, 0.5));
      case 'ai': {
        const t = (1 + Math.sqrt(5)) / 2;
        const k = 0.95 / Math.sqrt(1 + t * t);
        const raw: number[][] = [];
        for (const a of [-1, 1]) for (const b of [-t, t]) raw.push([a, b, 0], [0, a, b], [b, 0, a]);
        const v = raw.map((p) => p.map((n) => n * k));
        const e: [number, number][] = [];
        for (let i = 0; i < raw.length; i++) {
          for (let j = i + 1; j < raw.length; j++) {
            const d2 = (raw[i][0] - raw[j][0]) ** 2 + (raw[i][1] - raw[j][1]) ** 2 + (raw[i][2] - raw[j][2]) ** 2;
            if (d2 < 4.1) e.push([i, j]);
          }
        }
        return { v, e, dots: true };
      }
      case 'mobile': {
        const body = this.boxMesh(0.75, 1.5, 0.14);
        const screen: Mesh = {
          v: [[-0.32, -0.66, 0.075], [-0.32, 0.66, 0.075], [0.32, 0.66, 0.075], [0.32, -0.66, 0.075]],
          e: [[0, 1], [1, 2], [2, 3], [3, 0]],
        };
        return this.merge(body, screen);
      }
      case 'three-d': {
        const R = 0.7;
        const r = 0.3;
        const nu = 28;
        const nv = 12;
        const v: number[][] = [];
        const e: [number, number][] = [];
        for (let u = 0; u < nu; u++) {
          for (let w = 0; w < nv; w++) {
            const a = (u / nu) * Math.PI * 2;
            const b = (w / nv) * Math.PI * 2;
            v.push([(R + r * Math.cos(b)) * Math.cos(a), r * Math.sin(b), (R + r * Math.cos(b)) * Math.sin(a)]);
          }
        }
        for (let u = 0; u < nu; u++) {
          for (let w = 0; w < nv; w++) {
            const i = u * nv + w;
            e.push([i, u * nv + ((w + 1) % nv)], [i, ((u + 1) % nu) * nv + w]);
          }
        }
        return { v, e };
      }
      default:
        return this.merge(this.prismMesh(10, 0.9, 0.5), this.prismMesh(10, 0.35, 0.95));
    }
  }

  // Draws one object; it turns slowly on its own and turns further as the page scrolls.
  private makeMesh(canvas: HTMLCanvasElement, calm: boolean) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const mesh = this.buildMesh(canvas.dataset['shape'] ?? '');
    let size = this.fitCanvas(canvas, ctx);

    const resize = () => (size = this.fitCanvas(canvas, ctx));
    window.addEventListener('resize', resize);
    this.cleanups.push(() => window.removeEventListener('resize', resize));

    return () => {
      const r = canvas.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      const { w, h } = size;
      const t = calm ? 0 : performance.now() / 1000;
      const prog = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      const ry = t * 0.35 - prog * Math.PI * 1.6;
      const rx = 0.45 + prog * 0.7;
      const cam = 3.4;
      const sc = Math.min(w, h) * 0.34;
      const cy = Math.cos(ry);
      const sy = Math.sin(ry);
      const cx = Math.cos(rx);
      const sx = Math.sin(rx);

      const pts = mesh.v.map(([x, y, z]) => {
        const x1 = x * cy + z * sy;
        const z1 = -x * sy + z * cy;
        const y1 = y * cx - z1 * sx;
        const z2 = y * sx + z1 * cx;
        const k = cam / (cam + z2);
        return { x: w / 2 + x1 * k * sc, y: h / 2 + y1 * k * sc, z: z2 };
      });

      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      for (const [a, b] of mesh.e) {
        const p = pts[a];
        const q = pts[b];
        const depth = 1 - ((p.z + q.z) / 2 + 1.5) / 3;
        ctx.strokeStyle = `rgba(165, 205, 255, ${0.25 + 0.65 * Math.max(0, Math.min(1, depth))})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
      if (mesh.dots) {
        ctx.fillStyle = 'rgba(110, 175, 255, 0.95)';
        for (const p of pts) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
  }
}
