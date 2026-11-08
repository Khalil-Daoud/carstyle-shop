import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ReviewDialogData {
  title?: string;
  subtitle?: string;
  placeholder?: string;
}

@Component({
  selector: 'app-review-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, FormsModule],
  template: `
    <h2 mat-dialog-title class="rv-title">{{ data.title || 'Laisser un avis' }}</h2>
    <mat-dialog-content>
      <p class="rv-product" *ngIf="data.subtitle">{{ data.subtitle }}</p>
      <div class="rv-stars">
        <button *ngFor="let s of [1,2,3,4,5]" type="button" class="rv-star" [class.active]="rating >= s" (click)="rating = s" [attr.aria-label]="'Note de ' + s + ' étoiles'">
          <mat-icon>star</mat-icon>
        </button>
      </div>
      <textarea class="rv-text" [(ngModel)]="comment" rows="4" [placeholder]="data.placeholder || 'Partagez votre expérience…'" aria-label="Votre commentaire"></textarea>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-flat-button color="primary" [disabled]="rating === 0 || comment.trim().length < 10" (click)="submit()">Publier</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .rv-title { font-family: var(--font-heading); color: var(--luxe-black); text-align: center; margin-bottom: 6px; }
    .rv-product { text-align: center; color: var(--luxe-text-muted); margin: 0 0 20px; }
    .rv-stars { display: flex; gap: 8px; justify-content: center; margin-bottom: 20px; }
    .rv-star { background: none; border: none; cursor: pointer; color: var(--luxe-border); padding: 0; transition: transform 0.2s ease; }
    .rv-star mat-icon { font-size: 34px; width: 34px; height: 34px; }
    .rv-star.active { color: var(--luxe-gold); }
    .rv-star:hover { transform: scale(1.15); }
    .rv-text { width: 100%; min-width: 360px; padding: 14px; border: 1px solid var(--luxe-border); border-radius: var(--radius-md); font-family: var(--font-body); font-size: 0.9rem; resize: vertical; outline: none; }
    .rv-text:focus { border-color: var(--luxe-gold); }
    @media (max-width: 600px) { .rv-text { min-width: 100%; } }
  `]
})
export class ReviewDialogComponent {
  rating = 0;
  comment = '';

  constructor(
    public dialogRef: MatDialogRef<ReviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReviewDialogData
  ) {}

  submit() {
    this.dialogRef.close({ rating: this.rating, comment: this.comment.trim() });
  }
}
