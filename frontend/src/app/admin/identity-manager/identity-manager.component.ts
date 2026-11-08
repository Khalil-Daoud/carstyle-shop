import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BrandService, ClientConfig } from '../../services/brand.service';
import { DEFAULT_HERO, HeroSettings, SettingsService } from '../../services/settings.service';
import { ApiService } from '../../services/api.service';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';

@Component({
  selector: 'app-identity-manager',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule, ImageUrlPipe
  ],
  template: `
    <div class="id-page fade-in" *ngIf="form">
      <aside class="preview">
        <p class="eyebrow">Aperçu boutique</p>
        <div class="preview-card" [style.--swatch]="form.colors.primary" [style.background]="form.colors.secondary">
          <img *ngIf="form.brand.logo" [src]="form.brand.logo | imageUrl" [alt]="form.brand.name">
          <strong>{{ form.brand.nameStart || form.brand.name }}<span *ngIf="form.brand.nameAccent">{{ form.brand.nameAccent }}</span></strong>
          <small>{{ form.copy.tagline || 'Slogan de la boutique' }}</small>
        </div>
        <div class="swatches">
          <span><i [style.background]="form.colors.primary"></i> Accent</span>
          <span><i [style.background]="form.colors.primaryHover"></i> Survol</span>
          <span><i [style.background]="form.colors.secondary"></i> Fond</span>
        </div>
        <p class="hint">Les changements s’affichent sur tout le site dès l’enregistrement, y compris le bandeau d’accueil.</p>
      </aside>

      <div class="forms">
        <section class="panel">
          <header>
            <mat-icon>image</mat-icon>
            <div>
              <h2>Page d’accueil</h2>
              <p>Bandeau plein écran, idéalement 2000 × 1200 px.</p>
            </div>
          </header>
          <div class="hero-body">
            <div class="hero-preview" *ngIf="hero.type === 'video' && hero.videoUrl">
              <video [src]="hero.videoUrl | imageUrl" [poster]="hero.posterUrl | imageUrl" muted loop playsinline controls></video>
            </div>
            <div class="hero-preview" *ngIf="hero.type === 'image' && hero.imageUrl">
              <img [src]="hero.imageUrl | imageUrl" alt="Aperçu du bandeau">
            </div>
            <div class="hero-controls">
              <div class="choice-row">
                <button type="button" class="choice" [class.on]="hero.type === 'video'" (click)="hero.type = 'video'">
                  <mat-icon>movie</mat-icon>
                  <span><strong>Vidéo</strong><small>Lecture en boucle, muette</small></span>
                </button>
                <button type="button" class="choice" [class.on]="hero.type === 'image'" (click)="hero.type = 'image'">
                  <mat-icon>image</mat-icon>
                  <span><strong>Image</strong><small>Photo fixe, plus légère</small></span>
                </button>
              </div>
              <input #heroVideoInput type="file" accept="video/mp4,video/webm,video/quicktime" hidden (change)="onHeroFile($event, 'video')">
              <input #heroImageInput type="file" accept="image/*" hidden (change)="onHeroFile($event, 'image')">
              <div class="hero-actions">
                <button *ngIf="hero.type === 'video'" type="button" mat-stroked-button [disabled]="uploadingHero" (click)="heroVideoInput.click()">
                  <mat-icon>upload</mat-icon> {{ uploadingHero ? 'Envoi…' : 'Choisir une vidéo' }}
                </button>
                <button type="button" mat-stroked-button [disabled]="uploadingHero" (click)="heroImageInput.click()">
                  <mat-icon>photo</mat-icon>
                  {{ uploadingHero ? 'Envoi…' : (hero.type === 'video' ? 'Image d’attente' : 'Choisir une image') }}
                </button>
              </div>
              <p class="hint">MP4 ou WebM jusqu’à 40 Mo. JPG ou PNG pour une image.</p>
              <div class="hero-actions">
                <button mat-flat-button color="primary" [disabled]="savingHero || uploadingHero" (click)="saveHero()">
                  Enregistrer le bandeau
                </button>
                <button mat-stroked-button type="button" [disabled]="savingHero" (click)="resetHero()">
                  Vidéo d’origine
                </button>
              </div>
            </div>
          </div>
        </section>

        <section class="panel">
          <header>
            <mat-icon>storefront</mat-icon>
            <div>
              <h2>Marque</h2>
              <p>Nom affiché, logo et mentions légales.</p>
            </div>
          </header>
          <div class="grid">
            <label>Nom de la boutique
              <input [(ngModel)]="form.brand.name" maxlength="80">
            </label>
            <label>Nom légal
              <input [(ngModel)]="form.brand.legalName" maxlength="80">
            </label>
            <label>Début du logo texte
              <input [(ngModel)]="form.brand.nameStart" maxlength="40" placeholder="CAR">
            </label>
            <label>Accent du logo
              <input [(ngModel)]="form.brand.nameAccent" maxlength="40" placeholder="STYLE">
            </label>
          </div>
          <div class="logo-row">
            <img *ngIf="form.brand.logo" [src]="form.brand.logo | imageUrl" alt="Logo" class="logo-preview">
            <div>
              <input #logoInput type="file" accept="image/png,image/jpeg,image/webp" hidden (change)="onImage($event, 'logo')">
              <button type="button" mat-stroked-button [disabled]="uploading === 'logo'" (click)="logoInput.click()">
                <mat-icon>upload</mat-icon> {{ uploading === 'logo' ? 'Envoi…' : 'Choisir un logo' }}
              </button>
              <p class="hint">PNG, JPG ou WebP. Carré de préférence.</p>
            </div>
          </div>
        </section>

        <section class="panel">
          <header>
            <mat-icon>palette</mat-icon>
            <div>
              <h2>Couleurs</h2>
              <p>Accent des boutons, survol, et fond sombre.</p>
            </div>
          </header>
          <div class="colors">
            <label>Principale
              <span class="color-line">
                <input type="color" [(ngModel)]="form.colors.primary">
                <input [(ngModel)]="form.colors.primary" maxlength="7">
              </span>
            </label>
            <label>Survol
              <span class="color-line">
                <input type="color" [(ngModel)]="form.colors.primaryHover">
                <input [(ngModel)]="form.colors.primaryHover" maxlength="7">
              </span>
            </label>
            <label>Secondaire
              <span class="color-line">
                <input type="color" [(ngModel)]="form.colors.secondary">
                <input [(ngModel)]="form.colors.secondary" maxlength="7">
              </span>
            </label>
          </div>
          <button type="button" class="linkish" (click)="autoHover()">Calculer le survol à partir de la couleur principale</button>
        </section>

        <section class="panel">
          <header>
            <mat-icon>call</mat-icon>
            <div>
              <h2>Contact</h2>
              <p>Coordonnées affichées au pied de page et sur la page contact.</p>
            </div>
          </header>
          <div class="grid">
            <label>E-mail
              <input [(ngModel)]="form.contact.email" type="email">
            </label>
            <label>E-mail commandes
              <input [(ngModel)]="form.contact.emailOrders" type="email">
            </label>
            <label>Téléphone affiché
              <input [(ngModel)]="form.contact.phoneDisplay" placeholder="+216 00 000 000">
            </label>
            <label>WhatsApp (chiffres, indicatif pays)
              <input [(ngModel)]="form.contact.whatsapp" placeholder="21600000000">
            </label>
            <label>Libellé WhatsApp
              <input [(ngModel)]="form.contact.whatsappLabel">
            </label>
            <label>Horaires
              <input [(ngModel)]="form.contact.hours">
            </label>
            <label>Adresse (ligne 1)
              <input [(ngModel)]="form.contact.addressLine1">
            </label>
            <label>Adresse (ligne 2)
              <input [(ngModel)]="form.contact.addressLine2">
            </label>
            <label>Ville
              <input [(ngModel)]="form.contact.city">
            </label>
            <label>Pays
              <input [(ngModel)]="form.contact.country">
            </label>
          </div>
        </section>

        <section class="panel">
          <header>
            <mat-icon>share</mat-icon>
            <div>
              <h2>Réseaux sociaux</h2>
              <p>Laissez vide pour masquer le lien.</p>
            </div>
          </header>
          <div class="grid">
            <label>Facebook
              <input [(ngModel)]="form.social.facebook" placeholder="https://">
            </label>
            <label>Instagram
              <input [(ngModel)]="form.social.instagram" placeholder="https://">
            </label>
          </div>
        </section>

        <section class="panel">
          <header>
            <mat-icon>title</mat-icon>
            <div>
              <h2>Textes de la vitrine</h2>
              <p>Accueil, atelier, avis, newsletter, fiche produit.</p>
            </div>
          </header>
          <div class="grid">
            <label>Slogan
              <input [(ngModel)]="form.copy.tagline">
            </label>
            <label>Titre hero
              <input [(ngModel)]="form.copy.heroTitle">
            </label>
            <label>Titre hero (emphase)
              <input [(ngModel)]="form.copy.heroTitleEm">
            </label>
            <label class="wide">Sous-titre hero
              <textarea rows="3" [(ngModel)]="form.copy.heroSubtitle"></textarea>
            </label>
            <label>Bandeau : livraison
              <input [(ngModel)]="form.copy.topbarShipping">
            </label>
            <label>Bandeau : paiement
              <input [(ngModel)]="form.copy.topbarPayment">
            </label>
            <label>Atelier — surtitre
              <input [(ngModel)]="form.copy.atelierEyebrow">
            </label>
            <label>Atelier — titre
              <input [(ngModel)]="form.copy.atelierTitle">
            </label>
            <label class="wide">Atelier — texte
              <textarea rows="3" [(ngModel)]="form.copy.atelierBody"></textarea>
            </label>
            <label class="wide">Atelier — puces (une par ligne)
              <textarea rows="4" [(ngModel)]="bulletsText"></textarea>
            </label>
            <label>Avis — titre
              <input [(ngModel)]="form.copy.reviewsTitle">
            </label>
            <label>Newsletter — titre
              <input [(ngModel)]="form.copy.newsletterTitle">
            </label>
            <label class="wide">Newsletter — texte
              <textarea rows="2" [(ngModel)]="form.copy.newsletterBody"></textarea>
            </label>
            <label class="wide">Pied de page
              <textarea rows="2" [(ngModel)]="form.copy.footerBlurb"></textarea>
            </label>
            <label>Pied de page — retrait
              <input [(ngModel)]="form.copy.footerCertPickup">
            </label>
            <label>Copyright
              <input [(ngModel)]="form.copy.copyrightExtra">
            </label>
            <label>Contact — titre
              <input [(ngModel)]="form.copy.contactTitle">
            </label>
            <label class="wide">Contact — intro
              <textarea rows="2" [(ngModel)]="form.copy.contactIntro"></textarea>
            </label>
            <label>Fiche produit — retrait
              <input [(ngModel)]="form.copy.trustPickupTitle">
            </label>
            <label>Fiche produit — sous-titre retrait
              <input [(ngModel)]="form.copy.trustPickupSub">
            </label>
            <label>Engagement — titre
              <input [(ngModel)]="form.copy.engagementTitle">
            </label>
            <label class="wide">Engagement — texte
              <textarea rows="2" [(ngModel)]="form.copy.engagementBody"></textarea>
            </label>
            <label class="wide">Sous-titre avis
              <input [(ngModel)]="form.copy.reviewSubtitle">
            </label>
          </div>
          <div class="logo-row">
            <img *ngIf="form.copy.atelierImage" [src]="form.copy.atelierImage | imageUrl" alt="Atelier" class="atelier-preview">
            <div>
              <input #atelierInput type="file" accept="image/png,image/jpeg,image/webp" hidden (change)="onImage($event, 'atelier')">
              <button type="button" mat-stroked-button [disabled]="uploading === 'atelier'" (click)="atelierInput.click()">
                <mat-icon>photo</mat-icon> {{ uploading === 'atelier' ? 'Envoi…' : 'Image atelier' }}
              </button>
            </div>
          </div>
        </section>

        <section class="panel">
          <header>
            <mat-icon>search</mat-icon>
            <div>
              <h2>Référencement</h2>
              <p>Titre de l’onglet et description Google.</p>
            </div>
          </header>
          <div class="grid">
            <label class="wide">Titre SEO
              <input [(ngModel)]="form.copy.seoTitle">
            </label>
            <label class="wide">Description SEO
              <textarea rows="3" [(ngModel)]="form.copy.seoDescription"></textarea>
            </label>
            <label class="wide">Mots-clés
              <input [(ngModel)]="form.copy.seoKeywords">
            </label>
          </div>
        </section>

        <div class="save-bar">
          <button mat-flat-button color="primary" [disabled]="saving" (click)="save()">
            {{ saving ? 'Enregistrement…' : 'Enregistrer l’identité' }}
          </button>
          <button mat-stroked-button type="button" [disabled]="saving" (click)="reset()">Annuler</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .id-page {
      display: grid;
      grid-template-columns: minmax(240px, 300px) 1fr;
      gap: 22px;
      align-items: start;
      padding-bottom: 40px;
    }
    .preview { position: sticky; top: 96px; }
    .eyebrow {
      margin: 0 0 10px; font-size: 0.68rem; letter-spacing: 2.5px; text-transform: uppercase;
      color: var(--luxe-gold); font-weight: 700;
    }
    .preview-card {
      border-radius: 18px; padding: 28px 22px; color: #fff; text-align: center;
      min-height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
    }
    .preview-card img { width: 56px; height: 56px; object-fit: contain; border-radius: 12px; background: #fff; }
    .preview-card strong { font-family: var(--font-heading); font-size: 1.35rem; letter-spacing: 1px; }
    .preview-card strong span { color: var(--swatch, var(--luxe-gold)); }
    .preview-card small { color: rgba(255,255,255,0.72); font-size: 0.82rem; line-height: 1.4; }
    .swatches { display: flex; flex-direction: column; gap: 8px; margin: 14px 0; font-size: 0.8rem; color: var(--luxe-text-muted); }
    .swatches span { display: flex; align-items: center; gap: 8px; }
    .swatches i { width: 18px; height: 18px; border-radius: 50%; border: 1px solid var(--luxe-border); display: inline-block; }
    .hint { margin: 0; font-size: 0.8rem; color: var(--luxe-text-muted); line-height: 1.5; }
    .forms { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
    .panel {
      background: #fff; border: 1px solid var(--luxe-border); border-radius: 18px;
      padding: 20px 22px 22px; box-shadow: 0 8px 24px rgba(10,10,10,0.04);
    }
    .panel header { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
    .panel header mat-icon { color: var(--luxe-gold); }
    .panel h2 { margin: 0 0 2px; font-family: var(--font-heading); font-size: 1.05rem; font-weight: 600; }
    .panel header p { margin: 0; font-size: 0.82rem; color: var(--luxe-text-muted); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
    .grid label, .colors label {
      display: flex; flex-direction: column; gap: 6px;
      font-size: 0.78rem; font-weight: 600; color: var(--luxe-charcoal);
    }
    .wide { grid-column: 1 / -1; }
    input, textarea {
      font: inherit; font-weight: 400; padding: 10px 12px; border-radius: 10px;
      border: 1px solid var(--luxe-border); background: #fff; color: var(--luxe-black);
    }
    textarea { resize: vertical; }
    .colors { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .color-line { display: flex; gap: 8px; align-items: center; }
    .color-line input[type="color"] { width: 44px; height: 38px; padding: 0; border: none; background: none; cursor: pointer; }
    .color-line input[type="text"], .color-line input:not([type="color"]) { flex: 1; }
    .linkish {
      margin-top: 12px; border: 0; background: none; padding: 0; cursor: pointer;
      color: var(--luxe-gold); font-size: 0.82rem; font-weight: 600;
    }
    .hero-preview {
      margin: 0 0 14px; border-radius: 12px; overflow: hidden;
      background: #111; aspect-ratio: 16 / 9; max-height: 240px;
      border: 1px solid var(--luxe-border);
    }
    .hero-preview video, .hero-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .hero-actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 8px 0; }
    .choice-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
    .choice {
      display: flex; align-items: center; gap: 12px; text-align: left;
      padding: 14px 16px; border-radius: 12px; cursor: pointer;
      border: 1px solid var(--luxe-border); background: #fff; font-family: var(--font-body);
    }
    .choice span { display: flex; flex-direction: column; gap: 2px; }
    .choice strong { font-size: 0.92rem; }
    .choice small { font-size: 0.78rem; color: var(--luxe-text-muted); font-weight: 400; }
    .choice.on { border-color: var(--luxe-black); background: var(--luxe-offwhite); }
    .choice.on mat-icon { color: var(--luxe-gold); }
    .logo-row { display: flex; gap: 16px; align-items: center; margin-top: 16px; }
    .logo-preview { width: 64px; height: 64px; object-fit: contain; border-radius: 12px; border: 1px solid var(--luxe-border); background: #fafafa; }
    .atelier-preview { width: 120px; height: 72px; object-fit: cover; border-radius: 12px; border: 1px solid var(--luxe-border); }
    .save-bar { display: flex; gap: 10px; position: sticky; bottom: 12px; background: rgba(255,255,255,0.92); padding: 12px; border-radius: 14px; }
    @media (max-width: 960px) {
      .id-page, .grid, .colors, .choice-row { grid-template-columns: 1fr; }
      .preview { position: static; }
    }
  `]
})
export class IdentityManagerComponent implements OnInit {
  form: ClientConfig | null = null;
  bulletsText = '';
  saving = false;
  uploading: 'logo' | 'atelier' | null = null;
  hero: HeroSettings = { ...DEFAULT_HERO };
  savingHero = false;
  uploadingHero = false;

  constructor(
    private brand: BrandService,
    private settings: SettingsService,
    private api: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.reset();
    this.settings.hero$.subscribe((hero) => {
      this.hero = { ...DEFAULT_HERO, ...hero };
    });
  }

  reset() {
    this.form = this.brand.snapshot();
    this.form.copy = this.form.copy || {};
    this.form.social = { facebook: '', instagram: '', ...(this.form.social || {}) };
    this.form.contact = this.form.contact || this.brand.contact;
    this.bulletsText = (this.form.copy.atelierBullets || []).join('\n');
  }

  autoHover() {
    if (!this.form) return;
    this.form.colors.primaryHover = darken(this.form.colors.primary, 0.82);
  }

  onImage(event: Event, kind: 'logo' | 'atelier') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.form) return;
    const data = new FormData();
    data.append('image', file);
    this.uploading = kind;
    this.api.post<{ url: string }>('uploads', data).subscribe({
      next: (res) => {
        this.uploading = null;
        if (kind === 'logo') this.form!.brand.logo = res.url;
        else this.form!.copy.atelierImage = res.url;
        this.snackBar.open('Image envoyée', 'OK', { duration: 2200 });
      },
      error: (err) => {
        this.uploading = null;
        this.snackBar.open(err?.error?.message || 'Envoi impossible', 'Fermer', { duration: 4000 });
      }
    });
    input.value = '';
  }

  onHeroFile(event: Event, kind: 'video' | 'image') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    this.uploadingHero = true;
    this.api.post<{ url: string; kind: string }>('uploads/hero', formData).subscribe({
      next: (res) => {
        this.uploadingHero = false;
        if (res.kind === 'video') {
          this.hero.type = 'video';
          this.hero.videoUrl = res.url;
        } else if (kind === 'video') {
          this.hero.posterUrl = res.url;
        } else {
          this.hero.imageUrl = res.url;
          if (this.hero.type === 'image') this.hero.posterUrl = res.url;
        }
        this.snackBar.open(res.kind === 'video' ? 'Vidéo envoyée' : 'Image envoyée', 'OK', { duration: 2500 });
      },
      error: (err) => {
        this.uploadingHero = false;
        this.snackBar.open(err?.error?.message || 'Envoi impossible', 'Fermer', { duration: 4000 });
      }
    });
    input.value = '';
  }

  saveHero() {
    this.savingHero = true;
    this.settings.save({ hero: this.hero }).then(() => {
      this.savingHero = false;
      this.snackBar.open('Bandeau d’accueil enregistré', 'OK', { duration: 3000 });
    }).catch((err) => {
      this.savingHero = false;
      this.snackBar.open(err?.error?.message || 'Enregistrement impossible', 'Fermer', { duration: 4000 });
    });
  }

  resetHero() {
    this.hero = { ...DEFAULT_HERO };
    this.saveHero();
  }

  save() {
    if (!this.form || this.saving) return;
    this.form.copy.atelierBullets = this.bulletsText.split('\n').map((line) => line.trim()).filter(Boolean);
    this.saving = true;
    this.settings.save({ identity: this.form }).then(() => {
      this.saving = false;
      this.reset();
      this.snackBar.open('Identité enregistrée — le site utilise déjà ces valeurs', 'OK', { duration: 3500 });
    }).catch((err) => {
      this.saving = false;
      this.snackBar.open(err?.error?.message || 'Enregistrement impossible', 'Fermer', { duration: 4500 });
    });
  }
}

function darken(hex: string, factor: number): string {
  const raw = String(hex || '').replace('#', '');
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return '#b00321';
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
