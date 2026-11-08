import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BrandService } from '../../services/brand.service';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatSnackBarModule, ImageUrlPipe],
  template: `
    <footer class="luxe-footer">
      <div class="luxe-certifications">
        <div class="luxe-cert"><mat-icon>local_shipping</mat-icon><span><strong>Livraison 48h</strong><small>Partout en Tunisie</small></span></div>
        <div class="luxe-cert"><mat-icon>flag</mat-icon><span><strong>{{ brand.copy.footerCertPickup }}</strong><small>Conseil & retrait</small></span></div>
        <div class="luxe-cert"><mat-icon>verified</mat-icon><span><strong>Produits pro</strong><small>Detailing & accessoires</small></span></div>
        <div class="luxe-cert"><mat-icon>payments</mat-icon><span><strong>Paiement à la livraison</strong><small>Espèces ou carte</small></span></div>
      </div>

      <div class="luxe-footer-grid">
        <div class="luxe-footer-brand">
          <div class="luxe-logo">
            <img [src]="brand.logoUrl | imageUrl" [alt]="brand.name" class="logo-img" width="36" height="36" loading="lazy" decoding="async">
            <span>{{ brand.nameStart }}<span class="logo-accent" *ngIf="brand.nameAccent">{{ brand.nameAccent }}</span></span>
          </div>
          <p>{{ brand.copy.footerBlurb }}</p>
          <div class="luxe-socials">
            <a *ngIf="brand.social.facebook" [href]="brand.social.facebook" target="_blank" rel="noopener" aria-label="Facebook">
              <mat-icon>facebook</mat-icon>
            </a>
            <a *ngIf="brand.social.instagram" [href]="brand.social.instagram" target="_blank" rel="noopener" aria-label="Instagram">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zm5.25-3.25a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1z"/>
              </svg>
            </a>
          </div>
        </div>

        <div class="luxe-footer-col">
          <h4>EXPLORER</h4>
          <a routerLink="/collection">Tous les produits</a>
          <a routerLink="/collection" [queryParams]="{cat: 'Accessoires Intérieur'}">Accessoires</a>
          <a routerLink="/collection" [queryParams]="{cat: 'Nettoyage & Detailing'}">Nettoyage</a>
          <a routerLink="/collection" [queryParams]="{cat: 'Promotions'}">Promotions</a>
          <a routerLink="/wishlist">Mes favoris</a>
        </div>

        <div class="luxe-footer-col">
          <h4>MON COMPTE</h4>
          <a routerLink="/auth/login">Connexion</a>
          <a routerLink="/auth/register">Créer un compte</a>
          <a routerLink="/cart">Mon panier</a>
          <a routerLink="/profile">Mon profil</a>
        </div>

        <div class="luxe-footer-col luxe-footer-contact">
          <h4>NOUS CONTACTER</h4>
          <a routerLink="/contact" class="luxe-contact-link"><mat-icon>chat_outline</mat-icon> Page contact</a>
          <p><mat-icon>mail_outline</mat-icon> {{ brand.contact.email }}</p>
          <p><mat-icon>phone_in_talk</mat-icon> {{ brand.contact.phoneDisplay }}</p>
          <p><mat-icon>location_on</mat-icon> {{ brand.contact.addressLine1 }}, {{ brand.contact.addressLine2 }}</p>
          <form class="luxe-newsletter" (submit)="subscribe(email.value); $event.preventDefault()">
            <input #email type="email" required placeholder="Votre e-mail" aria-label="Votre adresse e-mail">
            <button type="submit" aria-label="S'abonner à la newsletter"><mat-icon>arrow_forward</mat-icon></button>
          </form>
        </div>
      </div>

      <div class="luxe-payments">
        <span class="luxe-payments-label">Paiements acceptés</span>
        <div class="luxe-payment-icons">
          <span class="luxe-pay" title="Visa"><mat-icon>credit_card</mat-icon> VISA</span>
          <span class="luxe-pay" title="Mastercard"><mat-icon>credit_score</mat-icon> Mastercard</span>
          <span class="luxe-pay" title="Espèces à la livraison"><mat-icon>payments</mat-icon> Espèces à la livraison</span>
        </div>
      </div>

      <div class="luxe-copyright">
        &copy; {{ brand.year }} {{ brand.legalName }}. Tous droits réservés. &mdash; {{ brand.copy.copyrightExtra }}
      </div>
    </footer>
  `,
  styles: [`
    .luxe-footer {
      background: var(--luxe-black);
      color: var(--luxe-white);
      padding: 90px 40px 30px;
      margin-top: 0;
    }

    .luxe-certifications {
      max-width: 1440px; margin: 0 auto 80px; padding-bottom: 60px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px;
    }
    .luxe-cert { display: flex; align-items: center; gap: 18px; justify-content: center; }
    .luxe-cert mat-icon {
      font-size: 28px; width: 28px; height: 28px; line-height: 28px;
      color: var(--luxe-gold);
      padding: 10px; border: 1px solid rgba(255,255,255,0.18); border-radius: 50%;
      background: rgba(255,255,255,0.06); box-sizing: content-box;
      display: grid; place-items: center; overflow: hidden;
    }
    .luxe-cert strong { display: block; color: var(--luxe-white); font-size: 0.95rem; letter-spacing: 0.5px; }
    .luxe-cert small { color: #9a9a9a; font-weight: 300; font-size: 0.78rem; }

    .luxe-footer-grid {
      max-width: 1440px; margin: 0 auto;
      display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; gap: 60px;
    }
    .luxe-logo {
      font-family: var(--font-heading); font-size: 1.4rem; font-weight: 700;
      letter-spacing: 3px; color: var(--luxe-white); text-transform: uppercase; margin-bottom: 25px;
      display: inline-flex; align-items: center; gap: 10px;
    }
    .luxe-logo .logo-img {
      width: 36px; height: 36px; object-fit: contain; border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .luxe-logo .logo-accent { color: var(--luxe-gold); }
    .luxe-footer-brand p { color: #9a9a9a; line-height: 1.8; font-weight: 300; font-size: 0.95rem; max-width: 360px; font-family: var(--font-body); }
    .luxe-socials { margin-top: 30px; display: flex; gap: 16px; }
    .luxe-socials a {
      width: 42px; height: 42px; border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.2);
      display: grid; place-items: center;
      color: var(--luxe-white); text-decoration: none;
      transition: all 0.3s ease;
    }
    .luxe-socials a mat-icon { font-size: 20px; width: 20px; height: 20px; line-height: 20px; display: block; }
    .luxe-socials a svg { display: block; }
    .luxe-socials a:hover { background: var(--luxe-gold); border-color: var(--luxe-gold); color: var(--luxe-black); transform: translateY(-3px); }
    .luxe-footer-col h4 {
      font-family: var(--font-body); font-size: 0.75rem; letter-spacing: 4px;
      margin-bottom: 28px; color: var(--luxe-white); font-weight: 700; text-transform: uppercase;
    }
    .luxe-footer-col a { display: block; color: #9a9a9a; text-decoration: none; margin-bottom: 14px; font-size: 0.9rem; font-weight: 300; transition: color 0.3s ease, padding-left 0.3s ease; }
    .luxe-footer-col a:hover { color: var(--luxe-gold); padding-left: 6px; }
    .luxe-contact-link { display: flex; align-items: center; gap: 10px; }
    .luxe-contact-link mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--luxe-gold); }
    .luxe-footer-contact p { display: flex; align-items: center; gap: 12px; color: #9a9a9a; margin-bottom: 14px; font-size: 0.9rem; font-weight: 300; }
    .luxe-footer-contact p mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--luxe-gold); }
    .luxe-newsletter { display: flex; gap: 8px; margin-top: 26px; }
    .luxe-newsletter input {
      flex: 1; background: transparent; border: 1px solid rgba(255,255,255,0.2);
      border-radius: var(--radius-pill); padding: 12px 18px; color: var(--luxe-white);
      outline: none; font-family: var(--font-body); font-size: 0.85rem; transition: border-color 0.3s ease;
    }
    .luxe-newsletter input:focus { border-color: var(--luxe-gold); }
    .luxe-newsletter input::placeholder { color: #777; }
    .luxe-newsletter button {
      width: 46px; height: 46px; border-radius: 50%; border: none; cursor: pointer;
      background: var(--luxe-gold); color: var(--luxe-black);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.3s ease, background 0.3s ease;
    }
    .luxe-newsletter button:hover { transform: translateX(4px); background: var(--luxe-white); }

    .luxe-payments {
      max-width: 1440px; margin: 60px auto 0; padding-top: 34px;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex; align-items: center; justify-content: center; gap: 26px; flex-wrap: wrap;
    }
    .luxe-payments-label { color: #777; font-size: 0.72rem; letter-spacing: 3px; text-transform: uppercase; }
    .luxe-payment-icons { display: flex; gap: 12px; align-items: center; }
    .luxe-pay {
      display: inline-flex; align-items: center; gap: 8px; padding: 9px 16px;
      border: 1px solid rgba(255,255,255,0.15); border-radius: var(--radius-sm);
      color: #ccc; font-size: 0.74rem; font-weight: 600; letter-spacing: 1px;
      transition: border-color 0.3s ease, color 0.3s ease, transform 0.3s ease;
    }
    .luxe-pay mat-icon { font-size: 18px; width: 18px; height: 18px; color: var(--luxe-gold); }
    .luxe-pay:hover { border-color: var(--luxe-gold); color: var(--luxe-gold); transform: translateY(-2px); }

    .luxe-copyright {
      max-width: 1440px; margin: 34px auto 0; padding-top: 28px;
      border-top: 1px solid rgba(255,255,255,0.1);
      color: #666; font-size: 0.72rem; letter-spacing: 2px;
      text-transform: uppercase; text-align: center;
    }
    @media (max-width: 960px) {
      .luxe-footer { padding: 70px 24px 24px; }
      .luxe-footer-grid { grid-template-columns: 1fr; gap: 45px; }
      .luxe-certifications { grid-template-columns: 1fr 1fr; gap: 26px; }
      .luxe-cert { justify-content: flex-start; }
    }
    @media (max-width: 520px) {
      .luxe-certifications { grid-template-columns: 1fr; }
    }
  `]
})
export class FooterComponent {
  constructor(private snackBar: MatSnackBar, public brand: BrandService) {}

  subscribe(email: string) {
    this.snackBar.open('Merci ! Votre inscription à la newsletter a bien été enregistrée.', 'Fermer', { duration: 3500 });
  }
}
