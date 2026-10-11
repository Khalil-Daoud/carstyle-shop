import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CrudService } from '../services/crud.service';
import { CategoryCount } from '../services/catalog.types';
import { ProductCardComponent } from '../components/product-card/product-card.component';
import { ImageUrlPipe } from '../pipes/image-url.pipe';
import { HeroSettings, SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatSnackBarModule, ProductCardComponent, ImageUrlPipe],
  template: `
    <div class="home-wrapper">
      <!-- HERO -->
      <section class="luxe-hero">
        <div class="luxe-hero-media">
          <video
            *ngIf="hero.type === 'video'"
            class="hero-media"
            [src]="hero.videoUrl | imageUrl"
            [poster]="hero.posterUrl | imageUrl"
            autoplay muted loop playsinline
            aria-label="Atelier Carstyle Le Bardo">
          </video>
          <img
            *ngIf="hero.type === 'image'"
            class="hero-media"
            [src]="hero.imageUrl | imageUrl"
            alt="Carstyle Le Bardo">
        </div>
        <div class="luxe-hero-overlay"></div>
        <div class="luxe-hero-content">
          <span class="luxe-hero-tag">CARSTYLE — LE BARDO</span>
          <h1 class="luxe-hero-title">Accessoires<br><em>auto</em></h1>
          <p class="luxe-hero-sub">Entretien, detailing et accessoires pour habiller, protéger et personnaliser votre voiture. Livraison partout en Tunisie.</p>
          <div class="luxe-hero-cta">
            <button mat-flat-button color="primary" routerLink="/collection">DÉCOUVRIR LA BOUTIQUE</button>
            <a class="luxe-hero-link" routerLink="/collection" [queryParams]="{cat: 'Accessoires Intérieur'}">Nos accessoires <mat-icon>arrow_forward</mat-icon></a>
          </div>
        </div>
        <div class="luxe-hero-stats">
          <div class="stat"><span class="stat-num">+50</span><span class="stat-label">Références</span></div>
          <div class="stat"><span class="stat-num">48h</span><span class="stat-label">Livraison Tunisie</span></div>
          <div class="stat"><span class="stat-num">TND</span><span class="stat-label">Prix en dinars</span></div>
        </div>
      </section>

      <!-- USPs -->
      <section class="luxe-usps">
        <div class="luxe-usps-grid container">
          <div class="usp">
            <mat-icon>local_shipping</mat-icon>
            <div><strong>Livraison partout</strong><span>En Tunisie en 48h</span></div>
          </div>
          <div class="usp">
            <mat-icon>verified_user</mat-icon>
            <div><strong>Paiement sécurisé</strong><span>Transaction protégée</span></div>
          </div>
          <div class="usp">
            <mat-icon>verified</mat-icon>
            <div><strong>Marques pro</strong><span>Detailing & accessoires</span></div>
          </div>
          <div class="usp">
            <mat-icon>support_agent</mat-icon>
            <div><strong>Conseils atelier</strong><span>Une équipe à Le Bardo</span></div>
          </div>
        </div>
      </section>

      <section class="luxe-brands">
        <div class="container luxe-brands-row">
          <span>Carstyle</span><span>Universel</span><span>Atelier</span><span>Pro Detailing</span><span>Pro Line</span>
        </div>
      </section>

      <!-- CATEGORIES -->
      <section class="luxe-categories container">
        <div class="luxe-sec-head">
          <span class="luxe-sec-eyebrow">Catégories</span>
          <h2 class="luxe-sec-title">Explorez la boutique</h2>
          <div class="luxe-sec-line"></div>
        </div>
        <div class="luxe-cat-grid stagger" *ngIf="categories.length">
          <a class="luxe-cat-tile" *ngFor="let cat of categories" [routerLink]="['/collection']" [queryParams]="{cat: cat.name}">
            <img [src]="cat.image | imageUrl" [alt]="cat.name" loading="lazy">
            <div class="luxe-cat-shade"></div>
            <div class="luxe-cat-info">
              <span class="luxe-cat-name">{{ cat.name }}</span>
              <span class="luxe-cat-link">Découvrir <mat-icon>arrow_forward</mat-icon></span>
            </div>
          </a>
        </div>
      </section>

      <!-- PRODUITS VEDETTES -->
      <section class="luxe-featured">
        <div class="container">
          <div class="luxe-sec-head">
            <span class="luxe-sec-eyebrow">TOP</span>
            <h2 class="luxe-sec-title">Meilleures ventes</h2>
            <div class="luxe-sec-line"></div>
          </div>
          <div class="luxe-prod-grid stagger">
            <app-product-card *ngFor="let product of products" [product]="product"></app-product-card>
          </div>
          <div class="luxe-see-all">
            <button mat-stroked-button routerLink="/collection">VOIR TOUTE LA COLLECTION</button>
          </div>
        </div>
      </section>

      <!-- NETTOYAGE -->
      <section class="luxe-featured luxe-cat-block" *ngIf="cleaning.length">
        <div class="container">
          <div class="luxe-sec-head luxe-sec-split">
            <div>
              <span class="luxe-sec-eyebrow">Nettoyage</span>
              <h2 class="luxe-sec-title">Detailing & entretien</h2>
            </div>
            <a class="luxe-hero-link dark" routerLink="/collection" [queryParams]="{cat: 'Nettoyage & Detailing'}">Découvrir <mat-icon>arrow_forward</mat-icon></a>
          </div>
          <div class="luxe-prod-grid stagger">
            <app-product-card *ngFor="let product of cleaning" [product]="product"></app-product-card>
          </div>
        </div>
      </section>

      <!-- ACCESSOIRES -->
      <section class="luxe-featured luxe-cat-block" *ngIf="interior.length">
        <div class="container">
          <div class="luxe-sec-head luxe-sec-split">
            <div>
              <span class="luxe-sec-eyebrow">Accessoires</span>
              <h2 class="luxe-sec-title">Confort à bord</h2>
            </div>
            <a class="luxe-hero-link dark" routerLink="/collection" [queryParams]="{cat: 'Accessoires Intérieur'}">Découvrir <mat-icon>arrow_forward</mat-icon></a>
          </div>
          <div class="luxe-prod-grid stagger">
            <app-product-card *ngFor="let product of interior" [product]="product"></app-product-card>
          </div>
        </div>
      </section>

      <section class="luxe-featured luxe-cat-block" *ngIf="exterior.length">
        <div class="container">
          <div class="luxe-sec-head luxe-sec-split">
            <div>
              <span class="luxe-sec-eyebrow">Extérieur</span>
              <h2 class="luxe-sec-title">Protection & style</h2>
            </div>
            <a class="luxe-hero-link dark" routerLink="/collection" [queryParams]="{cat: 'Accessoires Extérieur'}">Découvrir <mat-icon>arrow_forward</mat-icon></a>
          </div>
          <div class="luxe-prod-grid stagger">
            <app-product-card *ngFor="let product of exterior" [product]="product"></app-product-card>
          </div>
        </div>
      </section>

      <section class="luxe-featured luxe-cat-block" *ngIf="entretien.length">
        <div class="container">
          <div class="luxe-sec-head luxe-sec-split">
            <div>
              <span class="luxe-sec-eyebrow">Entretien</span>
              <h2 class="luxe-sec-title">Moteur & additifs</h2>
            </div>
            <a class="luxe-hero-link dark" routerLink="/collection" [queryParams]="{cat: 'Entretien'}">Découvrir <mat-icon>arrow_forward</mat-icon></a>
          </div>
          <div class="luxe-prod-grid stagger">
            <app-product-card *ngFor="let product of entretien" [product]="product"></app-product-card>
          </div>
        </div>
      </section>

      <section class="luxe-featured luxe-cat-block" *ngIf="electronics.length">
        <div class="container">
          <div class="luxe-sec-head luxe-sec-split">
            <div>
              <span class="luxe-sec-eyebrow">Électronique</span>
              <h2 class="luxe-sec-title">À bord</h2>
            </div>
            <a class="luxe-hero-link dark" routerLink="/collection" [queryParams]="{cat: 'Électronique'}">Découvrir <mat-icon>arrow_forward</mat-icon></a>
          </div>
          <div class="luxe-prod-grid stagger">
            <app-product-card *ngFor="let product of electronics" [product]="product"></app-product-card>
          </div>
        </div>
      </section>

      <!-- ATELIER -->
      <section class="luxe-atelier">
        <div class="luxe-atelier-grid">
          <div class="luxe-atelier-media">
            <img src="assets/covering.webp" alt="Atelier Carstyle Le Bardo">
          </div>
          <div class="luxe-atelier-body">
            <span class="luxe-sec-eyebrow">Le Bardo</span>
            <h2 class="luxe-atelier-title">L'atelier Carstyle</h2>
            <p>Boutique tunisienne d'accessoires auto, detailing et entretien. Nous sélectionnons des produits utiles, durables, au bon prix — pour habiller et protéger votre véhicule au quotidien.</p>
            <ul class="luxe-atelier-list">
              <li><mat-icon>check_circle</mat-icon> Accessoires intérieur & extérieur</li>
              <li><mat-icon>check_circle</mat-icon> Detailing et produits d'entretien</li>
              <li><mat-icon>check_circle</mat-icon> Conseil et retrait à Le Bardo</li>
            </ul>
            <button mat-button class="luxe-text-link" routerLink="/contact">NOUS CONTACTER <mat-icon>east</mat-icon></button>
          </div>
        </div>
      </section>

      <!-- TÉMOIGNAGE -->
      <section class="luxe-quote container">
        <mat-icon class="luxe-quote-mark">format_quote</mat-icon>
        <blockquote>« Très bon service, commande rapide et accessoires de qualité. L'équipe Carstyle au Bardo est au top. »</blockquote>
        <div class="luxe-quote-author">
          <span class="luxe-quote-name">Amine K.</span>
          <span class="luxe-quote-role">Client fidèle</span>
          <div class="luxe-stars">
            <mat-icon>star</mat-icon><mat-icon>star</mat-icon><mat-icon>star</mat-icon><mat-icon>star</mat-icon><mat-icon>star</mat-icon>
          </div>
        </div>
      </section>

      <section class="luxe-reviews-strip">
        <div class="container">
          <span class="luxe-sec-eyebrow">Avis clients</span>
          <div class="reviews-names">
            <span *ngFor="let name of reviewNames">{{ name }}</span>
          </div>
          <p class="reviews-line">« Très bon service, très rapide ! Merci »</p>
        </div>
      </section>

      <!-- NEWSLETTER -->
      <section class="luxe-newsletter">
        <div class="container luxe-newsletter-inner">
          <h3>REJOIGNEZ CARSTYLE</h3>
          <p>Offres, nouveautés accessoires et conseils entretien directement dans votre boîte mail.</p>
          <form class="luxe-subscribe" (submit)="subscribe(email.value); $event.preventDefault()">
            <input #email type="email" required placeholder="Votre adresse email" aria-label="Votre adresse email">
            <button mat-flat-button color="primary" type="submit">S'INSCRIRE</button>
          </form>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home-wrapper { background: var(--luxe-white); }

    /* HERO */
    .luxe-hero {
      position: relative;
      display: flex;
      flex-direction: column;
      min-height: 100svh;
      isolation: isolate;
    }
    .luxe-hero-media { position: absolute; inset: 0; z-index: 0; }
    .luxe-hero-media .hero-media { width: 100%; height: 100%; object-fit: cover; display: block; }
    .luxe-hero-overlay {
      position: absolute; inset: 0; z-index: 1; pointer-events: none;
      background: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.38) 45%, rgba(0,0,0,0.72) 100%);
    }
    .luxe-hero-content {
      position: relative; z-index: 2;
      flex: 1;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      text-align: center;
      color: #fff;
      max-width: 860px;
      width: 100%;
      margin: 0 auto;
      padding: 150px 24px 40px;
    }
    .luxe-hero-tag {
      font-size: 0.78rem; letter-spacing: 5px; font-weight: 600;
      color: var(--luxe-gold); text-transform: uppercase;
    }
    .luxe-hero-title {
      font-family: var(--font-heading);
      font-size: clamp(3rem, 8vw, 5.8rem);
      font-weight: 500; line-height: 1.05;
      margin: 22px 0 18px;
      color: #fff;
      text-shadow: 0 8px 28px rgba(0,0,0,0.45);
    }
    .luxe-hero-title em { font-style: italic; color: var(--luxe-gold); }
    .luxe-hero-sub {
      font-size: clamp(1rem, 2vw, 1.2rem);
      font-weight: 400;
      max-width: 620px;
      margin: 0 auto 36px;
      line-height: 1.7;
      letter-spacing: 0.02em;
      font-family: var(--font-body);
      color: rgba(255,255,255,0.94);
    }
    .luxe-hero-cta { display: flex; align-items: center; justify-content: center; gap: 28px; flex-wrap: wrap; }
    .luxe-hero-cta button { padding: 0 36px; height: 54px; font-size: 0.78rem; letter-spacing: 2px; }
    .luxe-hero-link {
      color: #fff; text-decoration: none; font-size: 0.8rem; letter-spacing: 2px;
      text-transform: uppercase; font-weight: 500;
      display: inline-flex; align-items: center; gap: 8px;
      border-bottom: 1px solid var(--luxe-gold); padding-bottom: 6px;
    }
    .luxe-hero-link:hover { color: var(--luxe-gold); }
    .luxe-hero-stats {
      position: relative; z-index: 2;
      display: grid; grid-template-columns: repeat(3, 1fr);
      background: rgba(8,8,8,0.82); backdrop-filter: blur(12px);
      border-top: 1px solid rgba(255,255,255,0.14);
    }
    .stat {
      padding: 22px 16px; text-align: center;
      border-right: 1px solid rgba(255,255,255,0.12);
      display: flex; flex-direction: column; gap: 6px;
    }
    .stat:last-child { border-right: none; }
    .stat-num { font-family: var(--font-heading); font-size: 1.7rem; color: var(--luxe-gold); line-height: 1; }
    .stat-label { font-size: 0.7rem; letter-spacing: 1.6px; text-transform: uppercase; color: rgba(255,255,255,0.82); font-weight: 400; }

    /* USPs */
    .luxe-usps { background: #fff; border-bottom: 1px solid var(--luxe-border); position: relative; z-index: 3; }
    .luxe-usps-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; padding: 42px 40px; }
    .usp { display: flex; align-items: center; gap: 14px; }
    .usp mat-icon { color: var(--luxe-gold); font-size: 30px; width: 30px; height: 30px; flex-shrink: 0; }
    .usp strong { display: block; font-size: 0.88rem; color: var(--luxe-black); font-weight: 600; margin-bottom: 4px; }
    .usp span { display: block; font-size: 0.8rem; color: var(--luxe-text-muted); font-weight: 400; line-height: 1.4; }
    .luxe-brands { background: var(--luxe-offwhite); border-bottom: 1px solid var(--luxe-border); }
    .luxe-brands-row {
      display: flex; justify-content: center; align-items: center; gap: 0; flex-wrap: wrap;
      padding: 28px 40px; font-size: 0.76rem; letter-spacing: 2.4px; text-transform: uppercase;
      color: var(--luxe-text-muted); font-weight: 700;
    }
    .luxe-brands-row span { padding: 0 22px; border-right: 1px solid var(--luxe-border); }
    .luxe-brands-row span:last-child { border-right: none; }
    .luxe-reviews-strip { text-align: center; padding: 70px 40px; border-top: 1px solid var(--luxe-border); }
    .reviews-names { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 18px; margin: 22px 0 18px; }
    .reviews-names span { font-size: 0.82rem; color: var(--luxe-charcoal); font-weight: 600; }
    .reviews-line { color: var(--luxe-text-muted); font-style: italic; margin: 0; }

    /* Sections communes */
    .container { max-width: 1440px; margin: 0 auto; padding: 0 40px; }
    .luxe-sec-head { text-align: center; margin-bottom: 60px; }
    .luxe-sec-eyebrow { font-size: 0.75rem; letter-spacing: 5px; text-transform: uppercase; color: var(--luxe-gold); font-weight: 600; }
    .luxe-sec-title { font-family: var(--font-heading); font-size: clamp(2rem, 4vw, 2.8rem); color: var(--luxe-black); margin: 18px 0 0; font-weight: 500; }
    .luxe-sec-line { width: 46px; height: 2px; background: var(--luxe-gold); margin: 24px auto 0; border-radius: 2px; }

    /* Catégories */
    .luxe-categories { padding: 110px 40px 40px; }
    .luxe-cat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 26px; }
    .luxe-cat-tile { position: relative; aspect-ratio: 4 / 5; overflow: hidden; border-radius: var(--radius-lg); text-decoration: none; display: block; }
    .luxe-cat-tile img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s ease; }
    .luxe-cat-tile:hover img { transform: scale(1.06); }
    .luxe-cat-shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,10,10,0.75), rgba(10,10,10,0.05)); }
    .luxe-cat-info { position: absolute; left: 0; right: 0; bottom: 0; padding: 22px; display: flex; flex-direction: column; gap: 6px; }
    .luxe-cat-name { color: var(--luxe-white); font-family: var(--font-heading); font-size: 1.35rem; }
    .luxe-cat-link { color: var(--luxe-gold); font-size: 0.72rem; letter-spacing: 2px; text-transform: uppercase; display: inline-flex; align-items: center; gap: 6px; font-weight: 500; opacity: 0.9; transition: opacity 0.3s ease; }
    .luxe-cat-link mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .luxe-cat-tile:hover .luxe-cat-link { opacity: 1; }

    /* Produits vedettes */
    .luxe-featured { padding: 110px 0 60px; }
    .luxe-prod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 34px; }
    .luxe-see-all { text-align: center; margin-top: 60px; }
    .luxe-see-all button { padding: 0 40px; height: 52px; letter-spacing: 2px; }
    .luxe-cat-block { padding-top: 40px; }
    .luxe-sec-split { display: flex; align-items: flex-end; justify-content: space-between; text-align: left; gap: 24px; }
    .luxe-sec-split .luxe-sec-line { display: none; }
    .luxe-hero-link.dark { color: var(--luxe-black); border-bottom-color: var(--luxe-gold); }
    .luxe-hero-link.dark:hover { color: var(--luxe-gold); }

    /* Atelier */
    .luxe-atelier { background: var(--luxe-black); color: var(--luxe-white); margin-top: 110px; overflow: hidden; }
    .luxe-atelier-grid { display: grid; grid-template-columns: 1fr 1fr; }
    .luxe-atelier-media { min-height: 560px; }
    .luxe-atelier-media img { width: 100%; height: 100%; object-fit: cover; opacity: 0.92; }
    .luxe-atelier-body { padding: clamp(50px, 8vw, 110px); display: flex; flex-direction: column; justify-content: center; }
    .luxe-atelier-title { font-family: var(--font-heading); font-size: clamp(2.4rem, 5vw, 3.6rem); color: var(--luxe-white); margin: 22px 0 30px; font-weight: 500; }
    .luxe-atelier-body p { color: #bbbbbb; font-size: 1.05rem; line-height: 1.9; font-weight: 300; font-family: var(--font-body); }
    .luxe-atelier-list { list-style: none; padding: 0; margin: 34px 0 44px; display: flex; flex-direction: column; gap: 14px; }
    .luxe-atelier-list li { display: flex; align-items: center; gap: 12px; color: #cccccc; font-size: 0.95rem; font-weight: 300; }
    .luxe-atelier-list mat-icon { color: var(--luxe-gold); font-size: 20px; width: 20px; height: 20px; }
    .luxe-text-link { color: var(--luxe-gold); letter-spacing: 2px; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 10px; }
    .luxe-text-link:hover { color: var(--luxe-white); }

    /* Témoignage */
    .luxe-quote { text-align: center; padding: 120px 40px; max-width: 900px; }
    .luxe-quote-mark { color: var(--luxe-gold); font-size: 64px; width: 64px; height: 64px; }
    .luxe-quote blockquote { font-family: var(--font-heading); font-size: clamp(1.4rem, 3vw, 2rem); line-height: 1.6; color: var(--luxe-black); margin: 24px auto 36px; font-weight: 400; }
    .luxe-quote-author { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .luxe-quote-name { font-weight: 600; color: var(--luxe-black); letter-spacing: 1px; }
    .luxe-quote-role { font-size: 0.75rem; color: var(--luxe-text-muted); text-transform: uppercase; letter-spacing: 2px; }
    .luxe-stars { display: flex; gap: 4px; margin-top: 8px; }
    .luxe-stars mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--luxe-gold); }

    /* Newsletter */
    .luxe-newsletter { background: var(--luxe-offwhite); border-top: 1px solid var(--luxe-border); padding: 110px 40px; }
    .luxe-newsletter-inner { text-align: center; max-width: 640px; }
    .luxe-newsletter h3 { font-size: clamp(1.5rem, 3vw, 2rem); letter-spacing: 4px; text-transform: uppercase; color: var(--luxe-black); margin-bottom: 18px; font-family: var(--font-heading); font-weight: 500; }
    .luxe-newsletter p { color: var(--luxe-text-muted); margin-bottom: 40px; font-weight: 300; line-height: 1.7; }
    .luxe-subscribe { display: flex; gap: 0; box-shadow: var(--shadow-sm); border-radius: var(--radius-pill); overflow: hidden; background: var(--luxe-white); }
    .luxe-subscribe input { flex: 1; padding: 16px 26px; border: none; outline: none; font-family: var(--font-body); font-size: 0.9rem; }
    .luxe-subscribe button { border-radius: 0 !important; height: auto; letter-spacing: 2px; }

    @media (max-width: 960px) {
      .luxe-sec-split { flex-direction: column; align-items: flex-start; }
      .container, .luxe-categories { padding-left: 20px; padding-right: 20px; }
      .luxe-usps-grid { grid-template-columns: 1fr 1fr; padding: 28px 20px; }
      .luxe-atelier-grid { grid-template-columns: 1fr; }
      .luxe-atelier-media { min-height: 340px; }
      .luxe-atelier-body { padding: 50px 26px; }
      .luxe-hero-content { padding: 130px 20px 32px; }
      .stat { padding: 16px 10px; }
      .luxe-brands-row span { border-right: none; padding: 8px 14px; }
      .luxe-subscribe { flex-direction: column; border-radius: var(--radius-lg); }
      .luxe-subscribe input { padding: 18px 22px; }
      .luxe-prod-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }
    }
    @media (max-width: 480px) {
      .luxe-usps-grid { grid-template-columns: 1fr; }
      .luxe-hero-title { font-size: 2.6rem; }
      .luxe-prod-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
    }
  `]
})
export class HomeComponent implements OnInit {
  products: any[] = [];
  cleaning: any[] = [];
  interior: any[] = [];
  exterior: any[] = [];
  entretien: any[] = [];
  electronics: any[] = [];
  categories: any[] = [];
  reviewNames = ['Salem G.', 'Amine K.', 'Hayet D.', 'Walid K.', 'Rania M.', 'Firas T.', 'Ala F.', 'Ahmed B.'];
  hero: HeroSettings = {
    type: 'video',
    videoUrl: 'assets/vids/hero-720.mp4',
    imageUrl: 'assets/vids/hero-poster.webp',
    posterUrl: 'assets/vids/hero-poster.webp'
  };

  constructor(private crud: CrudService, private snackBar: MatSnackBar, private settings: SettingsService) {}

  ngOnInit() {
    this.settings.hero$.subscribe((hero) => { this.hero = hero; });
    this.crud.getPage<any>('products', { limit: 24, sort: 'newest:desc' }).subscribe({
      next: page => {
        const all = page.data || [];
        this.products = all.slice(0, 8);
        this.cleaning = all.filter((p: any) => p.category === 'Nettoyage & Detailing').slice(0, 4);
        this.interior = all.filter((p: any) => p.category === 'Accessoires Intérieur').slice(0, 4);
        this.exterior = all.filter((p: any) => p.category === 'Accessoires Extérieur').slice(0, 4);
        this.entretien = all.filter((p: any) => p.category === 'Entretien').slice(0, 4);
        this.electronics = all.filter((p: any) => p.category === 'Électronique').slice(0, 4);
      },
      error: () => {}
    });

    this.crud.getAll<CategoryCount>('products/meta').subscribe({
      next: (meta: any) => {
        this.categories = (meta.categories || [])
          .filter((c: CategoryCount) => c.name !== 'Promotions')
          .slice(0, 5);
      },
      error: () => {}
    });
  }

  subscribe(email: string) {
    this.snackBar.open('Merci ! Votre inscription à la newsletter a bien été enregistrée.', 'Fermer', { duration: 3500 });
  }
}
