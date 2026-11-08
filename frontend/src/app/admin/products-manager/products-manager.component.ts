import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, switchMap, takeUntil, tap } from 'rxjs';
import { CrudService } from '../../services/crud.service';
import { ApiService } from '../../services/api.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';
import { FormatCurrencyPipe } from '../../pipes/format-currency.pipe';
import { PaginationComponent } from '../../components/pagination/pagination.component';

interface StockSummary {
  skuCount: number;
  units: number;
  outOfStock: number;
  lowStock: number;
  lowThreshold: number;
}

@Component({
  selector: 'app-products-manager',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    FormsModule,
    ReactiveFormsModule,
    ImageUrlPipe,
    FormatCurrencyPipe,
    PaginationComponent
  ],
  template: `
    <div class="products-page fade-in">
      <div class="page-head">
        <div>
          <h2>Produits</h2>
          <p>{{ showForm ? 'Même écran pour ajouter ou modifier. Parcourez les sections, puis enregistrez.' : 'Fiches, photos et prix. Le stock se règle à part, sans ouvrir chaque fiche.' }}</p>
        </div>
        <div class="header-actions">
          <a mat-stroked-button routerLink="/admin/stock" *ngIf="!showForm">
            <mat-icon>warehouse</mat-icon> Gérer le stock
          </a>
          <button mat-stroked-button color="primary" (click)="toggleImport()" *ngIf="!showForm">
            <mat-icon>upload_file</mat-icon> {{ showImport ? 'Fermer' : 'Importer' }}
          </button>
          <button mat-raised-button color="primary" (click)="toggleForm()" *ngIf="!showForm">
            <mat-icon>add</mat-icon> Ajouter un produit
          </button>
          <button mat-raised-button color="accent" (click)="toggleForm()" *ngIf="showForm">
            <mat-icon>close</mat-icon> Annuler
          </button>
        </div>
      </div>

      <div class="kpis" *ngIf="!showForm">
        <div class="kpi">
          <span class="kpi-label">Articles</span>
          <span class="kpi-value">{{ summary.skuCount }}</span>
        </div>
        <div class="kpi mute">
          <span class="kpi-label">Catégories</span>
          <span class="kpi-value">{{ categories.length }}</span>
        </div>
        <div class="kpi danger">
          <span class="kpi-label">Rupture</span>
          <span class="kpi-value">{{ summary.outOfStock }}</span>
        </div>
        <div class="kpi warn">
          <span class="kpi-label">Stock faible</span>
          <span class="kpi-value">{{ summary.lowStock }}</span>
        </div>
      </div>

      <mat-card class="form-card" *ngIf="showImport && !showForm">
        <mat-card-header>
          <mat-card-title>Importer un catalogue</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p class="import-help">
            Colonnes :
            <code>Ref</code>, <code>Catégorie</code>, <code>Désignation</code>,
            <code>Contenance</code>, <code>Prix</code>, <code>PrixAchat</code>, <code>Image</code>
            (<code>Stock</code> et <code>Description</code> facultatives).
            CSV, Excel (<code>.xlsx</code>) ou ZIP. Première feuille du classeur.
          </p>
          <ul class="import-rules">
            <li>Un CSV ou un Excel ne peut pas contenir les photos elles-mêmes : seulement un nom de fichier ou un lien.</li>
            <li>Pour envoyer les images : zippez le CSV/Excel avec les photos, et mettez le nom du fichier dans la colonne <strong>Image</strong> (ex. <code>deodorant.jpg</code>).</li>
            <li>Les catégories absentes sont créées. Une Ref déjà connue met le produit à jour.</li>
          </ul>

          <div class="import-actions">
            <mat-form-field appearance="outline" class="stock-field">
              <mat-label>Stock par défaut</mat-label>
              <input matInput type="number" min="0" [(ngModel)]="defaultStock" [ngModelOptions]="{ standalone: true }">
              <mat-hint>Si la colonne Stock est vide</mat-hint>
            </mat-form-field>

            <input type="file" hidden #csvInput accept=".csv,.txt,.zip,.xlsx,.xls,text/csv,application/zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" (change)="onCsvSelected($event)">
            <button mat-flat-button color="primary" [disabled]="importing" (click)="csvInput.click()">
              <mat-icon>upload_file</mat-icon>
              {{ importing ? 'Import en cours…' : 'Choisir CSV, Excel ou ZIP' }}
            </button>
            <mat-spinner *ngIf="importing" diameter="24"></mat-spinner>
            <button mat-stroked-button (click)="downloadTemplate()">
              <mat-icon>download</mat-icon> Modèle CSV
            </button>
          </div>
          <p class="import-file" *ngIf="importFileName">Fichier : {{ importFileName }}</p>

          <div class="import-report" *ngIf="importReport">
            <p class="report-summary">
              <strong>{{ importReport.created }}</strong> créé(s) ·
              <strong>{{ importReport.updated }}</strong> mis à jour ·
              <strong>{{ importReport.skipped }}</strong> ignoré(s)
              sur {{ importReport.total }} ligne(s)
              <ng-container *ngIf="importReport.imagesImported">
                · <strong>{{ importReport.imagesImported }}</strong> photo(s) extraite(s) du ZIP
              </ng-container>
            </p>
            <p *ngIf="importReport.categoriesCreated?.length">
              Catégories créées : {{ importReport.categoriesCreated.join(', ') }}
            </p>
            <div class="report-errors" *ngIf="importReport.errors?.length">
              <p>Lignes ignorées :</p>
              <ul>
                <li *ngFor="let e of importReport.errors">Ligne {{ e.line }} — {{ e.message }}</li>
              </ul>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <form class="editor" *ngIf="showForm" [formGroup]="productForm" (ngSubmit)="saveProduct()">
        <aside class="editor-nav">
          <button type="button" *ngFor="let s of editorSections" class="editor-nav-item"
            [class.on]="editorSection === s.id" (click)="goSection(s.id)">
            <mat-icon>{{ s.icon }}</mat-icon>
            <span>{{ s.label }}</span>
            <i class="nav-dot" *ngIf="sectionHint(s.id)"></i>
          </button>
        </aside>

        <div class="editor-main">
          <header class="editor-bar">
            <div>
              <strong>{{ isEditMode ? 'Modifier le produit' : 'Nouveau produit' }}</strong>
              <span>{{ productForm.get('name')?.value || 'Sans nom pour l’instant' }}</span>
            </div>
          </header>

          <section id="sec-general" class="editor-card">
            <div class="editor-card-head">
              <span class="editor-ico"><mat-icon>inventory_2</mat-icon></span>
              <div>
                <h3>Informations générales</h3>
                <p>Nom, classement et texte visible sur la fiche boutique.</p>
              </div>
            </div>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Nom du produit</mat-label>
                <input matInput formControlName="name" placeholder="ex: Support téléphone magnétique">
                <mat-hint>Obligatoire · affiché partout</mat-hint>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Référence</mat-label>
                <input matInput formControlName="reference" placeholder="ex: CS-INT-001">
                <mat-hint>Facultatif · code interne</mat-hint>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Catégorie</mat-label>
                <mat-select formControlName="category" (selectionChange)="onParentCategoryChange()">
                  <mat-option *ngFor="let c of parentCategories" [value]="c.name">{{ c.name }}</mat-option>
                </mat-select>
                <mat-hint *ngIf="categories.length === 0">Aucune catégorie — <a routerLink="/admin/categories">créez-en une</a></mat-hint>
              </mat-form-field>
              <mat-form-field appearance="outline" *ngIf="subsForSelectedParent().length">
                <mat-label>Sous-catégorie</mat-label>
                <mat-select formControlName="subcategory">
                  <mat-option [value]="''">Aucune</mat-option>
                  <mat-option *ngFor="let s of subsForSelectedParent()" [value]="s.name">{{ s.name }}</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Contenance</mat-label>
                <input matInput formControlName="contenance" placeholder="ex: 50 ml, 1 L, universel">
                <mat-hint>Facultatif · volume ou format</mat-hint>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Marque</mat-label>
                <input matInput formControlName="brand" placeholder="ex: Carstyle">
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="4" placeholder="Décrivez le produit, son usage, les points forts…"></textarea>
            </mat-form-field>
          </section>

          <section id="sec-media" class="editor-card">
            <div class="editor-card-head">
              <span class="editor-ico"><mat-icon>photo_library</mat-icon></span>
              <div>
                <h3>Images et médias</h3>
                <p>Photo principale de la fiche. Vous pouvez envoyer un fichier ou coller une URL.</p>
              </div>
            </div>
            <div class="media-row">
              <div class="media-preview" [class.empty]="!imagePreview && !imageValue">
                <img *ngIf="!uploading && (imagePreview || imageValue)" [src]="(imagePreview || imageValue) | imageUrl" alt="Aperçu du produit">
                <mat-spinner *ngIf="uploading" diameter="28"></mat-spinner>
                <span *ngIf="!uploading && !imagePreview && !imageValue">Aucune photo</span>
              </div>
              <div class="media-actions">
                <input type="file" hidden #fileInput accept="image/*" (change)="onFileSelected($event)">
                <button type="button" mat-stroked-button color="primary" [disabled]="uploading" (click)="fileInput.click()">
                  <mat-icon>upload</mat-icon>
                  {{ uploading ? 'Envoi en cours…' : (imagePreview || imageValue ? 'Remplacer la photo' : 'Choisir une photo') }}
                </button>
                <p class="tiers-hint">JPG ou PNG. Cette image est obligatoire.</p>
              </div>
            </div>
            <details class="url-adv">
              <summary>Coller une URL d’image</summary>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>URL de l’image</mat-label>
                <input matInput formControlName="image_url" placeholder="/img/… ou https://…">
              </mat-form-field>
            </details>
          </section>

          <section id="sec-pricing" class="editor-card">
            <div class="editor-card-head">
              <span class="editor-ico"><mat-icon>payments</mat-icon></span>
              <div>
                <h3>Prix et stock</h3>
                <p>Prix boutique, marge interne et quantité disponible.</p>
              </div>
            </div>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Prix de vente</mat-label>
                <input matInput type="number" formControlName="price" placeholder="ex: 25.00">
                <mat-hint>Obligatoire · visible en boutique</mat-hint>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Prix d’achat</mat-label>
                <input matInput type="number" formControlName="cost_price" placeholder="ex: 15.00">
                <mat-hint>Invisible en boutique · sert à la marge</mat-hint>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Ancien prix (promo)</mat-label>
                <input matInput type="number" formControlName="compare_price" placeholder="ex: 35.00">
                <mat-hint>Affiché barré s’il est plus élevé</mat-hint>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Stock</mat-label>
                <input matInput type="number" formControlName="stock" placeholder="ex: 50">
                <mat-hint>0 = rupture</mat-hint>
              </mat-form-field>
            </div>
          </section>

        </div>
        <div class="save-bar">
          <button mat-flat-button color="primary" type="submit" [disabled]="productForm.invalid">
            Enregistrer le produit
          </button>
          <button type="button" mat-stroked-button (click)="toggleForm()">Annuler</button>
        </div>
      </form>

      <div class="table-wrap" *ngIf="!showForm">
        <div class="toolbar">
          <mat-form-field appearance="outline" class="search">
            <mat-icon matPrefix>search</mat-icon>
            <mat-label>Rechercher</mat-label>
            <input matInput [(ngModel)]="searchTerm" (ngModelChange)="resetPage()" placeholder="Nom, référence…">
          </mat-form-field>
          <mat-form-field appearance="outline" class="cat">
            <mat-label>Catégorie</mat-label>
            <mat-select [(ngModel)]="categoryFilter" (ngModelChange)="resetPage()">
              <mat-option value="all">Toutes</mat-option>
              <ng-container *ngFor="let c of parentCategories">
                <mat-option [value]="c.name">{{ c.name }}</mat-option>
                <mat-option *ngFor="let s of childrenOfParent(c.id)" [value]="'sub:' + s.name"> — {{ s.name }}</mat-option>
              </ng-container>
            </mat-select>
          </mat-form-field>
          <span class="result-count">{{ total }} produit{{ total > 1 ? 's' : '' }}</span>
        </div>

        <div class="rows" *ngIf="products.length; else empty">
          <div class="row head">
            <span></span>
            <span>Produit</span>
            <span>Vente / achat</span>
            <span>Stock</span>
            <span></span>
          </div>
          <div class="row" *ngFor="let p of products">
            <img [src]="p.image_url | imageUrl" [alt]="p.name" class="thumb">
            <div class="meta">
              <strong>{{ p.name }}</strong>
              <span>{{ p.reference || 'Sans réf.' }} · {{ p.category || '—' }}<ng-container *ngIf="p.subcategory"> · {{ p.subcategory }}</ng-container><ng-container *ngIf="p.contenance"> · {{ p.contenance }}</ng-container></span>
            </div>
            <span class="price">
              {{ p.price | formatCurrency }}
              <small *ngIf="hasCost(p)">achat {{ p.cost_price | formatCurrency }} · {{ marginLabel(p) }}</small>
              <small *ngIf="!hasCost(p)" class="muted">achat non renseigné</small>
            </span>
            <span class="badge" [ngClass]="statusClass(p.stock)">{{ statusLabel(p.stock) }} · {{ p.stock }}</span>
            <div class="row-actions">
              <button type="button" mat-icon-button color="primary" matTooltip="Modifier" (click)="editProduct(p)">
                <mat-icon>edit</mat-icon>
              </button>
              <button type="button" mat-icon-button color="warn" matTooltip="Supprimer" (click)="deleteProduct(p.id)">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <ng-template #empty>
          <div class="empty" *ngIf="!loading">
            <mat-icon>inventory_2</mat-icon>
            <p>Aucun produit ne correspond à votre recherche.</p>
          </div>
        </ng-template>

        <app-pagination [pageIndex]="pageIndex" [pageSize]="pageSize" [totalItems]="total"
          (pageChange)="onPageChange($event)"></app-pagination>
      </div>
    </div>
  `,
  styles: [`
    .products-page { width: 100%; min-width: 0; }
    .page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 26px; flex-wrap: wrap; }
    .page-head h2 { margin: 0 0 6px; font-family: var(--font-heading); font-size: clamp(1.6rem, 3vw, 2rem); font-weight: 500; }
    .page-head p { margin: 0; color: var(--luxe-text-muted); font-weight: 300; font-size: 0.9rem; max-width: 560px; }
    .header-actions { display: flex; gap: 10px; flex-wrap: wrap; }

    .kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 22px; }
    .kpi {
      text-align: left; padding: 18px 20px; border-radius: 14px; min-width: 0;
      background: var(--luxe-white); border: 1px solid var(--luxe-border);
    }
    .kpi-label { display: block; font-size: 0.75rem; color: var(--luxe-text-muted); letter-spacing: 0.4px; margin-bottom: 6px; }
    .kpi-value { font-family: var(--font-heading); font-size: 1.7rem; color: var(--luxe-black); }
    .kpi.danger .kpi-value { color: #b42318; }
    .kpi.warn .kpi-value { color: #b54708; }

    .form-card { border-radius: 16px; padding: 12px 8px 8px; margin-bottom: 22px; }
    .editor { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 20px; align-items: start; margin-bottom: 28px; }
    .editor > .save-bar { grid-column: 1 / -1; }
    .editor-nav {
      position: sticky; top: 16px; display: flex; flex-direction: column; gap: 4px;
      background: var(--luxe-white); border: 1px solid var(--luxe-border); border-radius: 16px; padding: 10px;
    }
    .editor-nav-item {
      display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 8px;
      border: 0; background: transparent; text-align: left; padding: 10px 12px; border-radius: 10px;
      cursor: pointer; color: var(--luxe-charcoal); font-size: 0.88rem; font-family: inherit;
    }
    .editor-nav-item mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--luxe-gold); }
    .nav-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--luxe-gold); display: inline-block; }
    .editor-nav-item.on { background: var(--luxe-gold-soft); color: var(--luxe-black); font-weight: 600; }
    .editor-bar { padding: 4px 2px 14px; }
    .editor-bar strong { display: block; font-size: 1.05rem; }
    .editor-bar span { color: var(--luxe-text-muted); font-size: 0.82rem; }
    .editor-card {
      background: var(--luxe-white); border: 1px solid var(--luxe-border); border-radius: 16px;
      padding: 22px 22px 12px; margin-bottom: 16px; scroll-margin-top: 76px;
    }
    .editor-card-head { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 18px; }
    .editor-card-head h3 { margin: 0 0 4px; font-size: 1.05rem; font-weight: 600; }
    .editor-card-head p { margin: 0; color: var(--luxe-text-muted); font-size: 0.84rem; }
    .editor-ico {
      width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; flex-shrink: 0;
      background: var(--luxe-gold-soft); color: var(--luxe-gold-hover);
    }
    .editor-ico mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .media-row { display: flex; gap: 18px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
    .media-preview {
      width: 132px; height: 132px; border-radius: 14px; overflow: hidden; flex-shrink: 0;
      border: 1px solid var(--luxe-border); background: var(--luxe-offwhite);
      display: grid; place-items: center; color: var(--luxe-text-muted); font-size: 0.78rem;
    }
    .media-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .media-actions { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
    .tiers-hint { margin: 0; color: var(--luxe-text-muted); font-size: 0.82rem; }
    .url-adv { margin: 4px 0 10px; }
    .url-adv summary { cursor: pointer; color: var(--luxe-text-muted); font-size: 0.84rem; margin-bottom: 8px; }
    @media (max-width: 900px) {
      .editor { grid-template-columns: 1fr; }
      .editor-nav { position: sticky; top: 0; z-index: 5; flex-direction: row; overflow-x: auto; padding: 8px; }
      .editor-nav-item { grid-template-columns: 22px auto; white-space: nowrap; }
      .editor-nav-item em { display: none; }
    }
    .full-width { width: 100%; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; }

    .import-help { color: var(--luxe-text-muted); font-size: 0.9rem; line-height: 1.7; }
    .import-help code, .import-rules code { background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
    .import-rules { color: var(--luxe-text-muted); font-size: 0.85rem; line-height: 1.8; margin: 0 0 18px; padding-left: 20px; }
    .import-actions { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
    .stock-field { width: 200px; max-width: 100%; }
    .import-file { margin: 8px 0 0; font-size: 0.82rem; color: var(--luxe-text-muted); }
    .import-report { margin-top: 24px; padding: 16px; border-radius: 10px; border: 1px solid var(--luxe-border); }
    .report-summary { margin: 0 0 8px; }
    .report-errors { margin-top: 12px; color: var(--luxe-crimson); font-size: 0.85rem; }
    .report-errors ul { margin: 6px 0 0; padding-left: 20px; line-height: 1.7; }

    .table-wrap {
      min-width: 0; background: var(--luxe-white);
      border: 1px solid var(--luxe-border); border-radius: 16px; overflow: hidden;
    }
    .toolbar {
      display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
      padding: 16px 18px 4px;
    }
    .search { flex: 1; min-width: 180px; }
    .cat { width: 200px; max-width: 100%; }
    .result-count { color: var(--luxe-text-muted); font-size: 0.85rem; margin-left: auto; }

    .rows { width: 100%; }
    .row {
      display: grid;
      grid-template-columns: 52px minmax(0, 1fr) 170px 150px 88px;
      gap: 14px;
      align-items: center;
      padding: 10px 18px;
      border-top: 1px solid var(--luxe-border);
    }
    .row.head {
      border-top: none;
      padding-top: 6px;
      padding-bottom: 8px;
      font-size: 0.7rem;
      letter-spacing: 0.7px;
      text-transform: uppercase;
      color: var(--luxe-text-muted);
      font-weight: 700;
    }
    .thumb { width: 52px; height: 64px; object-fit: cover; border-radius: 8px; background: var(--luxe-offwhite); }
    .meta { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .meta strong { font-size: 0.95rem; color: var(--luxe-black); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .meta span { font-size: 0.78rem; color: var(--luxe-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .price { font-weight: 600; white-space: nowrap; display: flex; flex-direction: column; gap: 2px; }
    .price small { font-weight: 500; font-size: 0.72rem; color: #2e7d32; }
    .price small.muted { color: var(--luxe-text-muted); }
    .row-actions { display: flex; justify-content: flex-end; }

    .badge {
      display: inline-block; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.5px;
      text-transform: uppercase; padding: 5px 10px; border-radius: 999px; white-space: nowrap;
    }
    .badge.ok { background: #ecfdf3; color: #067647; }
    .badge.low { background: #fffaeb; color: #b54708; }
    .badge.out { background: #fef3f2; color: #b42318; }

    .empty {
      text-align: center; padding: 56px 20px; color: var(--luxe-text-muted);
    }
    .empty mat-icon { font-size: 42px; width: 42px; height: 42px; color: var(--luxe-gold); margin-bottom: 10px; }

    @media (max-width: 1100px) {
      .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 720px) {
      .page-head { align-items: stretch; }
      .header-actions { width: 100%; }
      .header-actions a, .header-actions button { flex: 1; }
      .cat { width: 100%; }
      .result-count { margin-left: 0; width: 100%; }
      .row { grid-template-columns: 52px 1fr auto; }
      .row.head { display: none; }
      .price, .badge, .row-actions { grid-column: 2; justify-self: start; }
    }
    @media (max-width: 480px) {
      .kpis { grid-template-columns: 1fr 1fr; gap: 10px; }
      .kpi { padding: 14px; }
      .kpi-value { font-size: 1.35rem; }
    }
  `]
})
export class ProductsManagerComponent implements OnInit, OnDestroy {
  products: any[] = [];
  categories: any[] = [];
  summary: StockSummary = { skuCount: 0, units: 0, outOfStock: 0, lowStock: 0, lowThreshold: 10 };
  total = 0;
  loading = true;
  searchTerm = '';
  categoryFilter = 'all';

  get parentCategories(): any[] {
    return this.categories.filter((c) => !c.parent_id);
  }

  get listCategoryFilter(): string | undefined {
    if (this.categoryFilter === 'all' || this.categoryFilter.startsWith('sub:')) return undefined;
    return this.categoryFilter;
  }

  get listSubcategoryFilter(): string | undefined {
    return this.categoryFilter.startsWith('sub:') ? this.categoryFilter.slice(4) : undefined;
  }

  childrenOfParent(parentId: string): any[] {
    return this.categories.filter((c) => c.parent_id === parentId);
  }

  subsForSelectedParent(): any[] {
    const name = this.productForm?.get('category')?.value;
    const parent = this.categories.find((c) => c.name === name && !c.parent_id);
    return parent ? this.childrenOfParent(parent.id) : [];
  }

  onParentCategoryChange() {
    const current = this.productForm.get('subcategory')?.value;
    if (current && !this.subsForSelectedParent().some((s) => s.name === current)) {
      this.productForm.patchValue({ subcategory: '' });
    }
  }
  pageIndex = 0;
  pageSize = 10;
  private lowThreshold = 10;

  private searchChange$ = new Subject<void>();
  private reload$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  productForm!: FormGroup;
  showForm = false;
  editorSection: 'general' | 'media' | 'pricing' = 'general';
  readonly editorSections = [
    { id: 'general' as const, label: 'Général', icon: 'inventory_2' },
    { id: 'media' as const, label: 'Images', icon: 'photo_library' },
    { id: 'pricing' as const, label: 'Prix & stock', icon: 'payments' }
  ];
  isEditMode = false;
  editingProductId: string | null = null;
  uploading = false;
  imagePreview = '';

  showImport = false;
  importing = false;
  defaultStock = 100;
  importReport: any = null;
  importFileName = '';

  constructor(
    private crud: CrudService,
    private api: ApiService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.searchChange$
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.reload$.next());

    this.reload$
      .pipe(
        tap(() => { this.loading = true; }),
        switchMap(() => this.crud.getPage<any>('products', {
          page: this.pageIndex + 1,
          limit: this.pageSize,
          search: this.searchTerm.trim() || undefined,
          category: this.listCategoryFilter,
          subcategory: this.listSubcategoryFilter,
          sort: 'newest:desc'
        })),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: page => {
          this.products = page.data;
          this.total = page.total;
          this.loading = false;
          if (page.data.length === 0 && this.pageIndex > 0) {
            this.pageIndex = Math.max(0, page.pages - 1);
            this.reload$.next();
          }
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Erreur lors du chargement des produits', 'Fermer', { duration: 4000 });
        }
      });

    this.loadProducts();
    this.loadCategories();
    this.loadSummary();
    this.initForm();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories() {
    this.crud.getAll<any>('categories').subscribe({
      next: data => this.categories = data,
      error: () => this.snackBar.open('Erreur lors du chargement des catégories', 'Fermer', { duration: 4000 })
    });
  }

  loadSummary() {
    this.api.get<StockSummary>('products/stock-summary', { low: this.lowThreshold }).subscribe({
      next: s => this.summary = s,
      error: () => {}
    });
  }

  statusClass(stock: number): string {
    if (stock <= 0) return 'out';
    if (stock <= this.lowThreshold) return 'low';
    return 'ok';
  }

  statusLabel(stock: number): string {
    if (stock <= 0) return 'Rupture';
    if (stock <= this.lowThreshold) return 'Faible';
    return 'En stock';
  }

  hasCost(product: { cost_price?: number | string | null }): boolean {
    return product.cost_price !== null && product.cost_price !== undefined && product.cost_price !== '';
  }

  marginLabel(product: { price?: number; cost_price?: number | string | null }): string {
    const price = Number(product.price);
    const cost = Number(product.cost_price);
    if (!Number.isFinite(price) || !Number.isFinite(cost) || price <= 0) return '';
    const pct = Math.round(((price - cost) / price) * 100);
    return `${pct >= 0 ? '+' : ''}${pct} %`;
  }

  initForm() {
    this.productForm = this.fb.group({
      reference: [''],
      contenance: [''],
      name: ['', Validators.required],
      category: ['', Validators.required],
      subcategory: [''],
      brand: [''],
      price: ['', [Validators.required, Validators.min(0)]],
      cost_price: [''],
      compare_price: [''],
      stock: [0, [Validators.required, Validators.min(0)]],
      image_url: ['', Validators.required],
      description: ['']
    });
  }

  get imageValue(): string {
    return this.productForm?.get('image_url')?.value || '';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    this.uploading = true;
    this.api.post<{ url: string }>('uploads', formData).subscribe({
      next: (res) => {
        this.uploading = false;
        this.imagePreview = res.url;
        this.productForm.patchValue({ image_url: res.url });
        this.snackBar.open('Image envoyée avec succès', 'OK', { duration: 2500 });
      },
      error: (err) => {
        this.uploading = false;
        const msg = err?.error?.message || "Erreur lors de l'envoi de l'image";
        this.snackBar.open(msg, 'Fermer', { duration: 4000 });
      }
    });
    input.value = '';
  }

  loadProducts() {
    this.reload$.next();
  }

  resetPage() {
    this.pageIndex = 0;
    this.searchChange$.next();
  }

  onPageChange(index: number) {
    this.pageIndex = index;
    this.reload$.next();
  }

  toggleImport() {
    this.showImport = !this.showImport;
    if (!this.showImport) {
      this.importReport = null;
      this.importFileName = '';
    }
  }

  onCsvSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.importFileName = file.name;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('default_stock', String(this.defaultStock ?? 0));

    this.importing = true;
    this.importReport = null;
    this.api.post<any>('products/import', formData).subscribe({
      next: (report) => {
        this.importing = false;
        this.importReport = report;
        this.loadProducts();
        this.loadCategories();
        this.loadSummary();
        this.snackBar.open(
          `${report.created} produit(s) créé(s), ${report.updated} mis à jour`,
          'OK',
          { duration: 4000 }
        );
      },
      error: (err) => {
        this.importing = false;
        const msg = err?.error?.message || "Erreur lors de l'import du fichier";
        this.snackBar.open(msg, 'Fermer', { duration: 6000 });
      }
    });
    input.value = '';
  }

  downloadTemplate() {
    const rows = [
      'Ref;Categorie;SousCategorie;Designation;Contenance;Prix;PrixAchat;Image;Stock',
      'CS-INT-001;Accessoires Intérieur;;Support téléphone magnétique;universel;14,900;8,500;support.jpg;25',
      'CS-EXT-004;Accessoires Extérieur;4x4;Jerrycan métal 20 L;20 L;43,900;28,000;jerrycan.jpg;8',
      'CS-DET-001;Nettoyage & Detailing;;Shampoing carrosserie;1 L;19,900;11,000;https://exemple.com/shampoing.jpg;10'
    ];
    const blob = new Blob(['\ufeff' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modele-import-produits.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  goSection(id: 'general' | 'media' | 'pricing') {
    this.editorSection = id;
    document.getElementById('sec-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  sectionHint(id: string): boolean {
    if (id === 'media') return Boolean(this.imagePreview || this.imageValue);
    if (id === 'pricing') return Boolean(this.productForm?.get('price')?.value);
    if (id === 'general') return Boolean(this.productForm?.get('name')?.value);
    return false;
  }

  toggleForm() {
    this.showForm = !this.showForm;
    this.editorSection = 'general';
    if (!this.showForm) {
      this.isEditMode = false;
      this.editingProductId = null;
      this.imagePreview = '';
      this.productForm.reset({ stock: 0 });
    }
  }

  editProduct(product: any) {
    this.isEditMode = true;
    this.editingProductId = product.id;
    this.showForm = true;
    this.showImport = false;
    this.editorSection = 'general';
    this.imagePreview = product.image_url;
    this.productForm.patchValue({
      reference: product.reference,
      contenance: product.contenance,
      name: product.name,
      category: product.category,
      subcategory: product.subcategory || '',
      brand: product.brand,
      price: product.price,
      cost_price: product.cost_price,
      compare_price: product.compare_price,
      stock: product.stock,
      image_url: product.image_url,
      description: product.description
    });
  }

  saveProduct() {
    if (this.productForm.invalid) return;

    const payload = { ...this.productForm.value };
    if (payload.cost_price === '' || payload.cost_price === null) {
      payload.cost_price = null;
    }
    if (!payload.subcategory) payload.subcategory = null;

    if (this.isEditMode && this.editingProductId) {
      this.crud.update('products', this.editingProductId, payload).subscribe({
        next: () => {
          this.snackBar.open('Produit mis à jour avec succès', 'OK', { duration: 3000 });
          this.loadProducts();
          this.loadSummary();
          this.toggleForm();
        },
        error: () => {
          this.snackBar.open('Erreur lors de la mise à jour du produit', 'Fermer', { duration: 3000 });
        }
      });
    } else {
      this.crud.create('products', payload).subscribe({
        next: () => {
          this.snackBar.open('Produit créé avec succès', 'OK', { duration: 3000 });
          this.loadProducts();
          this.loadCategories();
          this.loadSummary();
          this.toggleForm();
        },
        error: () => {
          this.snackBar.open('Erreur lors de la création du produit', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  deleteProduct(id: string) {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      this.crud.delete('products', id).subscribe({
        next: () => {
          this.snackBar.open('Produit supprimé', 'OK', { duration: 3000 });
          this.loadProducts();
          this.loadSummary();
        },
        error: () => {
          this.snackBar.open('Erreur lors de la suppression du produit', 'Fermer', { duration: 3000 });
        }
      });
    }
  }
}
