const Setting = require('../models/Setting');
const loyaltyService = require('./loyaltyService');

const CURRENCIES = {
  EUR: { code: 'EUR', symbol: '€', label: 'Euro' },
  USD: { code: 'USD', symbol: '$', label: 'Dollar US' },
  TND: { code: 'TND', symbol: 'DT', label: 'Dinar Tunisien' }
};

// Numéro affiché dans le pied de page et la page contact du site.
const DEFAULT_WHATSAPP_NUMBER = '21653933751';

async function getCurrency() {
  const setting = await Setting.findByPk('currency');
  const code = setting?.value || 'TND';
  return CURRENCIES[code] || CURRENCIES.TND;
}

async function setCurrency(code) {
  if (!CURRENCIES[code]) {
    throw new Error('Devise invalide. Valeurs autorisées : EUR, USD, TND');
  }
  await Setting.upsert({ key: 'currency', value: code });
  return CURRENCIES[code];
}

// Commande sans compte : activée par défaut (parcours Tunisie / WhatsApp).
async function getGuestCheckout() {
  const setting = await Setting.findByPk('guest_checkout');
  if (!setting) return true;
  return setting.value === 'true';
}

async function setGuestCheckout(enabled) {
  await Setting.upsert({ key: 'guest_checkout', value: enabled ? 'true' : 'false' });
  return enabled;
}

// WhatsApp attend un numéro international sans "+" ni séparateur : 21622580632
function normalizeWhatsAppNumber(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  // Mobile / fixe tunisien saisi sans indicatif (8 chiffres) ou avec 0.
  if (digits.length === 9 && digits.startsWith('0')) digits = `216${digits.slice(1)}`;
  if (digits.length === 8) digits = `216${digits}`;
  return digits.length >= 11 ? digits : null;
}

async function getWhatsAppNumber() {
  const setting = await Setting.findByPk('whatsapp_number');
  return setting?.value || normalizeWhatsAppNumber(process.env.WHATSAPP_TO_NUMBER) || DEFAULT_WHATSAPP_NUMBER;
}

async function setWhatsAppNumber(raw) {
  const number = normalizeWhatsAppNumber(raw);
  if (!number) {
    throw new Error('Numéro WhatsApp invalide. Indiquez l’indicatif pays, ex : +216 22 580 632');
  }
  await Setting.upsert({ key: 'whatsapp_number', value: number });
  return number;
}

async function getNotifyCustomer() {
  const setting = await Setting.findByPk('whatsapp_notify_customer');
  return setting?.value === 'true';
}

async function setNotifyCustomer(enabled) {
  await Setting.upsert({ key: 'whatsapp_notify_customer', value: enabled ? 'true' : 'false' });
  return enabled;
}

// Le client peut envoyer le récapitulatif à la boutique (lien wa.me). Activé par défaut.
async function getWhatsAppInvite() {
  const setting = await Setting.findByPk('whatsapp_invite');
  if (!setting) return true;
  return setting.value === 'true';
}

async function setWhatsAppInvite(enabled) {
  await Setting.upsert({ key: 'whatsapp_invite', value: enabled ? 'true' : 'false' });
  return enabled;
}

async function getSettingValue(key) {
  const row = await Setting.findByPk(key);
  return row?.value ? String(row.value).trim() : '';
}

async function getCallMeBotKey() {
  return process.env.CALLMEBOT_API_KEY || (await getSettingValue('whatsapp_callmebot_key')) || '';
}

async function getUltramsgConfig() {
  return {
    instance: process.env.WHATSAPP_ULTRAMSG_INSTANCE || (await getSettingValue('whatsapp_ultramsg_instance')) || '',
    token: process.env.WHATSAPP_ULTRAMSG_TOKEN || (await getSettingValue('whatsapp_ultramsg_token')) || ''
  };
}

async function setWhatsAppGateway({ callmebotKey, ultramsgInstance, ultramsgToken } = {}) {
  if (callmebotKey !== undefined) {
    await Setting.upsert({ key: 'whatsapp_callmebot_key', value: String(callmebotKey || '').trim() });
  }
  if (ultramsgInstance !== undefined) {
    await Setting.upsert({ key: 'whatsapp_ultramsg_instance', value: String(ultramsgInstance || '').trim() });
  }
  if (ultramsgToken !== undefined && String(ultramsgToken).trim()) {
    await Setting.upsert({ key: 'whatsapp_ultramsg_token', value: String(ultramsgToken).trim() });
  }
  return getWhatsAppGatewayForAdmin();
}

async function getWhatsAppGatewayForAdmin() {
  const [callmebotKey, ultramsg] = await Promise.all([getCallMeBotKey(), getUltramsgConfig()]);
  return {
    callmebotKey,
    ultramsgInstance: ultramsg.instance,
    ultramsgToken: ultramsg.token,
    ready: Boolean(
      callmebotKey
      || (ultramsg.instance && ultramsg.token)
      || (process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_CLOUD_PHONE_ID)
      || (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM)
      || process.env.WHATSAPP_WEBHOOK_URL
    )
  };
}

async function getLoyaltyTiers() {
  const setting = await Setting.findByPk('loyalty_tiers');
  if (!setting?.value) return loyaltyService.DEFAULT_TIERS;
  try {
    return loyaltyService.normalizeTiers(JSON.parse(setting.value));
  } catch {
    return loyaltyService.DEFAULT_TIERS;
  }
}

async function setLoyaltyTiers(raw) {
  const tiers = loyaltyService.normalizeTiers(raw);
  await Setting.upsert({ key: 'loyalty_tiers', value: JSON.stringify(tiers) });
  return tiers;
}

const CHECKOUT_FIELD_TYPES = ['text', 'textarea', 'email', 'tel'];
const BUILTIN_CHECKOUT_FIELDS = [
  { id: 'guestName', type: 'text', label: 'Nom et prénom', enabled: true, required: true, builtin: true, guestOnly: true },
  { id: 'guestEmail', type: 'email', label: 'Email (optionnel)', enabled: true, required: false, builtin: true, guestOnly: true },
  { id: 'address', type: 'textarea', label: 'Adresse de livraison', enabled: true, required: true, builtin: true },
  { id: 'phone', type: 'tel', label: 'Numéro de téléphone', enabled: true, required: true, builtin: true },
  { id: 'notes', type: 'textarea', label: 'Remarque', enabled: false, required: false, builtin: true }
];
const BUILTIN_CHECKOUT_IDS = new Set(BUILTIN_CHECKOUT_FIELDS.map((f) => f.id));

function coerceBool(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return fallback;
}

function normalizeCheckoutFields(raw) {
  const incoming = Array.isArray(raw) ? raw : [];
  const byId = new Map(incoming.filter((f) => f && f.id).map((f) => [String(f.id), f]));
  const builtins = BUILTIN_CHECKOUT_FIELDS.map((def) => {
    const saved = byId.get(def.id) || {};
    return {
      ...def,
      label: String(saved.label || def.label).trim().slice(0, 80) || def.label,
      enabled: coerceBool(saved.enabled, def.enabled),
      required: coerceBool(saved.required, def.required)
    };
  });
  const customs = incoming
    .filter((f) => f && !BUILTIN_CHECKOUT_IDS.has(String(f.id || '')) && String(f.label || '').trim())
    .slice(0, 12)
    .map((f, index) => {
      const type = CHECKOUT_FIELD_TYPES.includes(f.type) ? f.type : 'text';
      const id = String(f.id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || `c_${index}`;
      return {
        id,
        type,
        label: String(f.label).trim().slice(0, 80),
        enabled: coerceBool(f.enabled, true),
        required: coerceBool(f.required, false),
        builtin: false,
        guestOnly: false
      };
    });
  return [...builtins, ...customs];
}

async function getCheckoutFields() {
  const setting = await Setting.findByPk('checkout_fields');
  if (!setting?.value) return normalizeCheckoutFields(BUILTIN_CHECKOUT_FIELDS);
  try {
    return normalizeCheckoutFields(JSON.parse(setting.value));
  } catch {
    return normalizeCheckoutFields(BUILTIN_CHECKOUT_FIELDS);
  }
}

async function setCheckoutFields(raw) {
  const fields = normalizeCheckoutFields(raw);
  await Setting.upsert({ key: 'checkout_fields', value: JSON.stringify(fields) });
  return fields;
}

function fieldById(fields, id) {
  return (fields || []).find((f) => f.id === id) || null;
}

// Écrire spontanément au numéro d'un client exige un fournisseur officiel.
// Les identifiants restent dans les variables d'environnement, jamais en base.
async function isCustomerProviderConfigured() {
  const gateway = await getWhatsAppGatewayForAdmin();
  return gateway.ready;
}

const DEFAULT_HERO = {
  type: 'video',
  videoUrl: 'assets/vids/hero-720.mp4',
  imageUrl: 'assets/vids/hero-poster.webp',
  posterUrl: 'assets/vids/hero-poster.webp'
};

function isSafeMediaUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  if (value.startsWith('assets/')) return value;
  if (value.startsWith('/img/')) return value.slice(0, 240);
  if (/^https:\/\//i.test(value)) return value.slice(0, 500);
  return '';
}

async function getHero() {
  const [typeRow, videoRow, imageRow, posterRow] = await Promise.all([
    Setting.findByPk('hero_type'),
    Setting.findByPk('hero_video_url'),
    Setting.findByPk('hero_image_url'),
    Setting.findByPk('hero_poster_url')
  ]);
  const type = typeRow?.value === 'image' ? 'image' : 'video';
  return {
    type,
    videoUrl: isSafeMediaUrl(videoRow?.value) || DEFAULT_HERO.videoUrl,
    imageUrl: isSafeMediaUrl(imageRow?.value) || DEFAULT_HERO.imageUrl,
    posterUrl: isSafeMediaUrl(posterRow?.value) || DEFAULT_HERO.posterUrl
  };
}

async function setHero({ type, videoUrl, imageUrl, posterUrl } = {}) {
  if (type !== undefined) {
    const next = type === 'image' ? 'image' : 'video';
    await Setting.upsert({ key: 'hero_type', value: next });
  }
  if (videoUrl !== undefined) {
    await Setting.upsert({ key: 'hero_video_url', value: isSafeMediaUrl(videoUrl) || DEFAULT_HERO.videoUrl });
  }
  if (imageUrl !== undefined) {
    await Setting.upsert({ key: 'hero_image_url', value: isSafeMediaUrl(imageUrl) || DEFAULT_HERO.imageUrl });
  }
  if (posterUrl !== undefined) {
    await Setting.upsert({ key: 'hero_poster_url', value: isSafeMediaUrl(posterUrl) || DEFAULT_HERO.posterUrl });
  }
  return getHero();
}

// Réponse publique : aucun secret, uniquement ce dont la boutique a besoin côté navigateur.
async function getPublicSettings() {
  const [currency, guestCheckout, whatsappNumber, notifyCustomer, whatsappInvite, loyaltyTiers, providerReady, checkoutFields, hero] = await Promise.all([
    getCurrency(),
    getGuestCheckout(),
    getWhatsAppNumber(),
    getNotifyCustomer(),
    getWhatsAppInvite(),
    getLoyaltyTiers(),
    isCustomerProviderConfigured(),
    getCheckoutFields(),
    getHero()
  ]);

  return {
    currency,
    guestCheckout,
    checkoutFields,
    hero,
    loyalty: { tiers: loyaltyTiers },
    whatsapp: {
      number: whatsappNumber,
      invite: whatsappInvite,
      notifyCustomer,
      providerReady,
      // Quand l'envoi automatique fonctionne, le site n'a plus besoin de rediriger le client.
      autoSend: notifyCustomer && providerReady
    }
  };
}

module.exports = {
  getCurrency,
  setCurrency,
  getGuestCheckout,
  setGuestCheckout,
  getWhatsAppNumber,
  setWhatsAppNumber,
  getNotifyCustomer,
  setNotifyCustomer,
  getWhatsAppInvite,
  setWhatsAppInvite,
  getCallMeBotKey,
  getUltramsgConfig,
  setWhatsAppGateway,
  getWhatsAppGatewayForAdmin,
  getLoyaltyTiers,
  setLoyaltyTiers,
  getCheckoutFields,
  setCheckoutFields,
  fieldById,
  isCustomerProviderConfigured,
  normalizeWhatsAppNumber,
  getHero,
  setHero,
  getPublicSettings,
  CURRENCIES,
  BUILTIN_CHECKOUT_FIELDS,
  DEFAULT_HERO
};
