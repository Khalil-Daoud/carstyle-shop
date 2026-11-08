import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-reviews-manager',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    <div class="manager-container fade-in">
      <div class="header">
        <div>
          <h2 class="luxury-title">Avis & témoignages</h2>
          <p>Les avis produits et les témoignages boutique s’affichent sur le site dès qu’un client connecté les publie.</p>
        </div>
      </div>

      <mat-card class="table-card">
        <div class="row head">
          <span>Client</span>
          <span>Cible</span>
          <span>Note</span>
          <span>Avis</span>
          <span></span>
        </div>
        <div class="row" *ngFor="let r of reviews">
          <div>
            <strong>{{ r.author_full || r.author }}</strong>
            <small>{{ r.createdAt | date:'d MMM y' }}</small>
          </div>
          <span>{{ r.product_name || 'Témoignage boutique' }}</span>
          <span class="stars">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</span>
          <p>{{ r.comment }}</p>
          <div class="actions">
            <button mat-icon-button [color]="r.featured ? 'accent' : undefined" (click)="toggleFeatured(r)" [attr.title]="r.featured ? 'Retirer de l’accueil' : 'Mettre en avant'">
              <mat-icon>{{ r.featured ? 'star' : 'star_border' }}</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="remove(r)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>
        <div class="empty" *ngIf="!reviews.length">
          <mat-icon>rate_review</mat-icon>
          <p>Aucun avis pour le moment.</p>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .manager-container { padding: 0; }
    .header { margin-bottom: 28px; }
    .header h2 { font-size: 2rem; margin-bottom: 8px; }
    .header p { color: #666; margin: 0; }
    .table-card { border-radius: 15px; padding: 8px 4px 16px; overflow: hidden; }
    .row { display: grid; grid-template-columns: 180px 170px 90px 1fr auto; gap: 16px; align-items: start; padding: 16px 20px; border-bottom: 1px solid var(--luxe-border); }
    .row.head { font-size: 0.75rem; letter-spacing: 1px; text-transform: uppercase; color: #888; font-weight: 600; }
    .row strong { display: block; }
    .row small { color: #888; }
    .row p { margin: 0; line-height: 1.5; color: #333; }
    .stars { color: var(--luxe-gold); letter-spacing: 1px; }
    .actions { display: flex; }
    .empty { text-align: center; padding: 50px 20px; color: var(--luxe-text-muted); }
    .empty mat-icon { font-size: 2.4rem; width: 40px; height: 40px; }
    @media (max-width: 800px) {
      .row, .row.head { grid-template-columns: 1fr; }
    }
  `]
})
export class ReviewsManagerComponent implements OnInit {
  reviews: any[] = [];

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.get<any[]>('reviews/manage').subscribe({
      next: rows => this.reviews = rows,
      error: () => this.snackBar.open('Impossible de charger les avis', 'Fermer', { duration: 4000 })
    });
  }

  toggleFeatured(review: any) {
    this.api.put<any>('reviews', review.id, { featured: !review.featured }).subscribe({
      next: () => {
        this.snackBar.open(review.featured ? 'Retiré de l’accueil' : 'Mis en avant sur l’accueil', 'OK', { duration: 2500 });
        this.load();
      },
      error: () => this.snackBar.open('Mise à jour impossible', 'Fermer', { duration: 3000 })
    });
  }

  remove(review: any) {
    if (!confirm('Supprimer cet avis ?')) return;
    this.api.delete('reviews', review.id).subscribe({
      next: () => {
        this.snackBar.open('Avis supprimé', 'OK', { duration: 2500 });
        this.load();
      },
      error: () => this.snackBar.open('Suppression impossible', 'Fermer', { duration: 3000 })
    });
  }
}
