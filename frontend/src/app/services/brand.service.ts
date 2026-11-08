import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ClientCopy {
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  tagline?: string;
  heroTitle?: string;
  heroTitleEm?: string;
  heroSubtitle?: string;
  heroAria?: string;
  topbarShipping?: string;
  topbarPayment?: string;
  atelierEyebrow?: string;
  atelierTitle?: string;
  atelierBody?: string;
  atelierImage?: string;
  atelierBullets?: string[];
  reviewsTitle?: string;
  newsletterTitle?: string;
  newsletterBody?: string;
  footerBlurb?: string;
  footerCertPickup?: string;
  copyrightExtra?: string;
  contactTitle?: string;
  contactIntro?: string;
  trustPickupTitle?: string;
  trustPickupSub?: string;
  engagementTitle?: string;
  engagementBody?: string;
  reviewSubtitle?: string;
}

export interface ClientConfig {
  slug: string;
  brand: {
    name: string;
    nameStart?: string;
    nameAccent?: string;
    legalName?: string;
    logo: string;
  };
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
  };
  contact: {
    email: string;
    emailOrders?: string;
    phoneDisplay: string;
    whatsapp: string;
    whatsappLabel: string;
    hours: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    country: string;
  };
  social: {
    facebook?: string;
    instagram?: string;
  };
  copy: ClientCopy;
}

const FALLBACK: ClientConfig = {
  slug: 'shopkit',
  brand: { name: 'Boutique', logo: 'assets/logo.webp' },
  colors: { primary: '#D90429', primaryHover: '#b00321', secondary: '#0a0a0a' },
  contact: {
    email: 'contact@example.com',
    phoneDisplay: '',
    whatsapp: '',
    whatsappLabel: 'WhatsApp',
    hours: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    country: ''
  },
  social: {},
  copy: {}
};

@Injectable({ providedIn: 'root' })
export class BrandService {
  private cfg: ClientConfig = FALLBACK;

  constructor(private http: HttpClient) {}

  get c(): ClientConfig { return this.cfg; }
  get name(): string { return this.cfg.brand.name; }
  get legalName(): string { return this.cfg.brand.legalName || this.cfg.brand.name; }
  get nameStart(): string { return this.cfg.brand.nameStart || this.cfg.brand.name; }
  get nameAccent(): string { return this.cfg.brand.nameAccent || ''; }
  get logoUrl(): string { return this.cfg.brand.logo || 'assets/logo.webp'; }
  get slug(): string { return this.cfg.slug || 'shopkit'; }
  get copy(): ClientCopy { return this.cfg.copy || {}; }
  get contact() { return this.cfg.contact; }
  get social() { return this.cfg.social || {}; }
  get whatsappUrl(): string {
    const digits = String(this.cfg.contact.whatsapp || '').replace(/\D/g, '');
    return digits ? `https://wa.me/${digits}` : '#';
  }
  get year(): number { return new Date().getFullYear(); }

  async load(): Promise<void> {
    try {
      this.cfg = await firstValueFrom(this.http.get<ClientConfig>('assets/client.config.json'));
    } catch {
      this.cfg = FALLBACK;
    }
    this.applyTheme();
    this.applyMeta();
  }

  applyConfig(next?: Partial<ClientConfig> | null) {
    if (!next) return;
    this.cfg = {
      ...this.cfg,
      ...next,
      slug: next.slug || this.cfg.slug,
      brand: { ...this.cfg.brand, ...(next.brand || {}) },
      colors: { ...this.cfg.colors, ...(next.colors || {}) },
      contact: { ...this.cfg.contact, ...(next.contact || {}) },
      social: { ...this.cfg.social, ...(next.social || {}) },
      copy: { ...this.cfg.copy, ...(next.copy || {}) }
    };
    this.applyTheme();
    this.applyMeta();
  }

  snapshot(): ClientConfig {
    return JSON.parse(JSON.stringify(this.cfg));
  }

  applyTheme() {
    const root = document.documentElement;
    const { primary, primaryHover, secondary } = this.cfg.colors;
    root.style.setProperty('--luxe-gold', primary);
    root.style.setProperty('--luxe-gold-hover', primaryHover);
    root.style.setProperty('--luxe-gold-soft', hexToRgba(primary, 0.14));
    root.style.setProperty('--luxe-black', secondary);
    root.style.setProperty('--luxe-focus', primary);
  }

  applyMeta() {
    const title = this.copy.seoTitle || this.name;
    document.title = title;
    setMeta('description', this.copy.seoDescription);
    setMeta('keywords', this.copy.seoKeywords);
    setMeta('theme-color', this.cfg.colors.secondary, 'theme-color');
  }
}

function setMeta(name: string, content?: string, attr: 'name' | 'theme-color' = 'name') {
  if (!content) return;
  const selector = attr === 'theme-color' ? 'meta[name="theme-color"]' : `meta[name="${name}"]`;
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function hexToRgba(hex: string, alpha: number): string {
  const h = String(hex || '').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return `rgba(217, 4, 41, ${alpha})`;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
