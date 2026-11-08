import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { CrudService } from '../../services/crud.service';
import { SettingsService } from '../../services/settings.service';
import { FormatCurrencyPipe } from '../../pipes/format-currency.pipe';
import { ImageUrlPipe } from '../../pipes/image-url.pipe';
import { forkJoin } from 'rxjs';
import { BrandService } from '../../services/brand.service';

interface Period {
  value: string;
  label: string;
  shortLabel: string;
}

interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
  dash: number;
  offset: number;
  pct: number;
}

interface TopProduct {
  id: string;
  name: string;
  category: string;
  image: string;
  qty: number;
  revenue: number;
  profit: number | null;
  stock: number | null;
}

interface LowStock {
  id: string;
  name: string;
  category: string;
  image: string;
  stock: number;
}

const PERIODS: Period[] = [
  { value: '7d', label: '7 derniers jours', shortLabel: '7 jours' },
  { value: '30d', label: '30 derniers jours', shortLabel: '30 jours' },
  { value: '3m', label: '3 derniers mois', shortLabel: '3 mois' },
  { value: '12m', label: '12 derniers mois', shortLabel: '12 mois' },
  { value: 'all', label: 'Depuis le début', shortLabel: 'Tout' }
];

const STATUS_META: { key: string; label: string; color: string }[] = [
  { key: 'pending', label: 'En attente', color: '#c6a04a' },
  { key: 'confirmed', label: 'Confirmées', color: '#3d5a80' },
  { key: 'shipped', label: 'Expédiées', color: '#2a9d8f' },
  { key: 'delivered', label: 'Livrées', color: '#2e7d32' },
  { key: 'cancelled', label: 'Annulées', color: '#9e9e9e' }
];

const CATEGORY_COLORS = ['#c6a04a', '#3d5a80', '#2a9d8f', '#8d6e63', '#6d6875', '#b5838d'];
const LOW_STOCK = 3;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, RouterLink, FormatCurrencyPipe, ImageUrlPipe],
  template: `
    <div class="dashboard-container fade-in">
      <div class="header">
        <div class="header-text">
          <h1 class="luxury-title">Vue d'ensemble</h1>
          <p>Pilotage boutique {{ brand.name }}{{ brand.contact.city ? ' — ' + brand.contact.city : '' }}.</p>
        </div>

        <div class="period-filter" role="group" aria-label="Filtrer par période">
          <button type="button" *ngFor="let p of periods" class="period-btn"
                  [class.active]="selectedPeriod === p.value" (click)="onPeriodChange(p.value)">
            {{ p.shortLabel }}
          </button>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card" *ngFor="let m of metrics">
          <div class="metric-icon">
            <mat-icon>{{m.icon}}</mat-icon>
          </div>
          <div class="metric-info">
            <span class="metric-title">{{m.title}}</span>
            <span class="metric-value">{{m.value}}</span>
            <span class="metric-trend" [class.warn]="m.warn">{{m.trend}}</span>
          </div>
        </div>
      </div>

      <div class="charts-row">
        <mat-card class="chart-card glass-panel">
          <mat-card-header>
            <mat-card-title>Chiffre d'affaires — {{ periodLabel }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-empty" *ngIf="totalRevenue === 0">
              <mat-icon>show_chart</mat-icon>
              <p>Aucune vente sur cette période ({{ periodLabel.toLowerCase() }}).</p>
            </div>
            <svg *ngIf="totalRevenue > 0" viewBox="0 0 700 300" preserveAspectRatio="none" class="area-chart">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#c6a04a" stop-opacity="0.35" />
                  <stop offset="100%" stop-color="#c6a04a" stop-opacity="0.02" />
                </linearGradient>
              </defs>
              <line *ngFor="let grid of gridLines" [attr.x1]="0" [attr.x2]="chartWidth"
                    [attr.y1]="grid.y" [attr.y2]="grid.y" class="grid-line"/>
              <polygon [attr.points]="areaPoints" fill="url(#areaGradient)" stroke="none" />
              <polyline [attr.points]="linePoints" fill="none" class="chart-line" />
              <g *ngFor="let p of points">
                <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" class="chart-dot" />
                <text [attr.x]="p.x" [attr.y]="p.y - 12" text-anchor="middle" class="chart-value">{{p.value | formatCurrency}}</text>
                <text [attr.x]="p.x" [attr.y]="290" text-anchor="middle" class="chart-label">{{p.label}}</text>
              </g>
            </svg>
          </mat-card-content>
        </mat-card>

        <mat-card class="orders-summary glass-panel">
          <mat-card-header>
            <mat-card-title>Dernières commandes</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="order-item" *ngFor="let order of recentOrders">
              <div class="order-avatar">{{order.userInitial}}</div>
              <div class="order-details">
                <span class="order-user">{{order.user}}</span>
                <span class="order-time">{{order.time}} · {{order.statusLabel}}</span>
              </div>
              <span class="order-amount">{{order.amount | formatCurrency}}</span>
            </div>
            <div class="order-item empty" *ngIf="recentOrders.length === 0">
              <span class="order-time">Aucune commande sur cette période.</span>
            </div>
            <button mat-button color="primary" class="view-all" routerLink="/admin/orders">VOIR TOUTES LES COMMANDES</button>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="donuts-row">
        <mat-card class="donut-card glass-panel">
          <mat-card-header>
            <mat-card-title>Statuts des commandes</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="donut-empty" *ngIf="statusTotal === 0">
              <mat-icon>donut_large</mat-icon>
              <p>Aucune commande sur cette période.</p>
            </div>
            <div class="donut-wrap" *ngIf="statusTotal > 0">
              <svg viewBox="0 0 36 36" class="donut">
                <circle class="donut-bg" cx="18" cy="18" r="15.915"></circle>
                <circle *ngFor="let s of statusSlices" class="donut-seg"
                        cx="18" cy="18" r="15.915"
                        [attr.stroke]="s.color"
                        [attr.stroke-dasharray]="s.dash + ' ' + (100 - s.dash)"
                        [attr.stroke-dashoffset]="s.offset"></circle>
                <text x="18" y="16.8" text-anchor="middle" class="donut-num">{{ statusTotal }}</text>
                <text x="18" y="21.6" text-anchor="middle" class="donut-cap">cmd</text>
              </svg>
              <ul class="legend">
                <li *ngFor="let s of statusSlices">
                  <span class="swatch" [style.background]="s.color"></span>
                  <span class="leg-label">{{ s.label }}</span>
                  <span class="leg-val">{{ s.value }} · {{ s.pct }}%</span>
                </li>
              </ul>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="donut-card glass-panel">
          <mat-card-header>
            <mat-card-title>Ventes par catégorie</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="donut-empty" *ngIf="categoryTotal === 0">
              <mat-icon>category</mat-icon>
              <p>Pas encore de ventes catégorisées.</p>
            </div>
            <div class="donut-wrap" *ngIf="categoryTotal > 0">
              <svg viewBox="0 0 36 36" class="donut">
                <circle class="donut-bg" cx="18" cy="18" r="15.915"></circle>
                <circle *ngFor="let s of categorySlices" class="donut-seg"
                        cx="18" cy="18" r="15.915"
                        [attr.stroke]="s.color"
                        [attr.stroke-dasharray]="s.dash + ' ' + (100 - s.dash)"
                        [attr.stroke-dashoffset]="s.offset"></circle>
                <text x="18" y="16.8" text-anchor="middle" class="donut-num">{{ categoryTotal }}</text>
                <text x="18" y="21.6" text-anchor="middle" class="donut-cap">pcs</text>
              </svg>
              <ul class="legend">
                <li *ngFor="let s of categorySlices">
                  <span class="swatch" [style.background]="s.color"></span>
                  <span class="leg-label">{{ s.label }}</span>
                  <span class="leg-val">{{ s.value }} · {{ s.pct }}%</span>
                </li>
              </ul>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="lists-row">
        <mat-card class="list-card glass-panel">
          <mat-card-header>
            <mat-card-title>Meilleurs articles</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="list-empty" *ngIf="topProducts.length === 0">
              <mat-icon>inventory_2</mat-icon>
              <p>Aucun article commandé sur cette période.</p>
            </div>
            <a class="top-row" *ngFor="let p of topProducts; let i = index" routerLink="/admin/products">
              <span class="rank">{{ i + 1 }}</span>
              <img *ngIf="p.image" [src]="p.image | imageUrl" [alt]="p.name" class="thumb">
              <div class="thumb placeholder" *ngIf="!p.image"><mat-icon>image</mat-icon></div>
              <div class="top-info">
                <span class="top-name">{{ p.name }}</span>
                <span class="top-meta">{{ p.category }} · {{ p.qty }} vendus</span>
              </div>
              <span class="top-rev">
                {{ p.revenue | formatCurrency }}
                <small *ngIf="p.profit !== null">marge {{ p.profit | formatCurrency }}</small>
              </span>
            </a>
          </mat-card-content>
        </mat-card>

        <mat-card class="list-card glass-panel">
          <mat-card-header>
            <mat-card-title>Stock bas</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="list-empty" *ngIf="lowStock.length === 0">
              <mat-icon>check_circle</mat-icon>
              <p>Aucun produit sous le seuil ({{ lowStockThreshold }}).</p>
            </div>
            <a class="stock-row" *ngFor="let p of lowStock" routerLink="/admin/stock">
              <img *ngIf="p.image" [src]="p.image | imageUrl" [alt]="p.name" class="thumb">
              <div class="thumb placeholder" *ngIf="!p.image"><mat-icon>image</mat-icon></div>
              <div class="top-info">
                <span class="top-name">{{ p.name }}</span>
                <span class="top-meta">{{ p.category }}</span>
              </div>
              <span class="stock-badge" [class.out]="p.stock <= 0">
                {{ p.stock <= 0 ? 'Rupture' : p.stock + ' restants' }}
              </span>
            </a>
            <button mat-button class="view-all" routerLink="/admin/stock">GÉRER LE STOCK</button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 0; min-width: 0; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 50px; flex-wrap: wrap; }
    .header h1 { font-size: 2.8rem; margin-bottom: 10px; font-family: var(--font-heading); color: var(--luxe-black); }
    .header p { color: var(--luxe-text-muted); font-size: 1.05rem; font-weight: 300; margin: 0; }

    .period-filter { display: flex; gap: 8px; background: var(--luxe-offwhite); padding: 6px; border-radius: var(--radius-full); border: 1px solid var(--luxe-border); flex-wrap: wrap; }
    .period-btn {
      border: none; background: transparent; cursor: pointer; padding: 10px 20px;
      font-family: var(--font-body); font-size: 0.78rem; font-weight: 600; letter-spacing: 1px;
      text-transform: uppercase; color: var(--luxe-text-muted); border-radius: var(--radius-full);
      transition: var(--transition-smooth); white-space: nowrap;
    }
    .period-btn:hover { color: var(--luxe-charcoal); }
    .period-btn.active { background: var(--luxe-black); color: var(--luxe-white); box-shadow: var(--shadow-card); }

    .metrics-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 22px; margin-bottom: 40px; }
    .metric-card { background: var(--luxe-white); padding: 30px; border-radius: var(--radius-md); border: 1px solid var(--luxe-border); display: flex; gap: 20px; align-items: center; box-shadow: var(--shadow-subtle); transition: var(--transition-smooth); }
    .metric-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-hover); }
    .metric-icon { width: 55px; height: 55px; border-radius: var(--radius-md); background: var(--luxe-offwhite); color: var(--luxe-charcoal); border: 1px solid var(--luxe-border); display: flex; align-items: center; justify-content: center; }
    .metric-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .metric-title { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: var(--luxe-text-muted); display: block; margin-bottom: 8px; font-weight: 500; }
    .metric-value { font-size: 1.8rem; font-weight: 400; color: var(--luxe-black); display: block; font-family: var(--font-heading); }
    .metric-trend { font-size: 0.75rem; margin-top: 8px; display: block; font-weight: 500; color: #2e7d32; }
    .metric-trend.warn { color: #b45309; }

    .charts-row, .donuts-row, .lists-row { display: grid; grid-template-columns: 2fr 1fr; gap: 40px; margin-bottom: 40px; }
    .donuts-row, .lists-row { grid-template-columns: 1fr 1fr; }
    .chart-card, .orders-summary, .donut-card, .list-card {
      border-radius: var(--radius-md); padding: 30px; border: 1px solid var(--luxe-border);
      box-shadow: var(--shadow-subtle) !important; background: var(--luxe-white) !important;
    }
    mat-card-header { padding: 0 0 20px 0 !important; border-bottom: 1px solid var(--luxe-border); margin-bottom: 20px; }
    mat-card-title { font-family: var(--font-body) !important; font-size: 1.1rem !important; letter-spacing: 2px; text-transform: uppercase; font-weight: 600 !important; color: var(--luxe-charcoal); }

    .area-chart { width: 100%; height: 280px; }
    .grid-line { stroke: var(--luxe-border); stroke-width: 1; stroke-dasharray: 4 4; }
    .chart-line { stroke: var(--luxe-gold); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
    .chart-dot { fill: var(--luxe-gold); stroke: white; stroke-width: 2; }
    .chart-value { fill: var(--luxe-charcoal); font-size: 12px; font-weight: 600; }
    .chart-label { fill: var(--luxe-text-muted); font-size: 13px; font-weight: 500; }
    .chart-empty, .donut-empty, .list-empty { text-align: center; padding: 70px 20px; color: var(--luxe-text-muted); }
    .chart-empty mat-icon, .donut-empty mat-icon, .list-empty mat-icon { font-size: 3.5rem; width: 56px; height: 56px; margin-bottom: 12px; }

    .order-item { display: flex; align-items: center; gap: 20px; padding: 20px 0; border-bottom: 1px solid var(--luxe-border); }
    .order-item:last-child { border-bottom: none; }
    .order-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--luxe-offwhite); border: 1px solid var(--luxe-border); display: flex; align-items: center; justify-content: center; font-weight: 500; color: var(--luxe-charcoal); font-size: 0.85rem; }
    .order-details { flex: 1; }
    .order-user { display: block; font-weight: 500; font-size: 0.95rem; color: var(--luxe-black); margin-bottom: 4px; }
    .order-time { font-size: 0.8rem; color: var(--luxe-text-muted); }
    .order-amount { font-weight: 600; color: var(--luxe-charcoal); font-size: 1.05rem; }

    .donut-wrap { display: flex; align-items: center; gap: 28px; padding: 8px 0 4px; }
    .donut { width: 168px; height: 168px; flex-shrink: 0; }
    .donut-bg { fill: none; stroke: var(--luxe-offwhite); stroke-width: 3.2; }
    .donut-seg { fill: none; stroke-width: 3.2; stroke-linecap: butt; transform: rotate(-90deg); transform-origin: 18px 18px; }
    .donut-num { font-size: 6px; font-weight: 600; fill: var(--luxe-black); font-family: var(--font-heading); }
    .donut-cap { font-size: 2.6px; letter-spacing: 0.4px; text-transform: uppercase; fill: var(--luxe-text-muted); }
    .legend { list-style: none; margin: 0; padding: 0; flex: 1; display: flex; flex-direction: column; gap: 10px; }
    .legend li { display: flex; align-items: center; gap: 10px; font-size: 0.86rem; }
    .swatch { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .leg-label { flex: 1; color: var(--luxe-charcoal); }
    .leg-val { color: var(--luxe-text-muted); font-size: 0.78rem; white-space: nowrap; }

    .top-row, .stock-row {
      display: flex; align-items: center; gap: 14px; padding: 14px 0;
      border-bottom: 1px solid var(--luxe-border); text-decoration: none; color: inherit;
    }
    .top-row:last-child, .stock-row:last-child { border-bottom: none; }
    .top-row:hover .top-name, .stock-row:hover .top-name { color: var(--luxe-gold); }
    .rank {
      width: 22px; font-family: var(--font-heading); font-size: 1.05rem; color: var(--luxe-gold); text-align: center;
    }
    .thumb { width: 44px; height: 44px; object-fit: cover; border-radius: 8px; border: 1px solid var(--luxe-border); background: var(--luxe-offwhite); }
    .thumb.placeholder { display: flex; align-items: center; justify-content: center; color: var(--luxe-text-muted); }
    .thumb.placeholder mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .top-info { flex: 1; min-width: 0; }
    .top-name { display: block; font-weight: 500; font-size: 0.92rem; color: var(--luxe-black); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .top-meta { font-size: 0.76rem; color: var(--luxe-text-muted); }
    .top-rev { font-weight: 600; color: var(--luxe-charcoal); font-size: 0.92rem; white-space: nowrap; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .top-rev small { font-weight: 500; font-size: 0.7rem; color: #2e7d32; }
    .stock-badge {
      font-size: 0.72rem; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase;
      padding: 6px 10px; border-radius: var(--radius-full); background: #fff7ed; color: #b45309; white-space: nowrap;
    }
    .stock-badge.out { background: #fef2f2; color: #b91c1c; }

    .view-all { width: 100%; margin-top: 20px; letter-spacing: 2px; border: 1px solid var(--luxe-border) !important; color: var(--luxe-charcoal) !important; border-radius: var(--radius-sm) !important; padding: 10px !important; }
    .view-all:hover { background: var(--luxe-black) !important; color: var(--luxe-white) !important; }

    @media (max-width: 1200px) {
      .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .charts-row, .donuts-row, .lists-row { grid-template-columns: 1fr; }
      .header { flex-direction: column; }
      .period-filter { width: 100%; overflow-x: auto; }
    }
    @media (max-width: 640px) {
      .metrics-grid { grid-template-columns: 1fr; gap: 12px; }
      .header h1 { font-size: 1.8rem; }
      .metric-card { padding: 18px; }
      .donut-wrap { flex-direction: column; align-items: stretch; }
      .donut { margin: 0 auto; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  periods = PERIODS;
  selectedPeriod = '7d';
  lowStockThreshold = LOW_STOCK;

  metrics: { title: string; value: string; icon: string; trend: string; warn?: boolean }[] = [];
  points: { x: number; y: number; label: string; value: number }[] = [];
  linePoints = '';
  areaPoints = '';
  gridLines: { y: number }[] = [];
  recentOrders: { user: string; userInitial: string; time: string; amount: string; statusLabel: string }[] = [];
  topProducts: TopProduct[] = [];
  lowStock: LowStock[] = [];
  statusSlices: DonutSlice[] = [];
  categorySlices: DonutSlice[] = [];
  statusTotal = 0;
  categoryTotal = 0;
  totalRevenue = 0;
  private ordersData: any[] = [];
  private productsData: any[] = [];

  readonly chartWidth = 700;
  readonly chartHeight = 300;

  constructor(private crud: CrudService, private settings: SettingsService, public brand: BrandService) {}

  get periodLabel(): string {
    return this.periods.find(p => p.value === this.selectedPeriod)?.label || '';
  }

  ngOnInit() {
    this.settings.currency$.subscribe(() => {
      if (this.ordersData.length || this.productsData.length) {
        this.recalculateAll();
      }
    });
    this.loadDashboardData();
  }

  loadDashboardData() {
    forkJoin({
      orders: this.crud.getAll<any>('orders'),
      products: this.crud.getPage<any>('products', { limit: 100 })
    }).subscribe({
      next: ({ orders, products }) => {
        this.ordersData = Array.isArray(orders) ? orders : [];
        this.productsData = Array.isArray(products) ? products : (products?.data || []);
        this.recalculateAll();
      },
      error: (err) => {
        console.error('Error loading dashboard data', err);
      }
    });
  }

  onPeriodChange(period: string) {
    this.selectedPeriod = period;
    this.recalculateAll();
  }

  private recalculateAll() {
    const filtered = this.filterByPeriod(this.ordersData);
    this.calculateMetrics(filtered);
    this.calculateChart(filtered);
    this.calculateRecentOrders(filtered);
    this.calculateStatusDonut(filtered);
    this.calculateCategoryDonut(filtered);
    this.calculateTopProducts(filtered);
    this.calculateLowStock();
  }

  private getPeriodStart(): Date | null {
    const now = new Date();
    switch (this.selectedPeriod) {
      case '7d': return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      case '30d': return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      case '3m': return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      case '12m': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      default: return null;
    }
  }

  private filterByPeriod(orders: any[]): any[] {
    const start = this.getPeriodStart();
    if (!start) return orders;
    return orders.filter(o => new Date(o.createdAt || o.created_at) >= start);
  }

  private activeOrders(orders: any[]): any[] {
    return orders.filter(o => o.status !== 'cancelled');
  }

  calculateMetrics(orders: any[]) {
    const active = this.activeOrders(orders);
    const revenue = active.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    const pending = orders.filter(o => o.status === 'pending').length;
    const aov = active.length ? revenue / active.length : 0;
    const { profit, missing } = this.periodProfit(active);
    const symbol = this.settings.currency.symbol;

    this.metrics = [
      {
        title: 'Chiffre d\'affaires',
        value: `${revenue.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${symbol}`,
        icon: 'payments',
        trend: this.periodLabel
      },
      {
        title: 'Profit',
        value: `${profit.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${symbol}`,
        icon: 'trending_up',
        trend: missing ? `${missing} ligne(s) sans prix d'achat` : 'Vente − achat',
        warn: missing > 0
      },
      {
        title: 'Commandes',
        value: String(orders.length),
        icon: 'shopping_cart',
        trend: `${active.length} actives — ${this.periodLabel.toLowerCase()}`
      },
      {
        title: 'Panier moyen',
        value: `${aov.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`,
        icon: 'account_balance_wallet',
        trend: 'CA ÷ commandes actives'
      },
      {
        title: 'En attente',
        value: String(pending),
        icon: 'hourglass_empty',
        trend: pending ? 'À traiter' : 'RAS',
        warn: pending > 0
      }
    ];
  }

  private buildBuckets(): { label: string; from: Date; to: Date; value: number }[] {
    const now = new Date();
    const daysShort = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const monthsShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const buckets: { label: string; from: Date; to: Date; value: number }[] = [];

    if (this.selectedPeriod === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const from = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const to = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        buckets.push({ label: i === 0 ? 'Auj.' : daysShort[d.getDay()], from, to, value: 0 });
      }
    } else if (this.selectedPeriod === '30d') {
      for (let i = 5; i >= 0; i--) {
        const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 5, 23, 59, 59, 999);
        const from = new Date(to.getFullYear(), to.getMonth(), to.getDate() - 4);
        buckets.push({ label: `${from.getDate()}/${from.getMonth() + 1}`, from, to, value: 0 });
      }
    } else if (this.selectedPeriod === '3m') {
      for (let i = 11; i >= 0; i--) {
        const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7, 23, 59, 59, 999);
        const from = new Date(to.getFullYear(), to.getMonth(), to.getDate() - 6);
        buckets.push({ label: `${from.getDate()}/${from.getMonth() + 1}`, from, to, value: 0 });
      }
    } else if (this.selectedPeriod === '12m') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const from = new Date(d.getFullYear(), d.getMonth(), 1);
        const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        buckets.push({ label: monthsShort[d.getMonth()], from, to, value: 0 });
      }
    } else {
      const earliest = this.ordersData.length
        ? this.ordersData.reduce((min: Date, o: any) => {
            const d = new Date(o.createdAt || o.created_at);
            return d < min ? d : min;
          }, new Date(now.getFullYear(), now.getMonth(), 1))
        : now;

      const cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
      const monthCursors: Date[] = [];
      while (cursor <= now) {
        monthCursors.push(new Date(cursor));
        cursor.setMonth(cursor.getMonth() + 1);
      }
      monthCursors.slice(-24).forEach(d => {
        const from = new Date(d.getFullYear(), d.getMonth(), 1);
        const to = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        buckets.push({ label: `${monthsShort[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, from, to, value: 0 });
      });
    }

    return buckets;
  }

  calculateChart(orders: any[]) {
    const buckets = this.buildBuckets();
    const activeOrders = this.activeOrders(orders);

    activeOrders.forEach(o => {
      const date = new Date(o.createdAt || o.created_at);
      const bucket = buckets.find(b => date >= b.from && date <= b.to);
      if (bucket) bucket.value += parseFloat(o.total_amount || 0);
    });

    this.totalRevenue = Math.round(buckets.reduce((s, b) => s + b.value, 0));

    const padX = 30;
    const padTop = 40;
    const padBottom = 35;
    const innerH = this.chartHeight - padTop - padBottom;
    const step = buckets.length > 1 ? (this.chartWidth - padX * 2) / (buckets.length - 1) : 0;
    const maxValue = Math.max(...buckets.map(b => b.value), 1);

    this.points = buckets.map((b, i) => ({
      x: padX + i * step,
      y: padTop + innerH - (b.value / maxValue) * innerH,
      label: b.label,
      value: Math.round(b.value)
    }));

    this.linePoints = this.points.map(p => `${p.x},${p.y}`).join(' ');
    this.areaPoints = `${padX},${padTop + innerH} ${this.linePoints} ${this.chartWidth - padX},${padTop + innerH}`;

    this.gridLines = [0, 1, 2, 3].map(i => ({
      y: padTop + (innerH * i) / 3
    }));
  }

  calculateRecentOrders(orders: any[]) {
    const sorted = [...orders].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at).getTime();
      const dateB = new Date(b.createdAt || b.created_at).getTime();
      return dateB - dateA;
    });

    this.recentOrders = sorted.slice(0, 6).map(o => {
      const userObj = o.User || o.user;
      const guest = String(o.guest_name || '').trim();
      const name = userObj
        ? `${userObj.first_name} ${(userObj.last_name || '').charAt(0)}.`.trim()
        : (guest || 'Invité');
      const userInitial = (userObj?.first_name || guest || 'I').charAt(0).toUpperCase();

      return {
        user: name,
        userInitial,
        time: this.relativeTime(o.createdAt || o.created_at),
        amount: parseFloat(o.total_amount || 0).toFixed(2),
        statusLabel: STATUS_META.find(s => s.key === o.status)?.label || o.status || ''
      };
    });
  }

  calculateStatusDonut(orders: any[]) {
    const counts = new Map<string, number>();
    orders.forEach(o => counts.set(o.status, (counts.get(o.status) || 0) + 1));
    const rows = STATUS_META
      .map(meta => ({ ...meta, value: counts.get(meta.key) || 0 }))
      .filter(row => row.value > 0);
    this.statusTotal = rows.reduce((s, r) => s + r.value, 0);
    this.statusSlices = this.toDonut(rows);
  }

  calculateCategoryDonut(orders: any[]) {
    const counts = new Map<string, number>();
    this.activeOrders(orders).forEach(order => {
      (order.items || []).forEach((item: any) => {
        const product = item.Product || item.product;
        const category = String(product?.category || item.category || 'Autres').trim() || 'Autres';
        counts.set(category, (counts.get(category) || 0) + Number(item.quantity || 0));
      });
    });
    const rows = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({
        key: label,
        label,
        value,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
      }));
    this.categoryTotal = rows.reduce((s, r) => s + r.value, 0);
    this.categorySlices = this.toDonut(rows);
  }

  calculateTopProducts(orders: any[]) {
    const map = new Map<string, TopProduct>();
    this.activeOrders(orders).forEach(order => {
      (order.items || []).forEach((item: any) => {
        const product = item.Product || item.product || {};
        const id = String(item.product_id || product.id || '');
        if (!id) return;
        const qty = Number(item.quantity || 0);
        const unit = Number(item.unit_price || product.price || 0);
        const current = map.get(id) || {
          id,
          name: product.name || 'Article',
          category: product.category || 'Autres',
          image: product.image_url || '',
          qty: 0,
          revenue: 0,
          profit: 0,
          stock: product.stock == null ? null : Number(product.stock)
        };
        current.qty += qty;
        current.revenue += qty * unit;
        const cost = this.lineCost(item);
        if (cost === null) current.profit = current.profit === 0 ? null : current.profit;
        else if (current.profit !== null) current.profit += (unit - cost) * qty;
        map.set(id, current);
      });
    });
    this.topProducts = [...map.values()]
      .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
      .slice(0, 5);
  }

  calculateLowStock() {
    this.lowStock = this.productsData
      .filter(p => Number(p.stock) <= LOW_STOCK)
      .sort((a, b) => Number(a.stock) - Number(b.stock))
      .slice(0, 6)
      .map(p => ({
        id: p.id,
        name: p.name,
        category: p.category || 'Autres',
        image: p.image_url || '',
        stock: Number(p.stock)
      }));
  }

  private lineCost(item: any): number | null {
    const snap = item?.unit_cost;
    if (snap !== null && snap !== undefined && snap !== '') {
      const n = Number(snap);
      return Number.isFinite(n) ? n : null;
    }
    const product = item?.Product || item?.product;
    if (product?.cost_price !== null && product?.cost_price !== undefined && product?.cost_price !== '') {
      const n = Number(product.cost_price);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  private periodProfit(orders: any[]): { profit: number; missing: number } {
    let profit = 0;
    let missing = 0;
    orders.forEach(order => {
      (order.items || []).forEach((item: any) => {
        const qty = Number(item.quantity || 0);
        const unit = Number(item.unit_price || 0);
        const cost = this.lineCost(item);
        if (cost === null) missing += 1;
        else profit += (unit - cost) * qty;
      });
    });
    return { profit, missing };
  }

  private toDonut(rows: { key: string; label: string; value: number; color: string }[]): DonutSlice[] {
    const total = rows.reduce((s, r) => s + r.value, 0) || 1;
    let acc = 0;
    return rows.map(row => {
      const pct = Math.round((row.value / total) * 100);
      const slice: DonutSlice = {
        ...row,
        dash: pct,
        offset: -acc,
        pct
      };
      acc += pct;
      return slice;
    });
  }

  private relativeTime(raw: string): string {
    const diffMins = Math.floor((Date.now() - new Date(raw).getTime()) / 60000);
    if (diffMins < 1) return 'à l’instant';
    if (diffMins < 60) return `il y a ${diffMins} min`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `il y a ${diffHrs}h`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 30) return `il y a ${diffDays}j`;
    return `il y a ${Math.floor(diffDays / 30)} mois`;
  }
}
