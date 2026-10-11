import { Component, OnInit } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';

// Sections avec leur propre layout complet (sidebar admin, écrans d'auth plein écran...)
// Elles ne doivent pas hériter du header/footer de la boutique publique.
const STANDALONE_LAYOUT_PREFIXES = ['/admin', '/auth'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <app-header *ngIf="showShopChrome"></app-header>
    <main [class.no-chrome]="!showShopChrome">
      <router-outlet></router-outlet>
    </main>
    <app-footer *ngIf="showShopChrome"></app-footer>
    <a *ngIf="showShopChrome" class="wa-float" href="https://wa.me/21653933751" target="_blank" rel="noopener" aria-label="WhatsApp Carstyle">
      <span>WhatsApp</span>
    </a>
  `,
  styles: [`
    :host { display: block; }
    main { min-height: 70vh; }
    main.no-chrome { min-height: 100vh; }
    .wa-float {
      position: fixed; right: 22px; bottom: 22px; z-index: 1200;
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 56px; height: 56px; padding: 0 18px;
      background: #25D366; color: #fff; border-radius: 999px;
      text-decoration: none; font-weight: 700; letter-spacing: 0.6px;
      box-shadow: 0 10px 24px rgba(37, 211, 102, 0.35);
    }
    .wa-float:hover { filter: brightness(0.95); }
  `]
})
export class AppComponent implements OnInit {
  showShopChrome = true;

  constructor(private router: Router, private viewport: ViewportScroller) {}

  ngOnInit() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e) => {
      const url = (e as NavigationEnd).urlAfterRedirects;
      this.showShopChrome = !STANDALONE_LAYOUT_PREFIXES.some(prefix => url.startsWith(prefix));
      this.scrollToTop();
    });
  }

  private scrollToTop() {
    this.viewport.scrollToPosition([0, 0]);
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
}
