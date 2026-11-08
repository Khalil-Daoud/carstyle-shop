import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CrudService } from '../services/crud.service';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { CatalogService } from '../services/catalog.service';
import { CategoryCount } from '../services/catalog.types';
import { ProductCardComponent } from '../components/product-card/product-card.component';
import { ImageUrlPipe } from '../pipes/image-url.pipe';
import { HeroSettings, SettingsService } from '../services/settings.service';
import { BrandService } from '../services/brand.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatSnackBarModule, MatDialogModule, ProductCardComponent, ImageUrlPipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  products: any[] = [];
  cleaning: any[] = [];
  interior: any[] = [];
  categories: any[] = [];
  homeReviews: any[] = [];
  activeReview = 0;
  reviewCount = 0;
  reviewAverage = 0;
  hasShopReview = false;
  private reviewTimer: ReturnType<typeof setInterval> | null = null;
  private swipeX = 0;

  get currentReview(): any {
    return this.homeReviews[this.activeReview] || null;
  }

  get reviewSlide(): any[] {
    return this.currentReview ? [this.currentReview] : [];
  }

  get cleaningPreview(): any[] {
    return this.cleaning.slice(0, 2);
  }

  get interiorPreview(): any[] {
    return this.interior.slice(0, 2);
  }

  hero: HeroSettings = {
    type: 'video',
    videoUrl: 'assets/vids/hero-720.mp4',
    imageUrl: 'assets/vids/hero-poster.webp',
    posterUrl: 'assets/vids/hero-poster.webp'
  };

  private destroyRef = inject(DestroyRef);

  constructor(
    private crud: CrudService,
    private api: ApiService,
    private catalog: CatalogService,
    private snackBar: MatSnackBar,
    private settings: SettingsService,
    private auth: AuthService,
    private dialog: MatDialog,
    private router: Router,
    public brand: BrandService
  ) {}

  ngOnInit() {
    this.settings.hero$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((hero) => { this.hero = hero; });
    this.crud.getPage<any>('products', { limit: 24, sort: 'newest:desc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => {
          const all = page.data || [];
          this.products = all.slice(0, 8);
          this.cleaning = all.filter((p: any) => p.category === 'Nettoyage & Detailing').slice(0, 4);
          this.interior = all.filter((p: any) => p.category === 'Accessoires Intérieur').slice(0, 4);
        },
        error: () => {}
      });

    this.catalog.getMeta().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (meta) => {
        const order = ['Nettoyage & Detailing', 'Accessoires Extérieur', 'Accessoires Intérieur', 'Entretien', 'Électronique'];
        this.categories = (meta.categories || [])
          .filter((c: CategoryCount) => c.name !== 'Promotions')
          .sort((a: CategoryCount, b: CategoryCount) => {
            const ai = order.indexOf(a.name);
            const bi = order.indexOf(b.name);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
          })
          .slice(0, 5);
      },
      error: () => {}
    });
    this.loadReviews();
  }

  ngOnDestroy() {
    this.pauseAutoplay();
  }

  cleaningArt = 'https://images.unsplash.com/photo-1619642751034-96005ee1544d?auto=format&fit=crop&q=80&w=1400';
  interiorArt = 'assets/covering.webp';

  trackReview(_index: number, review: any) {
    return review?.id || _index;
  }

  trackById(_index: number, item: { id?: string }) {
    return item?.id || _index;
  }

  trackByName(_index: number, item: { name?: string }) {
    return item?.name || _index;
  }

  loadReviews() {
    this.api.get<any>('reviews', { limit: 12 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => {
        this.homeReviews = page.data || [];
        this.reviewCount = Number(page.count || this.homeReviews.length);
        this.reviewAverage = Number(page.average || 0);
        this.hasShopReview = Boolean(page.shopMine);
        this.activeReview = 0;
        this.startAutoplay();
      },
      error: () => { this.homeReviews = []; this.pauseAutoplay(); }
    });
  }

  nextReview() {
    if (this.homeReviews.length < 2) return;
    this.activeReview = (this.activeReview + 1) % this.homeReviews.length;
  }

  prevReview() {
    if (this.homeReviews.length < 2) return;
    this.activeReview = (this.activeReview - 1 + this.homeReviews.length) % this.homeReviews.length;
  }

  goToReview(index: number) {
    this.activeReview = index;
    this.startAutoplay();
  }

  startAutoplay() {
    this.pauseAutoplay();
    if (this.homeReviews.length < 2) return;
    this.reviewTimer = setInterval(() => this.nextReview(), 7000);
  }

  pauseAutoplay() {
    if (this.reviewTimer) {
      clearInterval(this.reviewTimer);
      this.reviewTimer = null;
    }
  }

  avatarTone(review: any): number {
    const key = String(review?.author || review?.id || '');
    return key.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 4;
  }

  onSwipeStart(event: TouchEvent) {
    this.swipeX = event.changedTouches[0]?.clientX ?? 0;
  }

  onSwipeEnd(event: TouchEvent) {
    const x = event.changedTouches[0]?.clientX ?? this.swipeX;
    const delta = x - this.swipeX;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) this.nextReview();
    else this.prevReview();
    this.startAutoplay();
  }

  openShopReview() {
    if (!this.auth.isLoggedIn) {
      this.router.navigate(['/auth/login'], { queryParams: { redirect: '/' } });
      return;
    }
    if (this.hasShopReview) {
      this.snackBar.open('Vous avez déjà publié un témoignage.', 'Fermer', { duration: 3500 });
      return;
    }
    void import('../components/review-dialog/review-dialog.component').then(({ ReviewDialogComponent }) => {
      const ref = this.dialog.open(ReviewDialogComponent, {
        width: '520px',
        panelClass: 'luxury-dialog',
        data: {
          title: 'Votre témoignage',
          subtitle: this.brand.copy.reviewSubtitle || `Partagez votre expérience avec ${this.brand.name}`,
          placeholder: 'Service, livraison, qualité des accessoires…'
        }
      });
      ref.afterClosed().subscribe(result => {
        if (!result) return;
        this.api.post('reviews', { rating: result.rating, comment: result.comment }).subscribe({
          next: () => {
            this.snackBar.open('Merci, votre témoignage est publié.', 'Fermer', { duration: 3500 });
            this.loadReviews();
          },
          error: (err) => {
            this.snackBar.open(err?.error?.message || 'Impossible de publier le témoignage', 'Fermer', { duration: 4000 });
          }
        });
      });
    });
  }

  subscribe(email: string) {
    this.snackBar.open('Merci ! Votre inscription à la newsletter a bien été enregistrée.', 'Fermer', { duration: 3500 });
  }
}
