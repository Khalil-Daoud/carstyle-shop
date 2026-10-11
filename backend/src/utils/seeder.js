const Product = require('../models/Product');
const Category = require('../models/Category');
const Setting = require('../models/Setting');

const CATEGORIES = [
  { name: 'Accessoires Intérieur', description: 'Confort, rangement et style à bord.' },
  { name: 'Accessoires Extérieur', description: 'Protection et personnalisation de la carrosserie.' },
  { name: 'Nettoyage & Detailing', description: 'Shampoings, polish, vitres et sealants.' },
  { name: 'Entretien', description: 'Additifs moteur, rinçages et soins mécaniques.' },
  { name: 'Électronique', description: 'Supports, chargeurs et aides à la conduite.' },
  { name: 'Promotions', description: 'Offres du moment et packs avantageux.' }
];

const PRODUCTS = [
  {
    reference: 'CS-INT-001',
    name: 'Support téléphone magnétique 360°',
    contenance: 'Grille d’aération · universel',
    description: 'Support magnétique rotatif pour grille d’aération. Maintien ferme, rotation 360°, installation sans outil. Idéal GPS et appels en conduite.',
    price: 14.90,
    compare_price: 20.00,
    brand: 'Universel',
    stock: 80,
    category: 'Accessoires Intérieur',
    image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=900'
  },
  {
    reference: 'CS-INT-002',
    name: 'Organiseur de dossier siège',
    contenance: 'Universel',
    description: 'Organiseur de dossier avec compartiments et porte-tablette. Range bouteilles, documents et tablette pour les passagers arrière.',
    price: 64.90,
    brand: 'Carstyle',
    stock: 35,
    category: 'Accessoires Intérieur',
    image_url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=900'
  },
  {
    reference: 'CS-INT-003',
    name: 'Housse d’accoudoir cuir PU',
    contenance: 'Universelle',
    description: 'Housse d’accoudoir imperméable en cuir PU. Protège l’accoudoir d’origine et habille l’habitacle.',
    price: 29.90,
    brand: 'Universel',
    stock: 50,
    category: 'Accessoires Intérieur',
    image_url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=900'
  },
  {
    reference: 'CS-EXT-001',
    name: 'Profils protection seuil aspect carbone',
    contenance: '480 × 55 mm',
    description: 'Bandeaux adhésifs aspect carbone pour seuils de porte. Protègent la peinture des rayures à l’entrée et à la sortie.',
    price: 19.90,
    brand: 'Carstyle',
    stock: 70,
    category: 'Accessoires Extérieur',
    image_url: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&q=80&w=900'
  },
  {
    reference: 'CS-EXT-002',
    name: 'Pare-soleil avant double couche',
    contenance: 'Pare-brise',
    description: 'Pare-soleil avant à double couche pour bloquer chaleur et UV. Se plie et se range facilement.',
    price: 32.90,
    brand: 'Universel',
    stock: 60,
    category: 'Accessoires Extérieur',
    image_url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=900'
  },
  {
    reference: 'CS-EXT-003',
    name: 'Kit film de protection PPF — zones exposées',
    contenance: 'Capot / pare-chocs / rétros',
    description: 'Film PPF transparent pour les zones les plus exposées. Pose conseillée à l’atelier Carstyle Le Bardo.',
    price: 189.00,
    compare_price: 249.00,
    brand: 'Atelier',
    stock: 12,
    category: 'Accessoires Extérieur',
    image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=900'
  },
  {
    reference: 'CS-CLN-001',
    name: 'Shampooing auto moussant',
    contenance: '500 ml',
    description: 'Shampooing moussant pour lavage carrosserie. Mousse dense, rinçage facile, limite les micro-rayures.',
    price: 39.90,
    brand: 'Pro Detailing',
    stock: 90,
    category: 'Nettoyage & Detailing',
    image_url: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=900'
  },
  {
    reference: 'CS-CLN-002',
    name: 'Nettoyant vitres anti-traces',
    contenance: '250 ml',
    description: 'Nettoyant vitres sans traces pour pare-brise et glaces. Compatible intérieur / extérieur, y compris après pose de film.',
    price: 25.90,
    brand: 'Pro Detailing',
    stock: 100,
    category: 'Nettoyage & Detailing',
    image_url: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=900'
  },
  {
    reference: 'CS-CLN-003',
    name: 'Sealant hydrophobe carrosserie',
    contenance: '500 ml',
    description: 'Sealant en spray après lavage. Perlage immédiat, protection plusieurs semaines. Compatible covering et peinture.',
    price: 79.90,
    compare_price: 99.90,
    brand: 'Pro Detailing',
    stock: 40,
    category: 'Nettoyage & Detailing',
    image_url: 'https://images.unsplash.com/photo-1619642751034-96005ee1544d?auto=format&fit=crop&q=80&w=900'
  },
  {
    reference: 'CS-ELC-001',
    name: 'Chargeur allume-cigare 36W',
    contenance: 'USB-C + USB-A',
    description: 'Chargeur 36W avec protection contre les surtensions. Compatible smartphones et tablettes.',
    price: 19.90,
    brand: 'Universel',
    stock: 85,
    category: 'Électronique',
    image_url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=900'
  },
  {
    reference: 'CS-ELC-002',
    name: 'Caméra de recul LED',
    contenance: 'Vision nocturne',
    description: 'Caméra de recul étanche avec LEDs. Angle large, branchement écran multimédia ou moniteur.',
    price: 89.90,
    compare_price: 119.90,
    brand: 'Carstyle',
    stock: 25,
    category: 'Électronique',
    image_url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=900'
  },
  {
    reference: 'CS-ENT-001',
    name: 'Nettoyant injecteurs Diesel',
    contenance: '250 ml',
    description: 'Additif nettoyant injecteurs diesel. Aide à réduire la consommation et à lisser le ralenti.',
    price: 26.90,
    brand: 'Pro Line',
    stock: 70,
    category: 'Entretien',
    image_url: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=900'
  },
  {
    reference: 'CS-ENT-002',
    name: 'Rinçage moteur avant vidange',
    contenance: '300 ml',
    description: 'Rinçage moteur avant vidange. Dissout les dépôts et prépare l’huile neuve.',
    price: 27.90,
    brand: 'Pro Line',
    stock: 65,
    category: 'Entretien',
    image_url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=900'
  },
  {
    reference: 'CS-PRO-001',
    name: 'Pack Detailing atelier',
    contenance: 'Shampooing + vitres + sealant',
    description: 'Trio recommandé par l’atelier : shampooing, nettoyant vitres et sealant. Pour un entretien maison après une pose Carstyle.',
    price: 89.90,
    compare_price: 145.70,
    brand: 'Atelier',
    stock: 20,
    category: 'Promotions',
    image_url: 'https://images.unsplash.com/photo-1520340354183-d01157abe296?auto=format&fit=crop&q=80&w=900'
  },
  {
    reference: 'CS-PRO-002',
    name: 'Pack confort habitacle',
    contenance: 'Support + accoudoir + organiseur',
    description: 'Pack promo : support téléphone, housse d’accoudoir et organiseur de dossier.',
    price: 89.90,
    compare_price: 109.70,
    brand: 'Carstyle',
    stock: 15,
    category: 'Promotions',
    image_url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=900'
  }
];

const seedData = async () => {
  try {
    console.log('🌱 Cleaning and seeding Carstyle catalog...');

    await Product.destroy({ where: {}, truncate: { cascade: true } });
    await Category.destroy({ where: {}, truncate: { cascade: true } });

    await Category.bulkCreate(CATEGORIES);
    await Product.bulkCreate(PRODUCTS);

    await Setting.upsert({ key: 'currency', value: 'TND' });
    await Setting.upsert({ key: 'guest_checkout', value: 'true' });
    await Setting.upsert({ key: 'whatsapp_number', value: '21653933751' });
    await Setting.upsert({ key: 'whatsapp_invite', value: 'true' });
    await Setting.upsert({ key: 'hero_type', value: 'video' });
    await Setting.upsert({ key: 'hero_video_url', value: 'assets/vids/hero-720.mp4' });
    await Setting.upsert({ key: 'hero_image_url', value: 'assets/vids/hero-poster.webp' });
    await Setting.upsert({ key: 'hero_poster_url', value: 'assets/vids/hero-poster.webp' });

    console.log(`✅ Seed complete: ${CATEGORIES.length} catégories, ${PRODUCTS.length} produits.`);
  } catch (error) {
    console.error('❌ Seed error:', error);
  }
};

module.exports = seedData;
