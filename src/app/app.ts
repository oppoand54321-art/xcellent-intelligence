import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';

export type ServiceCard = {
  id: number;
  title: string;
  lines: string[];
  tone: 'red' | 'yellow' | 'green' | 'blue' | 'gold' | 'silver' | 'orange' | 'purple';
};

type Ripple = { x: number; y: number; r: number; life: number; max: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number };

const WA_NUMBER = '923XXXXXXXXX';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit, OnDestroy {
  @ViewChild('swarmCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('servicesSec')
  servicesRef?: ElementRef<HTMLElement>;

  helpOpen = false;
  servicesIn = false;
  activeCard: ServiceCard | null = null;
  chatStep: 0 | 1 | 2 = 0;
  chatLog: { from: 'bot' | 'user'; text: string }[] = [];

  leftServices: ServiceCard[] = [
    { id: 1, title: 'WEB DEVELOPMENT', lines: ['CUSTOM WEBSITES & E-COMMERCE', 'FAST, HIGH-PERFORMANCE BUILDS'], tone: 'red' },
    { id: 2, title: 'DESIGN SERVICES', lines: ['UI/UX & BRAND IDENTITY', 'MOTION GRAPHICS ANIMATION'], tone: 'gold' },
    { id: 3, title: 'CUSTOM ERP', lines: ['ENTERPRISE RESOURCE PLANNING', 'FULL UAE VAT/WPS COMPLIANCE'], tone: 'blue' },
    { id: 4, title: 'WARM MARKETING', lines: ['SMM ACROSS IG, TIKTOK, FB', 'PAID ADS MANAGEMENT & BRAND DEVELOPMENT'], tone: 'orange' },
  ];

  rightServices: ServiceCard[] = [
    { id: 5, title: 'APP DEVELOPMENT', lines: ['NATIVE IOS & ANDROID APPS', 'CROSS-PLATFORM FLUTTER DEVELOPMENT'], tone: 'green' },
    { id: 6, title: 'AI AGENTS', lines: ['VOICE AI AGENTS', 'MULTI-AGENT AUTOMATION SYSTEMS'], tone: 'purple' },
    { id: 7, title: 'CUSTOM CRM', lines: ['WHATSAPP INTEGRATION', 'AI-POWERED CUSTOMER MANAGEMENT'], tone: 'silver' },
    { id: 8, title: 'COLD MARKETING', lines: ['B2B EMAIL MARKETING', 'LINKEDIN OUTREACH & COLD CALLING'], tone: 'yellow' },
  ];

  private ctx: CanvasRenderingContext2D | null = null;
  private raf = 0;
  private running = false;
  private cssW = 1;
  private cssH = 1;
  private dpr = 1;
  private pointer = { x: 0, y: 0, px: 0, py: 0 };
  private ripples: Ripple[] = [];
  private sparks: Spark[] = [];
  private emitAcc = 0;
  private observer?: IntersectionObserver;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d', { alpha: true });
    if (!this.ctx) return;
    this.resize();
    this.pointer.x = this.pointer.px = this.cssW * 0.5;
    this.pointer.y = this.pointer.py = this.cssH * 0.4;

    this.zone.runOutsideAngular(() => {
      this.running = true;
      const tick = () => {
        if (!this.running) return;
        this.step();
        this.draw();
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    });

    if (this.servicesRef) {
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) this.servicesIn = true;
        },
        { threshold: 0.28 }
      );
      this.observer.observe(this.servicesRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.observer?.disconnect();
  }

  onLogoClick(): void {}
  openHelp(): void {
    this.helpOpen = true;
    if (this.chatLog.length === 0) {
      this.chatStep = 0;
      this.chatLog = [
        { from: 'bot', text: 'How can I help you?' },
      ];
    }
  }
  closeHelp(): void {
    this.helpOpen = false;
  }
  keepCard(): void {}
  hideCard(): void { this.activeCard = null; }

  goTo(id: 'services' | 'contact'): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  sendWhatsApp(text: string): void {
    const msg = (text || 'Hello').trim();
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  }

  onHelpSend(box: HTMLTextAreaElement): void {
    const text = (box.value || '').trim();
    if (!text) return;
    this.chatLog = [...this.chatLog, { from: 'user', text }];

    const yes = /^(yes|yeah|yep|y|ok|okay|sure|haan|han|ji|please)\b/i.test(text);

    if (this.chatStep === 0) {
      this.chatStep = 1;
      this.chatLog = [
        ...this.chatLog,
        { from: 'bot', text: 'Would you like to talk to a human?' },
      ];
      return;
    }

    if (yes) {
      this.chatLog = [
        ...this.chatLog,
        { from: 'bot', text: 'Connecting you to a human on WhatsApp…' },
      ];
      const history = this.chatLog
        .filter((m) => m.from === 'user')
        .map((m) => m.text)
        .join(' | ');
      this.sendWhatsApp(history);
      return;
    }

    this.chatLog = [
      ...this.chatLog,
      { from: 'bot', text: 'No problem. Type Yes if you want to talk to a human.' },
    ];
  }

  showCard(item: ServiceCard): void { this.activeCard = item; }
  onViewDetails(_item: ServiceCard): void {}

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    if (t.closest('.helper-bot') || t.closest('.help-panel')) return;
    this.helpOpen = false;
  }

  @HostListener('window:resize')
  onResize(): void { this.resize(); }

  @HostListener('window:mousemove', ['$event'])
  onMove(e: MouseEvent): void {
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
  }

  @HostListener('window:touchmove', ['$event'])
  onTouch(e: TouchEvent): void {
    if (!e.touches.length) return;
    this.pointer.x = e.touches[0].clientX;
    this.pointer.y = e.touches[0].clientY;
  }

  private resize(): void {
    const canvas = this.canvasRef.nativeElement;
    this.cssW = window.innerWidth;
    this.cssH = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(this.cssW * this.dpr);
    canvas.height = Math.floor(this.cssH * this.dpr);
    canvas.style.width = this.cssW + 'px';
    canvas.style.height = this.cssH + 'px';
    this.ctx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private step(): void {
    const dx = this.pointer.x - this.pointer.px;
    const dy = this.pointer.y - this.pointer.py;
    const dist = Math.hypot(dx, dy);
    this.emitAcc += dist;

    if (this.emitAcc > 14) {
      this.emitAcc = 0;
      this.ripples.push({
        x: this.pointer.x,
        y: this.pointer.y,
        r: 4,
        life: 1,
        max: 28 + Math.min(dist, 18),
      });
      if (this.sparks.length < 40) {
        this.sparks.push({
          x: this.pointer.x,
          y: this.pointer.y,
          vx: -dx * 0.08 + (Math.random() - 0.5) * 0.6,
          vy: -dy * 0.08 + (Math.random() - 0.5) * 0.6,
          life: 1,
        });
      }
    }

    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.r += 0.85;
      r.life -= 0.018;
      if (r.life <= 0 || r.r > r.max) this.ripples.splice(i, 1);
    }
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.03;
      if (s.life <= 0) this.sparks.splice(i, 1);
    }

    this.pointer.px = this.pointer.x;
    this.pointer.py = this.pointer.y;
  }

  private draw(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, this.cssW, this.cssH);

    for (const r of this.ripples) {
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 0, 0, ${0.55 * r.life})`;
      ctx.lineWidth = 1.4 * r.life;
      ctx.stroke();
    }

    for (const s of this.sparks) {
      ctx.fillStyle = `rgba(0, 0, 0, ${0.5 * s.life})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 1.4 * s.life, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(this.pointer.x, this.pointer.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.stroke();
  }
}
