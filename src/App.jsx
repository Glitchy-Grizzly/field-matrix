import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  Package,
  Box,
  Copy,
  CheckCircle,
  RotateCcw,
  Maximize2,
  Eye,
  Sliders,
  Tag,
  Palette,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  HelpCircle,
  Lock,
  Unlock,
  ArrowLeftRight,
  ExternalLink,
  Download,
  Code,
  Shield
} from 'lucide-react';

// ==========================================
// 1. FIREBASE, APP CHECK & CHECKOUT CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyB8ZEOzGOGeWRUYyWbZrkM_5Bl2OR37tyc",
  authDomain: "fieldmatrix-3d.firebaseapp.com",
  projectId: "fieldmatrix-3d",
  storageBucket: "fieldmatrix-3d.firebasestorage.app",
  messagingSenderId: "319878094871",
  appId: "1:319878094871:web:1eeeb9304d718e13887c52",
  measurementId: "G-PZPVDS18S2"
};

const RECAPTCHA_V3_SITE_KEY = "6LeqWv4tAAAAALkuL2q5NNooELUIXc8xgxhknqfU";
const FIRESTORE_COLLECTION = "fieldmatrix_orders";

// Paste your Square Checkout / Payment Link URL here when ready for Direct Traffic
const SQUARE_CHECKOUT_URL = "https://squareup.com/checkout";

// ==========================================
// 2. PRESET DEFINITIONS (BENCH & CARGO)
// ==========================================
const BENCH_PRESETS = {
  Trace: {
    id: 'Trace',
    label: 'Trace',
    summary: '1 Tier • 5 Drawers',
    tiers: 1,
    drawersPerTier: 5,
    width: 110,
    depth: 95,
    height: 14.0,
    etsyPrice: 36.00
  },
  Trail: {
    id: 'Trail',
    label: 'Trail',
    summary: '2 Tiers • 4 Drawers/Tier (8 Total)',
    tiers: 2,
    drawersPerTier: 4,
    width: 140,
    depth: 110,
    height: 15.5,
    etsyPrice: 56.00
  },
  Pursuit: {
    id: 'Pursuit',
    label: 'Pursuit',
    summary: '2 Tiers • 5 Drawers/Tier (10 Total)',
    tiers: 2,
    drawersPerTier: 5,
    width: 165,
    depth: 120,
    height: 17.0,
    etsyPrice: 74.00
  },
  Frontier: {
    id: 'Frontier',
    label: 'Frontier',
    summary: '3 Tiers • 5 Drawers/Tier (15 Total)',
    tiers: 3,
    drawersPerTier: 5,
    width: 185,
    depth: 120,
    height: 18.0,
    etsyPrice: 104.00
  }
};

const CARGO_PRESETS = {
  Trace: {
    id: 'Trace',
    label: 'Trace',
    summary: '80×60×32mm Total',
    width: 80,
    length: 60,
    height: 16,
    compX: 2,
    compY: 1,
    etsyPrice: 19.00
  },
  Trail: {
    id: 'Trail',
    label: 'Trail',
    summary: '120×90×40mm Total',
    width: 120,
    length: 90,
    height: 20,
    compX: 2,
    compY: 2,
    etsyPrice: 27.00
  },
  Pursuit: {
    id: 'Pursuit',
    label: 'Pursuit',
    summary: '160×120×50mm Total',
    width: 160,
    length: 120,
    height: 25,
    compX: 3,
    compY: 2,
    etsyPrice: 44.00
  },
  Frontier: {
    id: 'Frontier',
    label: 'Frontier',
    summary: '200×150×70mm Total',
    width: 200,
    length: 150,
    height: 35,
    compX: 4,
    compY: 3,
    etsyPrice: 82.00
  }
};

// ==========================================
// 3. MODULAR PRODUCT CATALOG REGISTRY
// ==========================================
const PRODUCT_CATALOG = {
  bench: {
    id: 'bench',
    codePrefix: 'BENCH-',
    name: 'The Bench Matrix',
    subtitle: 'Modular Swing-Drawer Storage System',
    etsyUrl: 'https://www.etsy.com/shop/GlitchyGrizzly',
    squareUrl: SQUARE_CHECKOUT_URL,
    hasOpenScadGenerator: false
  },
  cargo: {
    id: 'cargo',
    codePrefix: 'CARGO-',
    name: 'The Cargo Matrix',
    subtitle: 'Print-in-Place Hinged Clamshell Case',
    etsyUrl: 'https://www.etsy.com/shop/GlitchyGrizzly',
    squareUrl: SQUARE_CHECKOUT_URL,
    hasOpenScadGenerator: true
  },
  ammo:{
    id: 'ammo',
    codePrefix: 'AMMO-',
    name: 'The Ammo Matrix',
    subtitle: 'Ballistic Vault Series',
    etsyUrl: 'https://www.etsy.com/shop/GlitchyGrizzly',
    squareUrl: SQUARE_CHECKOUT_URL,
    hasOpenScadGenerator: true
  }
};

let db = null;
let auth = null;
try {
  const app = initializeApp(firebaseConfig);

  const isLocalOrPreview =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname.includes('github.dev'));

  if (false && typeof window !== 'undefined' && RECAPTCHA_V3_SITE_KEY && !isLocalOrPreview) {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_V3_SITE_KEY),
        isTokenAutoRefreshEnabled: true
      });
    } catch (appCheckErr) {
      console.warn("App Check initialization notice:", appCheckErr);
    }
  }

  db = getFirestore(app);
  auth = getAuth(app);
  signInAnonymously(auth).catch((err) => {
    console.warn("Anonymous auth optional/skipped:", err.message);
  });
} catch (err) {
  console.warn("Firebase init error:", err);
}

// ==========================================
// 4. BAMBU LAB PLA COLOR PALETTE (20 COLORS)
// ==========================================
const BAMBU_PLA_COLORS = [
  { id: 'matte-charcoal', name: 'Matte Charcoal', hex: '#1F2022', roughness: 0.78 },
  { id: 'green', name: 'Green', hex: '#00AE42', roughness: 0.42 },
  { id: 'brown', name: 'Brown', hex: '#8D432C', roughness: 0.45 },
  { id: 'gold', name: 'Gold', hex: '#E4BD68', roughness: 0.32, metalness: 0.25 },
  { id: 'cyan', name: 'Cyan', hex: '#0086D6', roughness: 0.42 },
  { id: 'matte-apple-green', name: 'Matte Apple Green', hex: '#C2E189', roughness: 0.75 },
  { id: 'matte-sakura-pink', name: 'Matte Sakura Pink', hex: '#E8AFCF', roughness: 0.75 },
  { id: 'matte-lemon-yellow', name: 'Matte Lemon Yellow', hex: '#F7D959', roughness: 0.75 },
  { id: 'matte-lilac-purple', name: 'Matte Lilac Purple', hex: '#AE96D4', roughness: 0.75 },
  { id: 'matte-latte-brown', name: 'Matte Latte Brown', hex: '#9B7E64', roughness: 0.72 },
  { id: 'matte-mandarin-orange', name: 'Matte Mandarin Orange', hex: '#F99963', roughness: 0.75 },
  { id: 'matte-marine-blue', name: 'Matte Marine Blue', hex: '#0078BF', roughness: 0.75 },
  { id: 'matte-desert-tan', name: 'Matte Desert Tan', hex: '#E8DBB7', roughness: 0.75 },
  { id: 'matte-grass-green', name: 'Matte Grass Green', hex: '#61C680', roughness: 0.75 },
  { id: 'matte-ice-blue', name: 'Matte Ice Blue', hex: '#A3D8E1', roughness: 0.75 },
  { id: 'black', name: 'Black', hex: '#141414', roughness: 0.4 },
  { id: 'cocoa-brown', name: 'Cocoa Brown', hex: '#6F4E37', roughness: 0.5 },
  { id: 'hot-pink', name: 'Hot Pink', hex: '#F55A74', roughness: 0.45 },
  { id: 'blue', name: 'Blue', hex: '#0A2989', roughness: 0.45 },
  { id: 'dark-grey', name: 'Dark Grey', hex: '#545454', roughness: 0.5 }
];
// ==========================================
// 4.1 BAMBU LAB PETG COLOR PALETTE (13 COLORS)
// ==========================================
const BAMBU_PETG_COLORS = [
  { id: 'petg-orange', name: 'Orange', hex: '#F36B21' },
  { id: 'petg-red', name: 'Red', hex: '#BF292D' },
  { id: 'petg-yellow', name: 'Yellow', hex: '#F6C129' },
  { id: 'petg-green', name: 'Green', hex: '#00A050' },
  { id: 'petg-navy-blue', name: 'Navy Blue', hex: '#1C294D' },
  { id: 'petg-reflex-blue', name: 'Reflex Blue', hex: '#1E3A8A' },
  { id: 'petg-white', name: 'White', hex: '#F2F2F2' },
  { id: 'petg-dark-beige', name: 'Dark Beige', hex: '#9E8569' },
  { id: 'petg-black', name: 'Black', hex: '#222222' },
  { id: 'petg-dark-brown', name: 'Dark Brown', hex: '#3E2723' },
  { id: 'petg-misty-blue', name: 'Misty Blue', hex: '#7B9095' },
  { id: 'petg-gray', name: 'Gray', hex: '#888888' },
  { id: 'petg-pine-green', name: 'Pine Green', hex: '#2C4C3B' }
];


const P1S_MAX_HEIGHT_MM = 250.0;
const AMMO_CALIBERS = {
  '22lr':   { id: '22lr',   name: '.22 Long Rifle',        short: '22LR',   category: 'Rimfire', holeDia: 6.0,  pitch: 7.8,  oal: 25.4, trayZ: 14.5, shellZ: 36.0, badge: 'LAUNCH' },
  '17hmr':  { id: '17hmr',  name: '.17 HMR',               short: '.17HMR', category: 'Rimfire', holeDia: 6.0,  pitch: 7.8,  oal: 34.3, trayZ: 18.0, shellZ: 45.0 },
  '9mm':    { id: '9mm',    name: '9x19mm Parabellum',     short: '9MM',    category: 'Pistol',  holeDia: 10.3, pitch: 12.2, oal: 29.7, trayZ: 16.5, shellZ: 40.5 },
  '45acp':  { id: '45acp',  name: '.45 ACP',               short: '.45ACP', category: 'Pistol',  holeDia: 12.5, pitch: 14.5, oal: 32.4, trayZ: 18.0, shellZ: 43.0 },
  '357mag': { id: '357mag', name: '.38 Spl / .357 Mag',    short: '.357',   category: 'Pistol',  holeDia: 10.2, pitch: 12.2, oal: 40.4, trayZ: 22.0, shellZ: 51.0 },
  '44mag':  { id: '44mag',  name: '.44 S&W Spl / .44 Mag', short: '.44MAG', category: 'Pistol',  holeDia: 12.0, pitch: 15.0, oal: 40.9, trayZ: 22.0, shellZ: 53.0 },
  '45colt': { id: '45colt', name: '.45 Colt (.45 LC)',     short: '.45LC',  category: 'Pistol',  holeDia: 12.6, pitch: 15.0, oal: 40.6, trayZ: 22.0, shellZ: 53.0 },
  '223rem': { id: '223rem', name: '.223 Rem / 5.56 NATO',  short: '5.56',   category: 'Rifle',   holeDia: 10.0, pitch: 12.0, oal: 57.4, trayZ: 28.0, shellZ: 68.0 },
  '308win': { id: '308win', name: '.308 Win / 7.62 NATO',  short: '.308',   category: 'Rifle',   holeDia: 12.4, pitch: 14.6, oal: 71.1, trayZ: 34.0, shellZ: 82.0 },
  '270win': { id: '270win', name: '.270 Winchester',       short: '.270',   category: 'Rifle',   holeDia: 12.4, pitch: 14.6, oal: 84.8, trayZ: 40.0, shellZ: 95.5 },
  '3006':   { id: '3006',   name: '.30-06 Springfield',    short: '.30-06', category: 'Rifle',   holeDia: 12.4, pitch: 14.6, oal: 84.8, trayZ: 40.0, shellZ: 95.5 },
  '300wm':  { id: '300wm',  name: '.300 Win Mag',          short: '.300WM', category: 'Rifle',   holeDia: 13.8, pitch: 16.2, oal: 85.0, trayZ: 40.0, shellZ: 96.0 },
  '20ga':   { id: '20ga',   name: '20 Gauge (2.75" / 3")', short: '20GA',   category: 'Shotgun', holeDia: 19.8, pitch: 22.0, oal: 70.0, trayZ: 35.0, shellZ: 81.0 },
  '12ga':   { id: '12ga',   name: '12 Gauge (2.75" / 3")', short: '12GA',   category: 'Shotgun', holeDia: 21.2, pitch: 23.5, oal: 70.0, trayZ: 35.0, shellZ: 81.0 },
};

const AMMO_ETSY_PRESETS = [
  { id: '50',  rounds: 50,  cols: 10, rows: 5,  label: 'Standard Retail Box' },
  { id: '100', rounds: 100, cols: 10, rows: 10, label: 'Weekend Range Pack' },
  { id: '250', rounds: 250, cols: 25, rows: 10, label: 'Half-Brick Bulk Case' },
];
const TIER_CLEARANCE_PER_DRAWER_MM = 2.15;
const TIER_FRAME_BASE_TOP_MM = 1.5;

function InfoPopover({ title, text, formula }) {
  const [open, setOpen] = useState(false);
  const popRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <span
      ref={popRef}
      className="relative inline-flex items-center ml-1.5 align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={`w-4 h-4 rounded-full inline-flex items-center justify-center cursor-pointer transition-colors ${
          open
            ? 'bg-[#38bdf8] text-[#0b0f19]'
            : 'bg-[#1e293b] text-[#94a3b8] hover:bg-[#334155] hover:text-white'
        }`}
      >
        <HelpCircle size={11} />
      </span>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 rounded-lg bg-[#0f172a] border border-[#38bdf8]/50 shadow-2xl z-50 text-left pointer-events-auto"
        >
          <div className="text-[11px] font-bold text-[#38bdf8] mb-1">{title}</div>
          <p className="text-[11px] leading-relaxed text-[#cbd5e1] font-normal">{text}</p>
          {formula && (
            <div className="mt-1.5 pt-1.5 border-t border-[#1e293b] text-[10px] font-mono text-[#fda4af]">
              {formula}
            </div>
          )}
        </div>
      )}
    </span>
  );
}

function createLabelTexture(text, bgHex = '#1F2022', textHex = '#9B7E64', fontName = 'Inter') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

  if (text && text.trim() !== '') {
    ctx.fillStyle = textHex;
    const clean = text.trim();
    const fontSize = clean.length > 16 ? 38 : clean.length > 11 ? 48 : 60;
    ctx.font = `700 ${fontSize}px "${fontName}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Pass canvas.width - 44 (468px) as maxWidth so text never touches the label edges!
    ctx.fillText(clean, canvas.width / 2, canvas.height / 2 + 2, canvas.width - 44);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createCargoLidTexture(text, textHex = '#1A1A1A', fontName = 'Impact', showBorder = true) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (showBorder) {
    const x0 = 38;
    const y0 = 38;
    const x1 = canvas.width - 38;
    const y1 = canvas.height - 38;
    const chamf = 34; // 45-degree tactical corner bevel

    ctx.strokeStyle = textHex;
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(x0 + chamf, y0);
    ctx.lineTo(x1 - chamf, y0);
    ctx.lineTo(x1, y0 + chamf);
    ctx.lineTo(x1, y1 - chamf);
    ctx.lineTo(x1 - chamf, y1);
    ctx.lineTo(x0 + chamf, y1);
    ctx.lineTo(x0, y1 - chamf);
    ctx.lineTo(x0, y0 + chamf);
    ctx.closePath();
    ctx.stroke();
  }

  if (text && text.trim() !== '') {
    const clean = text.trim();
    ctx.fillStyle = textHex;
    const fontSize = clean.length > 18 ? 64 : clean.length > 14 ? 78 : clean.length > 10 ? 102 : 128;
    ctx.font = `900 ${fontSize}px "${fontName}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Constrain text strictly inside the chamfered border frame (860px max width)!
    const safeInnerWidth = showBorder ? canvas.width - 164 : canvas.width - 80;
    ctx.fillText(clean, canvas.width / 2, canvas.height / 2, safeInnerWidth);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createBadgeTexture({
  caliberSpec,
  customText,
  showRoundCount = false,
  fontFamily = 'Impact',
  lidColorHex = '#000000',
  accentColorHex = '#F36B21',
  rounds = 50,
  showBorder = true
}) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // 1. CLEAR TRANSPARENT BACKGROUND
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 2. OPTIONAL BORDER
  if (showBorder) {
    ctx.strokeStyle = accentColorHex;
    ctx.lineWidth = 16;
    ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
  }

  ctx.fillStyle = accentColorHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let title = '';
  if (customText !== undefined && customText !== null) {
    title = String(customText).trim();
  } else if (caliberSpec && caliberSpec.short) {
    title = String(caliberSpec.short).trim();
  }

  const sub = showRoundCount ? `${rounds} RDS` : '';
  // Keep a clean 48px padding inside the 24px border on both sides (1024 - 160 = 864px max)
  const safeInnerWidth = showBorder ? canvas.width - 160 : canvas.width - 80;

  if (title.length > 0) {
    const titleSize = title.length > 14 ? 76 : title.length > 10 ? 98 : title.length > 7 ? 124 : 150;
    ctx.font = `900 ${titleSize}px "${fontFamily}"`;
    ctx.fillText(
      title,
      canvas.width / 2,
      sub.length > 0 ? canvas.height * 0.42 : canvas.height * 0.5,
      safeInnerWidth
    );
  }

  if (sub.length > 0) {
    ctx.font = title.length > 0 ? `700 68px "${fontFamily}"` : `700 110px "${fontFamily}"`;
    ctx.fillText(
      sub,
      canvas.width / 2,
      title.length > 0 ? canvas.height * 0.75 : canvas.height * 0.5,
      safeInnerWidth
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createDimensionSprite(text, isWarning = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 84;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = isWarning ? 'rgba(145, 28, 28, 0.94)' : 'rgba(15, 23, 42, 0.92)';
  const r = 16;
  ctx.beginPath();
  ctx.moveTo(r, 8);
  ctx.lineTo(312 - r, 8);
  ctx.quadraticCurveTo(312, 8, 312, 8 + r);
  ctx.lineTo(312, 76 - r);
  ctx.quadraticCurveTo(312, 76, 312 - r, 76);
  ctx.lineTo(r, 76);
  ctx.quadraticCurveTo(8, 76, 8, 76 - r);
  ctx.lineTo(8, 8 + r);
  ctx.quadraticCurveTo(8, 8, r, 8);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = isWarning ? '#ff8080' : '#38bdf8';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = isWarning ? '#ffffff' : '#f1f5f9';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 160, 42);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(42, 11, 1);
  sprite.renderOrder = 999;
  return sprite;
}

function createDrawerContourPoints(hw, hd, cornerR, notchR, openSide, handlePos, inset = 0) {
  const w = hw - inset;
  const d = hd - inset;
  const r = Math.max(1.5, cornerR - inset);

  const isBLNotch = openSide === 'left' && handlePos === 'Front';
  const isBRNotch = openSide === 'right' && handlePos === 'Front';
  const isTRNotch = openSide === 'right' && handlePos === 'Back';
  const isTLNotch = openSide === 'left' && handlePos === 'Back';

  const nR = Math.min(Math.min(w, d) * 0.75, notchR + inset);
  const pts = [];
  const segs = 18;

  const addArc = (cx, cy, radius, startAngle, endAngle) => {
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const a = startAngle + t * (endAngle - startAngle);
      pts.push(new THREE.Vector2(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius));
    }
  };

  if (isBLNotch) addArc(-w, -d, nR, Math.PI / 2, 0);
  else addArc(-w + r, -d + r, r, Math.PI, (3 * Math.PI) / 2);

  if (isBRNotch) addArc(w, -d, nR, Math.PI, Math.PI / 2);
  else addArc(w - r, -d + r, r, (3 * Math.PI) / 2, 2 * Math.PI);

  if (isTRNotch) addArc(w, d, nR, (3 * Math.PI) / 2, Math.PI);
  else addArc(w - r, d - r, r, 0, Math.PI / 2);

  if (isTLNotch) addArc(-w, d, nR, 0, -Math.PI / 2);
  else addArc(-w + r, d - r, r, Math.PI / 2, Math.PI);

  return pts;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('bench');
  const [isSuccessPage, setIsSuccessPage] = useState(false);
  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    
    if (path === '/success') {
      setIsSuccessPage(true);
      return;
    }

    // Check if the path matches a product slug (e.g. /cargo, /ammo, /bench)
    const slug = path.replace('/', '');
    if (slug && PRODUCT_CATALOG[slug]) {
      setActiveTab(slug);
      setIsEtsyMode(true); // Automatically lock to Etsy purchase funnel
    }
  }, []);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [designCode, setDesignCode] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  // <-- PASTE THE USEEFFECT RIGHT HERE -->
  useEffect(() => {
    document.title = `FieldMatrix 3D - ${PRODUCT_CATALOG[activeTab]?.name || 'Configurator'}`;
  }, [activeTab]);
  // <------------------------------------>

  const [recallCode, setRecallCode] = useState('');
  const [statusBanner, setStatusBanner] = useState(null);
  const [modalTab, setModalTab] = useState('spec'); // 'spec' | 'scad'
  const [scadExportMode, setScadExportMode] = useState('full'); // 'full' | 'box_only' | 'text_only' | 'hinge' | 'latch'
  const [scadCopied, setScadCopied] = useState(false);
  const logoClickRef = useRef({ count: 0, timer: null });

  // ==========================================
  // PRODUCT 3 STATE: THE AMMO MATRIX
  // ==========================================
  const [ammoCaliber, setAmmoCaliber] = useState('9mm');
  const [ammoPreset, setAmmoPreset] = useState('50');
  const [ammoCols, setAmmoCols] = useState(10);

  const [ammoRows, setAmmoRows] = useState(5);
  const [ammoLidFont, setAmmoLidFont] = useState('Impact');
  const [enableAmmoLidBorder, setEnableAmmoLidBorder] = useState(true);
  
  // Colors are stored as IDs to match the Swatch Grid!
  const [ammoBaseColorId, setAmmoBaseColorId] = useState('petg-pine-green');
  const [ammoLidColorId, setAmmoLidColorId] = useState('petg-black');
  const [ammoTrayColorId, setAmmoTrayColorId] = useState('petg-dark-beige');
  const [ammoLatchColorId, setAmmoLatchColorId] = useState('petg-orange');

  const activeAmmoBaseColor = useMemo(
    () => BAMBU_PETG_COLORS.find((c) => c.id === ammoBaseColorId) || BAMBU_PETG_COLORS[12],
    [ammoBaseColorId]
  );
  const activeAmmoLidColor = useMemo(
    () => BAMBU_PETG_COLORS.find((c) => c.id === ammoLidColorId) || BAMBU_PETG_COLORS[8],
    [ammoLidColorId]
  );
  const activeAmmoTrayColor = useMemo(
    () => BAMBU_PETG_COLORS.find((c) => c.id === ammoTrayColorId) || BAMBU_PETG_COLORS[7],
    [ammoTrayColorId]
  );
  const activeAmmoLatchColor = useMemo(
    () => BAMBU_PETG_COLORS.find((c) => c.id === ammoLatchColorId) || BAMBU_PETG_COLORS[0],
    [ammoLatchColorId]
  );

  // Text & Viewport States
  const [ammoLidTitle, setAmmoLidTitle] = useState('9MM');
  const [showAmmoRoundCount, setShowAmmoRoundCount] = useState(true);
  const [ammoHingeAngle, setAmmoHingeAngle] = useState(0); 
  const [ammoTrayPose, setAmmoTrayPose] = useState('seated'); // 'seated', 'extracted', 'bench'
  const [showAmmoRounds, setShowAmmoRounds] = useState(true);
  const [showMagnetXray, setShowMagnetXray] = useState(false);

  // Derived Ammo Matrix Geometry (254.5mm max outer shell fits 256x256mm build plate)
  const currentCalSpec = AMMO_CALIBERS[ammoCaliber] || AMMO_CALIBERS['22lr'];
  
  // Max even columns & max rows that fit on a 256mm plate (including 6.5mm spine + 6.4mm tray wall + 12.8mm shell wall)
  const maxSafeCols = Math.min(24, Math.max(2, Math.floor((254.5 - 25.7) / currentCalSpec.pitch / 2) * 2));
  const maxSafeRows = Math.min(20, Math.max(3, Math.floor((254.5 - 19.2) / currentCalSpec.pitch)));

  // Enforce strictly EVEN columns (2, 4, 6, 8, 10...) so the tray & handle are 100% balanced!
  const evenAmmoCols = Math.max(2, Math.round(ammoCols / 2) * 2);
  const clampedAmmoCols = Math.min(Math.max(2, evenAmmoCols), maxSafeCols);
  const clampedAmmoRows = Math.min(Math.max(3, ammoRows), maxSafeRows);
  const ammoTotalRounds = clampedAmmoCols * clampedAmmoRows;

  // Dynamic Caliber-Aware Presets (Guarantees 3 distinct sizes for EVERY caliber so two buttons never light up together!)
  const getCaliberPresets = (calSpec = currentCalSpec) => {
    const mCols = Math.min(24, Math.max(2, Math.floor((254.5 - 25.7) / calSpec.pitch / 2) * 2));
    const mRows = Math.min(20, Math.max(3, Math.floor((254.5 - 19.2) / calSpec.pitch)));

    if (calSpec.category === 'Shotgun') {
      // 20GA & 12GA: 3 distinct balanced tiers up to full 10x10 (100 shells) plate max
      return [
        { id: '50',  cols: Math.min(6, mCols),  rows: Math.min(4, mRows),  label: 'Standard Retail Box' },
        { id: '100', cols: Math.min(8, mCols),  rows: Math.min(6, mRows),  label: 'Weekend Range Pack' },
        { id: '250', cols: mCols,               rows: mRows,               label: 'Half-Brick Bulk Case' },
      ];
    }
    // Rimfire, Pistol & Rifle: Standard (10x5), Weekend (min(10, mCols-2) x min(10, mRows-2)), Bulk (Max Safe Plate)
    const bulkCols = mCols;
    const bulkRows = Math.min(12, mRows);
    const wkndCols = Math.min(10, Math.max(4, bulkCols - 2));
    const wkndRows = Math.min(10, Math.max(4, bulkRows - 2));
    const stdCols  = Math.min(10, wkndCols);
    const stdRows  = Math.min(5, Math.max(3, wkndRows - 2));

    return [
      { id: '50',  cols: stdCols,  rows: stdRows,  label: 'Standard Retail Box' },
      { id: '100', cols: wkndCols, rows: wkndRows, label: 'Weekend Range Pack' },
      { id: '250', cols: bulkCols, rows: bulkRows, label: 'Half-Brick Bulk Case' },
    ];
  };

  const activeAmmoPresets = getCaliberPresets(currentCalSpec);

  // Standing Tray & Exterior Shell Millimeter Math (Even columns = zero empty phantom space!)
  const ammoSpineAllowance = clampedAmmoCols > 1 ? 6.5 : 0;
  const ammoTrayX = currentCalSpec
    ? Number((clampedAmmoCols * currentCalSpec.pitch + ammoSpineAllowance + 6.4).toFixed(2))
    : 120;
  const ammoTrayY = Number((clampedAmmoRows * currentCalSpec.pitch + 6.4).toFixed(1));
  const ammoTrayZ = currentCalSpec.trayZ;

  const ammoShellX = Number((ammoTrayX + 12.8).toFixed(1));
  const ammoShellY = Number((ammoTrayY + 12.8).toFixed(1));
  const ammoShellZ = currentCalSpec ? Math.ceil(currentCalSpec.oal + 32) : 58;

  // Magnet scaling: 2 pairs (4 magnets) under 150mm, 3 pairs (6 magnets) at or above 150mm
  const ammoMagnetPairs = Math.max(ammoShellX, ammoShellY) >= 150 ? 6 : 4;
  const ammoTotalMagnets = ammoMagnetPairs * 2;

  // --- DYNAMIC MAGNET SIZING LOGIC ---
  const isAmmoBulk = ammoTotalRounds >= 150;
  const isAmmoWeekend = ammoTotalRounds >= 75 && ammoTotalRounds < 150;
  const isShotgun = currentCalSpec?.category === 'Shotgun';
  const isRifle = currentCalSpec?.category === 'Rifle';
  
  let activeMagnetDia = 5.0; // Default Light Duty (5x2mm)
  if (isShotgun || isAmmoBulk) {
    activeMagnetDia = 8.0; // Heavy Duty (8x2mm)
  } else if (isAmmoWeekend || isRifle) {
    activeMagnetDia = 6.0; // Medium Duty (6x2mm)
  }

  // Dynamic Lid Character Limit based on inner border width (78% of shell width minus 8mm frame)
  const ammoInnerFrameWidthMm = Math.max(24, ammoShellX * 0.78 - (enableAmmoLidBorder ? 12 : 4));
  const ammoMaxLidChars = Math.max(5, Math.min(18, Math.floor(ammoInnerFrameWidthMm / 7.5)));

  // Auto-trim Ammo Lid Title if the user reduces box columns
  useEffect(() => {
    if (ammoLidTitle && ammoLidTitle.trim().length > ammoMaxLidChars) {
      setAmmoLidTitle((prev) => prev.trim().slice(0, ammoMaxLidChars));
    }
  }, [ammoMaxLidChars, ammoLidTitle]);

  // Estimated PETG Mass (grams) & Print Time (hours)
  const ammoEstimatedGrams = Math.round(
    ((ammoShellX * ammoShellY * 3.2 + (ammoShellX + ammoShellY) * 2 * ammoShellZ * 2.8) * 0.00127) +
    ((ammoTrayX * ammoTrayY * ammoTrayZ * 0.38) * 0.00127)
  );
  const ammoEstimatedHours = Number((ammoEstimatedGrams / 28).toFixed(1));

  // Switch caliber helper
  const handleSelectAmmoCaliber = (calId) => {
    const nextCal = AMMO_CALIBERS[calId];
    if (!nextCal) return;
    setAmmoCaliber(calId);
    setAmmoLidTitle(nextCal.short);
    const nextPresets = getCaliberPresets(nextCal);
    // Keep their current preset tier (Standard, Weekend, or Bulk) when switching calibers!
    const matchingPreset = nextPresets.find((p) => p.id === ammoPreset) || nextPresets[0];
    setAmmoCols(matchingPreset.cols);
    setAmmoRows(matchingPreset.rows);
  };

  const handleSelectAmmoPreset = (preset) => {
    setAmmoPreset(preset.id);
    setAmmoCols(preset.cols);
    setAmmoRows(preset.rows);
  };

  // ==========================================
  // CHANNEL ROUTING: ETSY MODE VS. DIRECT MODE
  // ==========================================
  const [isEtsyMode, setIsEtsyMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const src = (params.get('source') || params.get('mode') || '').toLowerCase();
    if (src === 'etsy') {
      try { sessionStorage.setItem('fm_channel', 'etsy'); } catch (e) {}
      return true;
    }
    if (src === 'direct') {
      try { sessionStorage.setItem('fm_channel', 'direct'); } catch (e) {}
      return false;
    }
    try {
      return sessionStorage.getItem('fm_channel') === 'etsy';
    } catch (e) {
      return false;
    }
  });

  const toggleChannelMode = (etsyActive) => {
    setIsEtsyMode(etsyActive);
    try {
      sessionStorage.setItem('fm_channel', etsyActive ? 'etsy' : 'direct');
    } catch (e) {}
  };

  const PRODUCT_META = {
  bench: {
    name: 'Bench Matrix',
    subtitle: 'Modular Drawer System',
  },
  cargo: {
    name: 'Cargo Matrix',
    subtitle: 'Rugged Case System',
  },
  ammo: {
    name: 'AmmoMatrix',
    subtitle: 'Ballistic Vault Series',
  },
};

// It MUST look exactly like this, using the activeTab state!
  const currentProductMeta = PRODUCT_CATALOG[activeTab] || PRODUCT_CATALOG.bench;

  const triggerHiddenAdmin = useCallback(() => {
    setAdminMode(true);
    setAdminPinInput('');
    setAdminPinError(false);
  }, []);

  const handleLogoSecretClick = () => {
    logoClickRef.current.count += 1;
    if (logoClickRef.current.timer) clearTimeout(logoClickRef.current.timer);
    if (logoClickRef.current.count >= 5) {
      logoClickRef.current.count = 0;
      triggerHiddenAdmin();
    } else {
      logoClickRef.current.timer = setTimeout(() => {
        logoClickRef.current.count = 0;
      }, 1800);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        triggerHiddenAdmin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerHiddenAdmin]);

  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (adminPinInput.trim() === ADMIN_SECRET_PIN) {
      setAdminUnlocked(true);
      setAdminPinError(false);
    } else {
      setAdminPinError(true);
    }
  };

  const [openSections, setOpenSections] = useState({
    config: true,
    labels: true,
    dividers: true,
    colors: true
  });

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // ==========================================
  // PRODUCT 1 STATE: THE BENCH MATRIX
  // ==========================================
  const [sizePreset, setSizePreset] = useState('Trail');
  const [tiers, setTiers] = useState(BENCH_PRESETS.Trail.tiers);
  const [drawersPerTier, setDrawersPerTier] = useState(BENCH_PRESETS.Trail.drawersPerTier);
  const [opening, setOpening] = useState('Left');
  const [handlePos, setHandlePos] = useState('Front');
  const [width, setWidth] = useState(BENCH_PRESETS.Trail.width);
  const [depth, setDepth] = useState(BENCH_PRESETS.Trail.depth);
  const [height, setHeight] = useState(BENCH_PRESETS.Trail.height);
  const [lockToP1S, setLockToP1S] = useState(true);

  const [enableLabelSlot, setEnableLabelSlot] = useState(true);
  const [labelWidth, setLabelWidth] = useState(30);
  const [labelHeight, setLabelHeight] = useState(11);
  const [labelFont, setLabelFont] = useState('Inter');
  const [labels, setLabels] = useState({
    tier_1_box_3: 'M3 Bolts',
    tier_1_box_2: 'Hex Nuts',
    tier_0_box_3: 'Nozzles'
  });

  const [drawerDividers, setDrawerDividers] = useState({});
  const [batchH, setBatchH] = useState(1);
  const [batchV, setBatchV] = useState(1);

  const [casingColorId, setCasingColorId] = useState('cocoa-brown');
  const [drawerColorId, setDrawerColorId] = useState('matte-latte-brown');

  const [swingOpenAmount, setSwingOpenAmount] = useState(0);
  const [openDrawersMap, setOpenDrawersMap] = useState({});
  const [explodedView, setExplodedView] = useState(false);
  const [xrayMode, setXrayMode] = useState(false);
  const [showDimensions, setShowDimensions] = useState(true);

  // ==========================================
  // PRODUCT 2 STATE: THE CARGO MATRIX
  // ==========================================
  const [cargoPreset, setCargoPreset] = useState('Trail');
  const [cargoWidth, setCargoWidth] = useState(CARGO_PRESETS.Trail.width);
  const [cargoLength, setCargoLength] = useState(CARGO_PRESETS.Trail.length);
  const [cargoHeight, setCargoHeight] = useState(CARGO_PRESETS.Trail.height);
  const [cargoCompX, setCargoCompX] = useState(CARGO_PRESETS.Trail.compX);
  const [cargoCompY, setCargoCompY] = useState(CARGO_PRESETS.Trail.compY);
  const [cargoBoxColorId, setCargoBoxColorId] = useState('petg-dark-beige');
  const [cargoTextColorId, setCargoTextColorId] = useState('petg-black');
  const [cargoLatchColorId, setCargoLatchColorId] = useState('petg-orange'); // Add this line!
  const [cargoText, setCargoText] = useState('FIELD KIT');
  const [cargoFont, setCargoFont] = useState('Impact');
  const [cargoBorder, setCargoBorder] = useState(true);
  const [foldAngle, setFoldAngle] = useState(35);

  // ---> PASTE HELPER & AUTO-UPDATING DESIGN CODE HOOK HERE <---
  const getActiveTierTag = useCallback(() => {
    if (activeTab === 'bench') return (sizePreset || 'CUSTOM').toUpperCase();
    if (activeTab === 'cargo') return (cargoPreset || 'CUSTOM').toUpperCase();
    if (activeTab === 'ammo') return `${ammoTotalRounds}RD`;
    return 'CUSTOM';
  }, [activeTab, sizePreset, cargoPreset, ammoTotalRounds]);

  useEffect(() => {
    setDesignCode((prev) => {
      const parts = prev ? prev.split('-') : [];
      const lastPart = parts[parts.length - 1];
      const suffix =
        lastPart && lastPart.length === 6
          ? lastPart
          : Math.random().toString(36).substring(2, 8).toUpperCase();

      const prefix = PRODUCT_CATALOG[activeTab]?.codePrefix || 'MATRIX-';
      const tierTag = getActiveTierTag();
      return `${prefix}${tierTag}-${suffix}`;
    });
  }, [activeTab, getActiveTierTag]);
  // ---> END OF PASTE <---

  const applyBenchPreset = useCallback((presetKey) => {
    const p = BENCH_PRESETS[presetKey];
    if (!p) return;
    setSizePreset(presetKey);
    setTiers(p.tiers);
    setDrawersPerTier(p.drawersPerTier);
    setWidth(p.width);
    setDepth(p.depth);
    setHeight(p.height);
  }, []);

  const applyCargoPreset = useCallback((presetKey) => {
    const p = CARGO_PRESETS[presetKey];
    if (!p) return;
    setCargoPreset(presetKey);
    setCargoWidth(p.width);
    setCargoLength(p.length);
    setCargoHeight(p.height);
    setCargoCompX(p.compX);
    setCargoCompY(p.compY);
  }, []);

  // When entering Etsy Mode, snap any custom freeform dimensions back to the selected preset
  useEffect(() => {
    if (isEtsyMode) {
      const bKey = BENCH_PRESETS[sizePreset] ? sizePreset : 'Trail';
      applyBenchPreset(bKey);
      const cKey = CARGO_PRESETS[cargoPreset] ? cargoPreset : 'Trail';
      applyCargoPreset(cKey);

      // Force Ammo Matrix onto 22lr (or current allowed Etsy caliber) & snap cols/rows to preset
      const targetCal = AMMO_CALIBERS['22lr'];
      if (ammoCaliber !== '22lr') {
        setAmmoCaliber('22lr');
        setAmmoLidTitle(targetCal.short);
      }
      const presets = getCaliberPresets(targetCal);
      const activeP = presets.find((p) => p.id === ammoPreset) || presets[0];
      setAmmoCols(activeP.cols);
      setAmmoRows(activeP.rows);
    }
  }, [isEtsyMode, sizePreset, cargoPreset, ammoPreset, ammoCaliber, applyBenchPreset, applyCargoPreset]);

  const activeCargoBoxColor = useMemo(
    () => BAMBU_PETG_COLORS.find((c) => c.id === cargoBoxColorId) || BAMBU_PETG_COLORS[7],
    [cargoBoxColorId]
  );
  const activeCargoTextColor = useMemo(
    () => BAMBU_PETG_COLORS.find((c) => c.id === cargoTextColorId) || BAMBU_PETG_COLORS[8],
    [cargoTextColorId]
  );
  const activeCargoLatchColor = useMemo(
    () => BAMBU_PETG_COLORS.find((c) => c.id === cargoLatchColorId) || BAMBU_PETG_COLORS[0],
    [cargoLatchColorId]
  );

  const activeCasingColor = useMemo(
    () => BAMBU_PLA_COLORS.find((c) => c.id === casingColorId) || BAMBU_PLA_COLORS[16],
    [casingColorId]
  );
  const activeDrawerColor = useMemo(
    () => BAMBU_PLA_COLORS.find((c) => c.id === drawerColorId) || BAMBU_PLA_COLORS[9],
    [drawerColorId]
  );

  const maxLabelHeight = useMemo(() => {
    const raw = height <= 20 ? 6 + (height - 10) * 0.8 : height - 6;
    return Math.max(6, Math.round(raw * 10) / 10);
  }, [height]);

  const maxLabelWidth = useMemo(() => {
    if (width >= 58) return 60;
    return Math.max(10, Math.round(60 - 2 * (58 - width)));
  }, [width]);

  useEffect(() => {
    if (labelHeight > maxLabelHeight) setLabelHeight(maxLabelHeight);
  }, [maxLabelHeight, labelHeight]);

  useEffect(() => {
    if (labelWidth > maxLabelWidth) setLabelWidth(maxLabelWidth);
  }, [maxLabelWidth, labelWidth]);

  // ---> PASTE DYNAMIC BENCH & CARGO CHARACTER LIMITS HERE <---
  // 1. Bench Matrix: Calculate effective label plate width (mm) and allow ~1 char per 1.85mm
  const effectiveBenchLabelWidthMm = useMemo(() => {
    const dW = width - 2.6 * 2 - 2.0; // Drawer outer width
    return Math.min(labelWidth, maxLabelWidth, dW - 14);
  }, [width, labelWidth, maxLabelWidth]);

  const benchMaxLabelChars = useMemo(() => {
    return Math.max(4, Math.min(22, Math.floor(effectiveBenchLabelWidthMm / 1.85)));
  }, [effectiveBenchLabelWidthMm]);

  // Automatically trim any existing drawer labels if the box/label width is shrunk
  useEffect(() => {
    setLabels((prev) => {
      let changed = false;
      const next = {};
      for (const [k, v] of Object.entries(prev)) {
        if (v && v.length > benchMaxLabelChars) {
          next[k] = v.slice(0, benchMaxLabelChars);
          changed = true;
        } else {
          next[k] = v;
        }
      }
      return changed ? next : prev;
    });
  }, [benchMaxLabelChars]);

  // 2. Cargo Matrix: Calculate inner frame width (mm) inside the border and scale character limit
  const cargoInnerFrameWidthMm = useMemo(() => {
    // Border inset is 5mm + 2mm line width + 3mm breathing room on each side = 20mm total inset
    const totalInset = cargoBorder ? 20 : 12;
    return Math.max(20, cargoWidth - totalInset);
  }, [cargoWidth, cargoBorder]);

  const cargoMaxLidChars = useMemo(() => {
    // Scales smoothly: Trace (80mm) -> 10 chars, Trail (120mm) -> 15 chars, Pursuit (160mm) -> 20 chars, Frontier (200mm) -> 24 chars
    return Math.max(6, Math.min(24, Math.floor(cargoInnerFrameWidthMm / 6.5)));
  }, [cargoInnerFrameWidthMm]);

  // Automatically trim Cargo Lid Text if the user switches to a smaller box width
  useEffect(() => {
    if (cargoText && cargoText.length > cargoMaxLidChars) {
      setCargoText((prev) => prev.slice(0, cargoMaxLidChars));
    }
  }, [cargoMaxLidChars, cargoText]);

  const singleTierHeightMm = useMemo(() => {
    return Number(
      (drawersPerTier * (height + TIER_CLEARANCE_PER_DRAWER_MM) + TIER_FRAME_BASE_TOP_MM).toFixed(1)
    );
  }, [drawersPerTier, height]);

  const totalStackedHeightMm = useMemo(() => {
    return Number((tiers * singleTierHeightMm - (tiers - 1) * 0.5).toFixed(1));
  }, [tiers, singleTierHeightMm]);

  const isOverP1SLimit = singleTierHeightMm > P1S_MAX_HEIGHT_MM;

  const maxAllowedDrawersForCurrentHeight = useMemo(() => {
    return Math.max(
      1,
      Math.min(
        10,
        Math.floor(
          (P1S_MAX_HEIGHT_MM - TIER_FRAME_BASE_TOP_MM) /
            (height + TIER_CLEARANCE_PER_DRAWER_MM)
        )
      )
    );
  }, [height]);

  const maxAllowedHeightForCurrentDrawers = useMemo(() => {
    const raw =
      (P1S_MAX_HEIGHT_MM - TIER_FRAME_BASE_TOP_MM) / drawersPerTier -
      TIER_CLEARANCE_PER_DRAWER_MM;
    return Math.max(10, Math.min(30, Math.floor(raw * 10) / 10));
  }, [drawersPerTier]);

  const getDividerForDrawer = useCallback(
    (t, b) => {
      return drawerDividers[`tier_${t}_box_${b}`] || { h: 1, v: 1 };
    },
    [drawerDividers]
  );

  const setDividerForDrawer = (t, b, axis, count) => {
    const key = `tier_${t}_box_${b}`;
    setDrawerDividers((prev) => {
      const current = prev[key] || { h: 1, v: 1 };
      return { ...prev, [key]: { ...current, [axis]: count } };
    });
    setOpenDrawersMap((prev) => ({ ...prev, [key]: true }));
  };

  const applyBatchDividers = (hCount, vCount) => {
    setBatchH(hCount);
    setBatchV(vCount);
    const updated = {};
    for (let t = 0; t < tiers; t++) {
      for (let b = 0; b < drawersPerTier; b++) {
        updated[`tier_${t}_box_${b}`] = { h: hCount, v: vCount };
      }
    }
    setDrawerDividers(updated);
  };

  const calculatePrice = () => {
    const totalDrawers = tiers * drawersPerTier;
    const ammoLidSubtitle = showAmmoRoundCount ? `${ammoTotalRounds} RDS` : '';
    
    if (activeTab === 'bench') {
      // 1. In Etsy Mode, return the flat all-inclusive preset price ($36 / $56 / $69 / $99)
      if (isEtsyMode && BENCH_PRESETS[sizePreset]?.etsyPrice) {
        return BENCH_PRESETS[sizePreset].etsyPrice;
      }

      // 2. Competitive Direct Mode Dynamic Calculation
      const baseFee = 13.50;
      const tierCost = tiers * 3.50;
      const volumeFactor = ((width * depth * height) / 25000) * 1.15;
      const drawersCost = totalDrawers * (1.20 + volumeFactor * 0.175);
      
      let dividersCost = 0;
      for (let t = 0; t < tiers; t++) {
        for (let b = 0; b < drawersPerTier; b++) {
          const div = getDividerForDrawer(t, b);
          const extraWalls = Math.max(0, (div.h - 1) + (div.v - 1));
          dividersCost += extraWalls * 0.35;
        }
      }

      return baseFee + tierCost + drawersCost + dividersCost;

    } else if (activeTab === 'ammo') {
      // 3. AMMO MATRIX TIERED PRICING MATRIX
      const cat = currentCalSpec?.category || 'Rimfire';
      const isBulk = ammoPreset === '250' || ammoTotalRounds >= 150;
      const isWeekend = ammoPreset === '100' || (ammoTotalRounds >= 75 && ammoTotalRounds < 150);

      // Define Etsy Retail Price Tables
      const AMMO_PRICES = {
        Rimfire: { standard: 46.00, weekend: 58.00, bulk: 74.00 },
        Pistol:  { standard: 49.00, weekend: 64.00, bulk: 82.00 },
        Rifle:   { standard: 54.00, weekend: 72.00, bulk: 94.00 },
        Shotgun: { standard: 58.00, weekend: 78.00, bulk: 99.00 }
      };

      const tierMap = AMMO_PRICES[cat] || AMMO_PRICES.Rimfire;
      const retailPrice = isBulk ? tierMap.bulk : isWeekend ? tierMap.weekend : tierMap.standard;

      if (isEtsyMode) {
        return retailPrice;
      }

      // Direct Mode / In-Person Sale Discount (15% off retail — saves marketplace fees while protecting margins)
      const directPrice = retailPrice * 0.85;
      return Number(directPrice.toFixed(2));

    } else {
      // 4. CARGO MATRIX CALCULATOR (Supports Etsy Presets + Custom Dimensions)
      if (isEtsyMode && CARGO_PRESETS[cargoPreset]?.etsyPrice) {
        return CARGO_PRESETS[cargoPreset].etsyPrice;
      }
      const basePrice = 9.50;
      const vol = (cargoWidth * cargoLength * (cargoHeight * 2)) / 50000;
      const compExtra = (cargoCompX * cargoCompY - 1) * 0.25;
      const textExtra = cargoText.trim() !== '' ? 2.0 : 0;
      return basePrice + vol * 1.4 + compExtra + textExtra;
    }
  };
  const generateAmmoMatrixScad = (exportMode = scadExportMode) => {
    const cal = AMMO_CALIBERS[ammoCaliber] || AMMO_CALIBERS['9mm'];
    const oal = cal.oal || 29.7;
    const cols = clampedAmmoCols;
    const rows = clampedAmmoRows;
    const totalRounds = cols * rows;

    const boreDia = Number((cal.holeDia || 10.3).toFixed(2));
    const pitch = Number((cal.pitch || (boreDia + 2.0)).toFixed(2));
    const trayWall = 3.2;
    const centerGap = 6.5;

    const spineAllowance = cols > 1 ? centerGap : 0;
    const trayW = Number((cols * pitch + spineAllowance + trayWall * 2).toFixed(2));
    const trayD = Number((rows * pitch + trayWall * 2).toFixed(2));
    const trayH = Number((cal.trayZ || Math.max(16.5, oal * 0.58)).toFixed(2));
    const tipConicalDepth = 3.5;
    const floorThick = 2.4;
    const fingerClearance = 14.0;

    const handleTotalH = Number((oal + floorThick + fingerClearance).toFixed(2));
    const shaftH = Number(Math.max(4.0, handleTotalH - trayH).toFixed(2));

    const shellW = Number((trayW + 12.8).toFixed(2));
    const shellD = Number((trayD + 12.8).toFixed(2));
    const shellZ = Math.ceil(oal + 32);
    const baseZ = shellZ - 12.0;
    const lidZ = 12.0;

    const titleText = (ammoLidTitle || cal.short || '9MM').trim().replace(/"/g, '\\"');
    const subText = showAmmoRoundCount ? `${totalRounds} RDS` : '';
    const numLatches = shellW >= 130 ? 2 : 1;
    const magPairs = Math.max(shellW, shellD) >= 150 ? 6 : 4;
    const magDia = Number((activeMagnetDia + 0.2).toFixed(1)); // 0.2mm glue tolerance
    const magDepth = 2.15; // 2mm magnet + 0.15mm glue tolerance

    return `// ============================================================================
// FIELDMATRIX 3D - AMMO MATRIX (FULL MULTI-PART PRODUCTION ASSEMBLY)
// Design Code : ${designCode}
// Caliber     : ${cal.name} (${cal.short}) - OAL: ${oal}mm
// Capacity    : ${totalRounds} Rounds (${cols} Cols x ${rows} Rows)
// Export Mode : ${exportMode.toUpperCase()}
// ============================================================================

$fn = 48;

export_part = "${exportMode}";

cols = ${cols};
rows = ${rows};
bore_d = ${boreDia};
pitch = ${pitch};
round_oal = ${oal};

tray_wall = ${trayWall};
tray_w = ${trayW};
tray_d = ${trayD};
tray_h = ${trayH};
floor_thick = ${floorThick};
tip_cone_h = ${tipConicalDepth};
center_gap = ${centerGap};
foot_h = 4.5;

shell_w = ${shellW};
shell_d = ${shellD};
shell_z = ${shellZ};
base_z = ${baseZ};
lid_z = ${lidZ};
wall_t = 3.2;
floor_t = 4.2;

lid_title = "${titleText}";
lid_sub = "${subText}";
lid_font = "${ammoLidFont || 'Impact'}:style=Bold";
enable_lid_border = ${enableAmmoLidBorder ? 'true' : 'false'};

snap_tol = 0.22;
handle_total_h = ${handleTotalH};
shaft_h = ${shaftH};
tbar_w = min(tray_w * 0.45, max(30, pitch * 2.2));
num_latches = ${numLatches};
mag_pairs = ${magPairs};
mag_d = ${magDia};
mag_t = ${magDepth};

// --- 1. STANDING BALLISTIC TRAY (WITH 8x3MM MAGNET FEET) ---
module ballistic_tray() {
    union() {
        difference() {
            hull() {
                translate([1.2, 1.2, 0])
                    cube([tray_w - 2.4, tray_d - 2.4, 1.2]);
                translate([0, 0, 1.2])
                    cube([tray_w, tray_d, tray_h - 1.2]);
            }

            left_cols = ceil(cols / 2);
            for (r = [0 : rows - 1]) {
                for (c = [0 : cols - 1]) {
                    col_offset = (c >= left_cols) ? center_gap : 0;
                    cx = (tray_w / 2) - (center_gap / 2) - (left_cols * pitch) + (pitch / 2) + (c * pitch) + col_offset;
                    cy = tray_wall + (r * pitch) + (pitch / 2);

                    translate([cx, cy, 0]) {
                        translate([0, 0, floor_thick])
                            cylinder(h = tip_cone_h + 0.05, d1 = bore_d * 0.42, d2 = bore_d);
                        translate([0, 0, floor_thick + tip_cone_h])
                            cylinder(h = tray_h, d = bore_d);
                        translate([0, 0, tray_h - 0.9])
                            cylinder(h = 1.0, d1 = bore_d, d2 = bore_d + 1.2);
                    }
                }
            }

            for (y_off = [-rows * pitch * 0.25, rows * pitch * 0.25]) {
                translate([tray_w / 2, tray_d / 2 + y_off, 0])
                    snap_socket_cutout();
            }
        }

        // Bottom Standoff Feet with 8.2x3.2mm Magnet Pockets
        mx = tray_w / 2 - 7.5;
        my = tray_d / 2 - 7.5;
        for (fx = [-mx, mx]) {
            for (fy = [-my, my]) {
                tray_magnet_foot(tray_w / 2 + fx, tray_d / 2 + fy);
            }
        }
        if (mag_pairs == 6) {
            if (shell_w >= shell_d) {
                for (fy = [-my, my]) {
                    tray_magnet_foot(tray_w / 2, tray_d / 2 + fy);
                }
            } else {
                for (fx = [-mx, mx]) {
                    tray_magnet_foot(tray_w / 2 + fx, tray_d / 2);
                }
            }
        }
    }
}

module tray_magnet_foot(x, y) {
    translate([x, y, -foot_h])
    difference() {
        cylinder(h = foot_h, r1 = (mag_d / 2) + 2.2, r2 = 7.25);
        translate([0, 0, -0.05])
            cylinder(h = mag_t + 0.05, d = mag_d);
    }
}

module snap_socket_cutout() {
    translate([0, 0, tray_h / 2])
        cube([3.8 + snap_tol * 2, 5.4 + snap_tol * 2, tray_h + 2], center = true);
    translate([0, 0, 1.4])
        cube([5.4 + snap_tol * 2, 5.6 + snap_tol * 2, 2.9], center = true);
}

// --- 2. SNAP-IN T-HANDLE ---
module snap_in_t_handle(print_flat = false) {
    leg_y = rows * pitch * 0.25;
    grip_len = max(tbar_w, leg_y * 2 + 12);

    rotate(print_flat ? [0, 90, 0] : [0, 0, 0])
    translate(print_flat ? [0, 0, 2.6] : [tray_w / 2, tray_d / 2, 0]) {
        union() {
            // Top Grip Bar (Spans along Y-axis across both legs!)
            translate([0, 0, handle_total_h - 2.5])
                cube([5.2, grip_len, 5.0], center = true);

            // Top Grip Ribs (Along Y-axis)
            for (i = [-2 : 2]) {
                translate([0, i * 6.0, handle_total_h + 0.4])
                    cube([5.2, 1.8, 1.0], center = true);
            }

            // Center Spine Bridge (Rests on top of tray spine)
            translate([0, 0, tray_h + 1.2])
                cube([5.2, (rows * pitch) - 2, 2.4], center = true);

            // Two Vertical Legs & Snap Prongs
            for (y_off = [-leg_y, leg_y]) {
                translate([0, y_off, 0])
                    handle_post_and_prong();
            }
        }
    }
}

module handle_post_and_prong() {
    union() {
        // Upper Shaft (Extends 2mm into top grip bar so there is zero gap!)
        translate([0, 0, tray_h + (shaft_h - 2.5) / 2])
            cube([5.2, 5.2, shaft_h - 2.5], center = true);

        // Lower Split Snap Prong (Inside Tray Socket)
        difference() {
            union() {
                translate([0, 0, (tray_h + 1.2) / 2])
                    cube([3.8, 5.2, tray_h + 1.2], center = true);
                hull() {
                    translate([0, 0, 2.6])
                        cube([5.2, 5.2, 0.8], center = true);
                    translate([0, 0, 0.4])
                        cube([3.6, 5.2, 0.8], center = true);
                }
            }
            translate([0, 0, tray_h * 0.35])
                cube([1.2, 10, tray_h * 0.75], center = true);
        }
    }
}

// --- 3. ARMORED BASE SHELL ---
module base_shell() {
    hinge_r = 4.2;
    hinge_y = -shell_d / 2 - 4.6; // 0.4mm clearance outside r=4.2 so shells close 100% flush!
    hinge_x_span = shell_w * 0.28; // Positions for Left & Right M3x20mm hinge assemblies

    difference() {
        union() {
            // Main Shell Body (Hollowed BEFORE adding exterior hardware)
            difference() {
                translate([-shell_w / 2, -shell_d / 2, 0])
                    cube([shell_w, shell_d, base_z]);
                // Hollow Interior Cavity
                translate([-shell_w / 2 + wall_t, -shell_d / 2 + wall_t, floor_t])
                    cube([shell_w - wall_t * 2, shell_d - wall_t * 2, base_z + 1]);
            }
            // Exterior Tactical Ribs & Rear Anti-Tip Outrigger Heels
            for (dir = [-1, 1]) {
                // Left & Right Side Ribs
                translate([-shell_w / 2 - 1.8, dir * (shell_d * 0.26) - 5, 0])
                    cube([1.8, 10, base_z - 2]);
                translate([shell_w / 2, dir * (shell_d * 0.26) - 5, 0])
                    cube([1.8, 10, base_z - 2]);
                
                // Front Side Ribs
                translate([dir * (shell_w * 0.36) - 5, shell_d / 2, 0])
                    cube([10, 1.8, base_z - 2]);

                // Rear Anti-Tip Outrigger Heels (Dual Purpose: Stabilizer + 110-Deg Lid Stop)
                hull() {
                    translate([dir * (shell_w * 0.36) - 5, -shell_d / 2 - 1.8, base_z - 6.0])
                        cube([10, 1.8, 4.0]);
                    translate([dir * (shell_w * 0.36) - 5, -shell_d / 2 - 12.0, 0])
                        cube([10, 12.0, 3.0]);
                }
            }

            // Dual M3x20mm Rear Corner Hinge Clevises (Zero-Play 0.2mm tolerance!)
            // Each assembly is 19.6mm wide: 6.0mm Outer Ear + 7.6mm Gap (for 7.2mm Lid Lug) + 6.0mm Inner Ear
            for (side = [-1, 1]) {
                hx = side * hinge_x_span;
                for (ear_off = [-6.8, 6.8]) {
                    union() {
                        // Coaxial Knuckle Barrel on Seam Z = base_z
                        translate([hx + ear_off, hinge_y, base_z])
                        rotate([0, 90, 0])
                            cylinder(r = hinge_r, h = 6.0, center = true);
                        // Support Gusset kept strictly below Z = base_z - 0.4 so lid never binds!
                        hull() {
                            translate([hx + ear_off, hinge_y, base_z - 2.3])
                                cube([6.0, hinge_r * 2, 3.8], center = true);
                            translate([hx + ear_off, -shell_d / 2 + 1.0, base_z - 8.5])
                                cube([6.0, 2.0, 4.0], center = true);
                        }
                    }
                }
            }

            // Front Latch Clevis Mounts (Extra-beefy r=4.5mm ears for M3x20mm bolt!)
            // Front Base 45-Deg Catch Wedges + Protective Bag-Snag Side Shrouds
            for (lx = (num_latches == 2 ? [-shell_w * 0.23, shell_w * 0.23] : [0])) {
                // 1. Center True Locking Catch Hook (Undercut shelf + deeper 3.6mm bite!)
                translate([lx, shell_d / 2, base_z])
                rotate([90, 0, 90])
                linear_extrude(height = 14.0, center = true) {
                    polygon(points = [
                        [-1.0, -2.0],  // Top root anchored inside base wall
                        [ 4.2, -5.2],  // Outer catch nose peak (Extended to 4.2 for deeper bite)
                        [ 4.2, -6.8],  // Nose vertical face
                        [ 0.0, -5.8],  // STEEPER UNDERCUT SHELF (Drops 1.0mm to create a heavy hook angle)
                        [-1.0, -5.8]   // Bottom root inside base wall
                    ]);
                }
                // 2. Flanking Protective Side Shrouds (Shields closed latch edges from bag snags)
                for (cx = [-8.6, 8.6]) {
                    hull() {
                        // Outer shroud face (protrudes 6.2mm to sit flush with closed latch spine)
                        translate([lx + cx, shell_d / 2 + 3.1, base_z - 5.2])
                            cube([3.6, 6.2, 8.4], center = true);
                        // Wall root extends down with 45-deg print-friendly bottom bevel
                        translate([lx + cx, shell_d / 2 - 0.5, base_z - 8.2])
                            cube([3.6, 1.0, 14.4], center = true);
                    }
                }
            }
        }

        // Clearance Relief Cutouts for Lid Center Hinge Knuckles
        for (side = [-1, 1]) {
            translate([side * hinge_x_span, hinge_y, base_z])
            rotate([0, 90, 0])
                cylinder(r = hinge_r + 0.6, h = 7.6, center = true);
        }

        // M3x20mm Rear Hinge Bores (Outer ear = 3.3mm pass-through, Inner ear = 2.85mm self-tapping thread!)
        for (side = [-1, 1]) {
            hx = side * hinge_x_span;
            // Outer ear pass-through bore (3.3mm)
            translate([hx + side * 6.8, hinge_y, base_z])
            rotate([0, 90, 0])
                cylinder(d = 3.3, h = 8.0, center = true);
            // Inner ear self-tapping thread bore (2.85mm)
            translate([hx - side * 6.8, hinge_y, base_z])
            rotate([0, 90, 0])
                cylinder(d = 2.85, h = 8.0, center = true);
        }

        // Base Floor Dynamic 2mm Magnet Pockets
        mx = tray_w / 2 - 7.5;
        my = tray_d / 2 - 7.5;
        for (fx = [-mx, mx]) {
            for (fy = [-my, my]) {
                translate([fx, fy, floor_t - mag_t])
                    cylinder(h = mag_t + 0.1, d = mag_d);
            }
        }
        if (mag_pairs == 6) {
            if (shell_w >= shell_d) {
                for (fy = [-my, my]) {
                    translate([0, fy, floor_t - mag_t])
                        cylinder(h = mag_t + 0.1, d = mag_d);
                }
            } else {
                for (fx = [-mx, mx]) {
                    translate([fx, 0, floor_t - mag_t])
                        cylinder(h = mag_t + 0.1, d = mag_d);
                }
            }
        }
    } // Closes difference()
} // Closes module base_shell()

// --- 4. VAULT LID & FLUSH MULTI-COLOR INLAY ---
module lid_inlay_2d() {
    bw = shell_w * 0.78;
    bd = shell_d * 0.58;
    // Scale title font size by both frame height/width AND character length so it never hits the border!
    char_count = max(4, len(lid_title));
    title_sz = min(bw * 0.16, bd * 0.26, ((bw - 12.0) / char_count) * 1.32);
    sub_sz = min(bw * 0.09, bd * 0.14);
    if (enable_lid_border) {
        difference() {
            square([bw, bd], center = true);
            square([bw - 4.0, bd - 4.0], center = true);
        }
    }
    rotate([0, 0, 180]) {
        if (lid_title != "") {
            translate([0, lid_sub != "" ? bd * 0.08 : 0, 0])
                text(lid_title, size = title_sz, font = lid_font, halign = "center", valign = "center");
        }
        if (lid_sub != "") {
            translate([0, lid_title != "" ? -bd * 0.22 : 0, 0])
                text(lid_sub, size = sub_sz, font = lid_font, halign = "center", valign = "center");
        }
    }
}

module vault_lid() {
    hinge_r = 4.2;
    hinge_y = -shell_d / 2 - 4.6; // Matches base_shell hinge_y (-shell_d/2 - 4.6)
    hinge_x_span = shell_w * 0.28;
    lid_knuckle_w = 7.2; // Fits inside 7.6mm base slot with 0.2mm clearance per side!
    ceiling_z = lid_z - 3.0;
    w_span = 12.8;

    union() {
        difference() {
            union() {
                // Main Lid Box (Z = 0 is parting line, Z = lid_z is top roof)
                difference() {
                    translate([-shell_w / 2, -shell_d / 2, 0])
                        cube([shell_w, shell_d, lid_z]);
                    translate([-shell_w / 2 + wall_t, -shell_d / 2 + wall_t, -0.1])
                        cube([shell_w - wall_t * 2, shell_d - wall_t * 2, ceiling_z + 0.1]);
                }

                // Inner TPU Mounting Scaffold & Centering Frame (Hangs from ceiling_z)
                pad_w = tray_w - 1.6;
                pad_d = tray_d - 1.6;
                // Reach down 14.5mm from lid ceiling so the TPU pad contacts the brass rims!
                scaf_h = (shell_z - 3.0) - (floor_t + foot_h + floor_thick + round_oal) - 6.4;

                translate([0, 0, ceiling_z - scaf_h / 2]) {
                    // 1. Outer Centering Frame Lip (1.6mm tall retaining rim around TPU pad)
                    difference() {
                        cube([pad_w + 3.2, pad_d + 3.2, scaf_h + 1.6], center = true);
                        cube([pad_w + 0.4, pad_d + 0.4, scaf_h + 2.0], center = true);
                    }
                    // 2. Inner Glue Scaffold Grid (Aligned with Y-Axis T-Bar Handle!)
                    grip_len = max(tbar_w, (rows * pitch * 0.5) + 12);
                    difference() {
                        cube([pad_w, pad_d, scaf_h], center = true);
                        
                        // Four corner glue-relief pockets
                        for (gx = [-1, 1]) {
                            for (gy = [-1, 1]) {
                                translate([gx * (pad_w * 0.28), gy * (pad_d * 0.25), 0])
                                    cube([pad_w * 0.40, pad_d * 0.40, scaf_h + 1], center = true);
                            }
                        }
                        // Center Y-Axis Handle Clearance Slot (11mm wide in X, grip_len + 5mm long in Y!)
                        cube([11.0, grip_len + 5.0, scaf_h + 2], center = true);
                    }
                }

                // Exterior Tactical Ribs for the Lid (Matches the Base!)
                for (dir = [-1, 1]) {
                    translate([-shell_w / 2 - 1.8, dir * (shell_d * 0.26) - 5, 2])
                        cube([1.8, 10, lid_z - 2]);
                    translate([shell_w / 2, dir * (shell_d * 0.26) - 5, 2])
                        cube([1.8, 10, lid_z - 2]);
                    translate([dir * (shell_w * 0.36) - 5, -shell_d / 2 - 1.8, 2])
                        cube([10, 1.8, lid_z - 2]);
                    translate([dir * (shell_w * 0.36) - 5, shell_d / 2, 2])
                        cube([10, 1.8, lid_z - 2]);
                }

                // Dual Rear Lid Hinge Knuckles + Print-Flat 45-Deg Gussets
                for (side = [-1, 1]) {
                    hx = side * hinge_x_span;
                    union() {
                        translate([hx, hinge_y, 0])
                        rotate([0, 90, 0])
                            cylinder(r = hinge_r, h = lid_knuckle_w, center = true);
                        // Anchored flush to Z = lid_z (print bed) so it prints with zero overhang chatter!
                        hull() {
                            translate([hx, hinge_y, 2.3])
                                cube([lid_knuckle_w, hinge_r * 2, 3.8], center = true);
                            translate([hx, -shell_d / 2 - 0.5, lid_z - 1.0])
                                cube([lid_knuckle_w, 3.0, 2.0], center = true);
                        }
                    }
                }

                // Lid-Mounted Front M3 Latch Pivot Ears (Anchored flush to Z = lid_z on print bed)
                for (lx = (num_latches == 2 ? [-shell_w * 0.23, shell_w * 0.23] : [0])) {
                    for (cx = [-8.6, 8.6]) {
                        hull() {
                            translate([lx + cx, shell_d / 2 + 4.2, 6.0])
                            rotate([0, 90, 0])
                                cylinder(r = 4.5, h = 3.6, center = true);
                            translate([lx + cx, shell_d / 2 + 1.2, lid_z - 0.75])
                                cube([3.6, 4.4, 1.5], center = true);
                            translate([lx + cx, shell_d / 2 - 0.5, (lid_z + 1.5) / 2])
                                cube([3.6, 1.0, lid_z - 1.5], center = true);
                        }
                    }
                }
            }

            // M3 Front Latch Pin Bores in Lid (Outer ear 3.3mm, Inner ear 2.85mm self-tapping for M3x20mm)
            for (lx = (num_latches == 2 ? [-shell_w * 0.23, shell_w * 0.23] : [0])) {
                translate([lx - 5.0, shell_d / 2 + 4.2, 6.0])
                rotate([0, 90, 0])
                    cylinder(d = 3.3, h = 16.0, center = true);
                translate([lx + 5.0, shell_d / 2 + 4.2, 6.0])
                rotate([0, 90, 0])
                    cylinder(d = 2.85, h = 16.0, center = true);
            }

            // Clearance Relief for Base Hinge Ears
            for (side = [-1, 1]) {
                hx = side * hinge_x_span;
                for (ear_off = [-6.8, 6.8]) {
                    translate([hx + ear_off, hinge_y, 0])
                    rotate([0, 90, 0])
                        cylinder(r = hinge_r + 0.6, h = 6.4, center = true);
                }
            }

            // 3.3mm Free-Spinning M3 Hinge Pin Bores through Lid Knuckles
            for (side = [-1, 1]) {
                translate([side * hinge_x_span, hinge_y, 0])
                rotate([0, 90, 0])
                    cylinder(d = 3.35, h = lid_knuckle_w + 2, center = true);
            }

            // Subtract 0.8mm Multi-Color Inlay Pocket from Top Face (Z = lid_z)
            translate([0, 0, lid_z - 0.8])
            linear_extrude(height = 1.0)
                lid_inlay_2d();
        }
    }
}

// --- 5. CAM-ACTION SNAP LATCHES (UNDERCUT HOOK + EXTENDED TAB) ---
// Local coords: Pin centered at [0, 0, 0].
// When installed & closed: +Z points UP toward lid, -Y points INWARD toward box front wall.
module cam_latch() {
    w = 13.2; // Fits cleanly inside 13.6mm gap between Lid Ears and Base Side Shrouds
    difference() {
        union() {
            // Extrude 2D True Snap-Hook Latch Profile along X = [-w/2, +w/2]
            rotate([90, 0, 90])
            linear_extrude(height = w, center = true) {
                union() {
                    // 1. Rounded Pivot Barrel at [0, 0]
                    circle(r = 3.6);

                    // 2. Spring Spine + Undercut Hook + Extended Lower Tab
                    polygon(points = [
                        [-0.5,   2.4],  // Inner arm near pivot
                        [-0.5,   8.0],  // Clears parting line & top of base catch
                        [-0.8,   8.4],  // Top of catch pocket
                        [-0.8,  12.8],  // Back wall of pocket
                        [-4.5,  11.8],  // AGGRESSIVE UNDERCUT HOOK (Extended to -4.5, steeply angled to interlock)
                        [-4.5,  13.8],  // Inner hook tip (0.2mm clearance over the 4.2mm base nose)
                        [-0.4,  17.2],  // 45-deg cam entry ramp (forces the arm to flex outward as it closes)
                        [ 1.4,  20.0],  // Extended bottom inner corner
                        [ 5.2,  20.0],  // Outward finger-pull release tab
                        [ 5.2,  17.6],  // Top of release tab
                        [ 2.8,  16.2],  // Outer spine face (sits flush with side shrouds)
                        [ 2.8,   0.0]   // Outer spine back to pivot barrel
                    ]);
                }
            }

            // 3. Exterior Tactile Grip Ridges (spaced down the extended spine)
            for (rz = [5.2, 8.6, 12.0]) {
                translate([0, 3.0, rz])
                    cube([11.0, 0.9, 1.2], center = true);
            }
        }

        // Tightened M3 Pivot Pin Bore (3.15mm instead of 3.4mm to eliminate vertical hinge play!)
        rotate([0, 90, 0])
            cylinder(d = 3.15, h = w + 2, center = true);

        // Internal Leaf-Spring Flex Slot (Lengthened so the deeper hook flexes smoothly without cracking)
        rotate([90, 0, 90])
        linear_extrude(height = w + 2, center = true) {
            hull() {
                translate([0.95, 4.5])  circle(d = 1.20);
                translate([0.95, 15.2]) circle(d = 1.20);
            }
        }
    }
}

// --- 6. TPU RATTLE PAD ---
module tpu_rattle_pad() {
    pad_t = 5.5;
    difference() {
        cube([tray_w - 2.0, tray_d - 2.0, pad_t], center = true);
        // Handle cutout slot + 11.5mm wide so the T-bar nests cleanly inside
        cube([11.5, max(tbar_w, rows * pitch * 0.5 + 12) + 4.0, pad_t + 2.0], center = true);
    }
}

// --- EXPORT ROUTER ---
if (export_part == "full") {
    plate_gap = 18;
    col2_x = shell_w / 2 + tray_w / 2 + plate_gap;
    col3_x = col2_x + tray_w / 2 + plate_gap + 25;

    // 1. Base Shell
    color("${activeAmmoBaseColor.hex}")
        base_shell();

    // 2. Vault Lid + Multi-Color Inlay (Grouped so text moves with the lid!)
    translate([0, shell_d + plate_gap, lid_z])
    rotate([180, 0, 0]) {
        color("${activeAmmoLidColor.hex}") 
            vault_lid();
            
        // Extrude to 0.8mm and shift up to sit perfectly flush inside the pocket!
        color("${activeAmmoLatchColor.hex}") 
            translate([0, 0, lid_z - 0.8]) 
            linear_extrude(height = 0.8) 
                lid_inlay_2d();
    }

    // 3. Standing Ballistic Tray
    translate([col2_x - tray_w / 2, -tray_d / 2, foot_h])
    color("${activeAmmoTrayColor.hex}")
        ballistic_tray();

    // 4. TPU Anti-Rattle Pad (Uses exact PETG Black #1F2421)
    translate([col2_x, shell_d + plate_gap, 2.25])
    color("#1F2421")
        tpu_rattle_pad();

    // 5. Snap-In T-Handle
    translate([col3_x, -shell_d * 0.15, 0])
    color("${activeAmmoLatchColor.hex}")
        snap_in_t_handle(true);

    // 6. Cam-Action Draw Latches
    for (i = [0 : num_latches - 1]) {
        translate([col3_x, shell_d * 0.35 + (i * 16), 6.6]) rotate([0, 90, 0])
        color("${activeAmmoLatchColor.hex}") cam_latch();
    }
} else if (export_part == "lid_only") {
    translate([0, 0, lid_z])
    rotate([180, 0, 0]) {
        color("${activeAmmoLidColor.hex}") vault_lid();
    }
} else if (export_part == "base_only") {
    color("${activeAmmoBaseColor.hex}") base_shell();
} else if (export_part == "text_only") {
    translate([0, 0, 0.8])
    rotate([180, 0, 0])
    color("${activeAmmoLatchColor.hex}")
        linear_extrude(height = 0.8)
            lid_inlay_2d();
} else if (export_part == "inlay_only") {
    translate([0, 0, lid_z]) rotate([180, 0, 0])
    color("${activeAmmoLatchColor.hex}") lid_inlay_2d();
} else if (export_part == "tray_only") {
    translate([-tray_w / 2, -tray_d / 2, foot_h])
    color("${activeAmmoTrayColor.hex}") ballistic_tray();
} else if (export_part == "handle_only") {
    color("${activeAmmoLatchColor.hex}") snap_in_t_handle(true);
} else if (export_part == "latch_only") {
    for (i = [0 : num_latches - 1]) {
        translate([i * 22, 0, 6.6]) rotate([0, 90, 0])
        color("${activeAmmoLatchColor.hex}") cam_latch();
    }
} else if (export_part == "tpu_pad") {
    color("#1F2421") tpu_rattle_pad();
}
`;
  };
  const generateSpecSheet = () => {
    let spec = `====================================================\n`;
    spec += `    FIELDMATRIX 3D - PRINT & SHIP SPECIFICATION\n`;
    spec += `====================================================\n`;
    spec += `Design Code  : ${designCode || 'UNSAVED'}\n`;
    spec += `Order Channel: ${isEtsyMode ? 'ETSY PRESET ORDER' : 'DIRECT CUSTOM ORDER (SQUARE)'}\n`;
    spec += `Product Line : ${currentProductMeta.name} (${currentProductMeta.subtitle})\n`;
    if (isEtsyMode) {
      const etsyOptLabel =
        activeTab === 'bench'
          ? `${sizePreset} (${tiers}T x ${drawersPerTier}D)`
          : activeTab === 'ammo'
          ? `${ammoTotalRounds} Rounds (${clampedAmmoCols}x${clampedAmmoRows} ${currentCalSpec.short})`
          : `${cargoPreset} (${cargoWidth}x${cargoLength}x${cargoHeight * 2}mm)`;
      spec += `Etsy Option  : ${etsyOptLabel}\n\n`;
    } else {
      spec += `Est. Price   : $${calculatePrice().toFixed(2)}\n\n`;
    }

    if (activeTab === 'ammo') {
      const getPetgName = (hex) => BAMBU_PETG_COLORS.find((c) => c.hex === hex)?.name || hex;
      const magCount = Math.max(ammoShellX, ammoShellY) >= 150 ? 12 : 8; // <-- ADD THIS LINE

      spec += `[ 1. PRINT & SHIP SPECIFICATIONS — BALLISTIC VAULT ]\n`;
      spec += `- Caliber           : ${currentCalSpec.name} (${currentCalSpec.short})\n`;
      spec += `- Capacity          : ${ammoTotalRounds} Rounds (${clampedAmmoCols} Cols x ${clampedAmmoRows} Rows)\n`;
      spec += `- Exterior Shell    : ${ammoShellX} x ${ammoShellY} x ${ammoShellZ} mm\n`;
      spec += `- Standing Tray     : ${ammoTrayX} x ${ammoTrayY} x ${ammoTrayZ} mm\n`;
      spec += `- Bore & Pitch      : Ø${currentCalSpec.holeDia} mm Hole / ${currentCalSpec.pitch} mm Pitch\n`;
      spec += `- Hardware BOM      : 4x M3x20mm SHCS, 4x M3 Hex Nuts, ${magCount}x (${activeMagnetDia}x2mm) Magnets\n`;
      spec += `- Base / Lid Color  : ${activeAmmoBaseColor.name} (${activeAmmoBaseColor.hex}) / ${activeAmmoLidColor.name} (${activeAmmoLidColor.hex})\n`;
      spec += `- Tray / Accent     : ${activeAmmoTrayColor.name} (${activeAmmoTrayColor.hex}) / ${activeAmmoLatchColor.name} (${activeAmmoLatchColor.hex})\n`;
      spec += `- Lid Inlay Text    : "${ammoLidTitle}"${showAmmoRoundCount ? ` / "${ammoTotalRounds} RDS"` : ' (Round Count Off)'}\n`;
    } else if (activeTab === 'bench') {
      spec += `[ 1. GEOMETRY & CONFIGURATION ]\n`;
      spec += `- Preset Tier        : ${sizePreset}\n`;
      spec += `- Number of Tiers    : ${tiers}\n`;
      spec += `- Drawers per Tier   : ${drawersPerTier} (${tiers * drawersPerTier} Total Drawers)\n`;
      spec += `- Single Tier Height : ${singleTierHeightMm} mm (Max 250.0 mm Solid Pivot Rod)\n`;
      spec += `- Total Stack Height : ${totalStackedHeightMm} mm\n`;
      spec += `- Opening Pivot Side : ${opening} Hinge Rod\n`;
      spec += `- Finger Pull Handle : ${handlePos} Curved Corner Notch\n`;
      spec += `- Outer Width        : ${width} mm\n`;
      spec += `- Outer Depth        : ${depth} mm\n`;
      spec += `- Drawer Height      : ${height.toFixed(1)} mm\n\n`;

      spec += `[ 2. COLORS (20 BAMBU LAB PLA SWATCHES) ]\n`;
      spec += `- Outer Casing & Rod : ${activeCasingColor.name} (${activeCasingColor.hex})\n`;
      spec += `- Drawers & Dividers : ${activeDrawerColor.name} (${activeDrawerColor.hex})\n\n`;

      spec += `[ 3. LABEL SLOT SETTINGS ]\n`;
      spec += `- Enable Label Slot  : ${enableLabelSlot ? 'YES' : 'NO'}\n`;
      if (enableLabelSlot) {
        spec += `- Label Slot Width   : ${labelWidth} mm\n`;
        spec += `- Label Slot Height  : ${labelHeight} mm\n`;
        spec += `- Font Family        : ${labelFont}\n`;
      }
      spec += `\n[ 4. PER-DRAWER DIVIDERS (H x V) & CUSTOM LABELS ]\n`;
      for (let t = tiers - 1; t >= 0; t--) {
        spec += `--- Tier ${t + 1} ---\n`;
        for (let b = drawersPerTier - 1; b >= 0; b--) {
          const lbl = (labels[`tier_${t}_box_${b}`] || '').trim() || '(No Label)';
          const div = getDividerForDrawer(t, b);
          spec += `  Drawer ${b + 1}: Sections [${div.h}H x ${div.v}V] | Label: "${lbl}"\n`;
        }
      }
    } else {
      spec += `[ 1. CARGO MATRIX DIMENSIONS & GRID ]\n`;
      spec += `- Preset Size        : ${cargoPreset}\n`;
      spec += `- Box Width (X)      : ${cargoWidth} mm\n`;
      spec += `- Box Length (Y)     : ${cargoLength} mm\n`;
      spec += `- Half Height (Z)    : ${cargoHeight} mm (${cargoHeight * 2} mm Closed Total)\n`;
      spec += `- Compartment Grid   : ${cargoCompX} Columns (X) x ${cargoCompY} Rows (Y) (${cargoCompX * cargoCompY} Compartments)\n\n`;

      spec += `[ 2. FILAMENT COLORS & LID INLAY ]\n`;
      spec += `- Box Body & Hinges  : ${activeCargoBoxColor.name} (${activeCargoBoxColor.hex})\n`;
      spec += `- Lid Text & Border  : ${activeCargoTextColor.name} (${activeCargoTextColor.hex})\n`;
      spec += `- Cam Latches        : ${activeCargoLatchColor.name} (${activeCargoLatchColor.hex})\n`;
      spec += `- Custom Lid Text    : "${cargoText.trim() || '(None)'}"\n`;
      spec += `- Lid Font Style     : ${cargoFont}\n`;
      spec += `- Lid Border Inlay   : ${cargoBorder ? 'YES (Flush Inlay Frame)' : 'NO'}\n`;
    }
    return spec;
  };

  // ==========================================
  // BAMBU P1S PARAMETRIC OPENSCAD GENERATOR FOR CARGO MATRIX
  // ==========================================
  const generateScadCode = (mode = scadExportMode) => {
    const rawLines = (cargoText || '').split('\n').map((s) => s.trim()).filter(Boolean);
    let line1 = rawLines[0] || '';
    let line2 = rawLines[1] || '';

    if (rawLines.length === 1 && line1.length > 12 && line1.includes(' ')) {
      const words = line1.split(' ');
      const mid = Math.ceil(words.length / 2);
      line1 = words.slice(0, mid).join(' ');
      line2 = words.slice(mid).join(' ');
    }

    const cleanLine1 = line1.replace(/"/g, '\\"');
    const cleanLine2 = line2.replace(/"/g, '\\"');
    const totalZ = cargoHeight * 2;
    const lidZ = 12.0;
    const baseZ = totalZ - lidZ;
    const numLatches = cargoWidth >= 130 ? 2 : 1;

    return `// =========================================================================
// FIELDMATRIX 3D - THE CARGO MATRIX (TACTICAL BOLTED ASSEMBLY)
// Design Code : ${designCode || 'CUSTOM'}
// Preset Tier : ${cargoPreset}
// Dimensions  : ${cargoWidth}mm (W) x ${cargoLength}mm (L) x ${totalZ}mm (Total H)
// Grid Layout : ${cargoCompX} Cols x ${cargoCompY} Rows
// Export Mode : ${mode.toUpperCase()}
// =========================================================================

$fn = 48;
export_part = "${mode}";

shell_w = ${cargoWidth};
shell_d = ${cargoLength};
total_z = ${totalZ};
base_z = ${baseZ};
lid_z = ${lidZ};
wall_t = 2.4;
floor_t = 2.4;

comp_x = ${cargoCompX};
comp_y = ${cargoCompY};
num_latches = ${numLatches};

box_color  = "${activeCargoBoxColor.hex}";
text_color = "${activeCargoTextColor.hex}";
latch_color = "${activeCargoLatchColor.hex}";
box_text_1 = "${cleanLine1}";
box_text_2 = "${cleanLine2}";
font_style = "${cargoFont}:style=Bold";
enable_lid_border = ${cargoBorder ? 'true' : 'false'};

// --- 1. ARMORED BASE SHELL (WITH COMPARTMENT GRID) ---
module base_shell() {
    hinge_r = 4.2;
    hinge_y = -shell_d / 2 - 4.6;
    hinge_x_span = shell_w * 0.28;

    difference() {
        union() {
            // Main Shell Body
            difference() {
                translate([-shell_w / 2, -shell_d / 2, 0])
                    cube([shell_w, shell_d, base_z]);
                // Hollow Cavity
                translate([-shell_w / 2 + wall_t, -shell_d / 2 + wall_t, floor_t])
                    cube([shell_w - wall_t * 2, shell_d - wall_t * 2, base_z + 1]);
            }
            
            // Interior Grid Dividers
            inner_w = shell_w - wall_t * 2;
            inner_d = shell_d - wall_t * 2;
            cw = (inner_w - wall_t * (comp_x - 1)) / comp_x;
            cd = (inner_d - wall_t * (comp_y - 1)) / comp_y;
            
            if (comp_x > 1) {
                for (i = [1 : comp_x - 1]) {
                    translate([-inner_w/2 + i * (cw + wall_t) - wall_t/2, 0, floor_t + (base_z - floor_t)/2])
                        cube([wall_t, inner_d, base_z - floor_t], center=true);
                }
            }
            if (comp_y > 1) {
                for (j = [1 : comp_y - 1]) {
                    translate([0, -inner_d/2 + j * (cd + wall_t) - wall_t/2, floor_t + (base_z - floor_t)/2])
                        cube([inner_w, wall_t, base_z - floor_t], center=true);
                }
            }

            // Exterior Tactical Ribs & Rear Anti-Tip Outrigger Heels
            for (dir = [-1, 1]) {
                // Left & Right Side Ribs
                translate([-shell_w / 2 - 1.8, dir * (shell_d * 0.26) - 5, 0])
                    cube([1.8, 10, base_z - 2]);
                translate([shell_w / 2, dir * (shell_d * 0.26) - 5, 0])
                    cube([1.8, 10, base_z - 2]);
                
                // Front Side Ribs
                translate([dir * (shell_w * 0.36) - 5, shell_d / 2, 0])
                    cube([10, 1.8, base_z - 2]);

                // Rear Anti-Tip Outrigger Heels (Stabilizer + 110-Deg Lid Stop)
                hull() {
                    translate([dir * (shell_w * 0.36) - 5, -shell_d / 2 - 1.8, base_z - 6.0])
                        cube([10, 1.8, 4.0]);
                    translate([dir * (shell_w * 0.36) - 5, -shell_d / 2 - 12.0, 0])
                        cube([10, 12.0, 3.0]);
                }
            }

            // Rear Hinge Clevises
            for (side = [-1, 1]) {
                hx = side * hinge_x_span;
                for (ear_off = [-6.8, 6.8]) {
                    union() {
                        translate([hx + ear_off, hinge_y, base_z])
                        rotate([0, 90, 0])
                            cylinder(r = hinge_r, h = 6.0, center = true);
                        hull() {
                            translate([hx + ear_off, hinge_y, base_z - 2.3])
                                cube([6.0, hinge_r * 2, 3.8], center = true);
                            translate([hx + ear_off, -shell_d / 2 + 1.0, base_z - 8.5])
                                cube([6.0, 2.0, 4.0], center = true);
                        }
                    }
                }
            }

            // Front Latch Catches & Shrouds
            for (lx = (num_latches == 2 ? [-shell_w * 0.23, shell_w * 0.23] : [0])) {
                translate([lx, shell_d / 2, base_z])
                rotate([90, 0, 90])
                linear_extrude(height = 14.0, center = true) {
                    polygon(points = [
                        [-1.0, -2.0], [ 4.2, -5.2], [ 4.2, -6.8], [ 0.0, -5.8], [-1.0, -5.8]
                    ]);
                }
                for (cx = [-8.6, 8.6]) {
                    hull() {
                        translate([lx + cx, shell_d / 2 + 3.1, base_z - 5.2])
                            cube([3.6, 6.2, 8.4], center = true);
                        translate([lx + cx, shell_d / 2 - 0.5, base_z - 8.2])
                            cube([3.6, 1.0, 14.4], center = true);
                    }
                }
            }
        }

        // Base Hinge Cutouts & Bores
        for (side = [-1, 1]) {
            hx = side * hinge_x_span;
            translate([hx, hinge_y, base_z])
            rotate([0, 90, 0])
                cylinder(r = hinge_r + 0.6, h = 7.6, center = true);
            
            translate([hx + side * 6.8, hinge_y, base_z])
            rotate([0, 90, 0])
                cylinder(d = 3.3, h = 8.0, center = true);
            translate([hx - side * 6.8, hinge_y, base_z])
            rotate([0, 90, 0])
                cylinder(d = 2.85, h = 8.0, center = true);
        }
    }
}

// --- 2. SHALLOW VAULT LID ---
module chamfered_rect_2d(w, l, c) {
    polygon(points = [
        [-w/2 + c, -l/2], [ w/2 - c, -l/2], [ w/2, -l/2 + c], [ w/2, l/2 - c],
        [ w/2 - c, l/2], [-w/2 + c, l/2], [-w/2, l/2 - c], [-w/2, -l/2 + c]
    ]);
}

module lid_inlay_2d() {
    bw = shell_w - 24;
    bl = shell_d - 24;
    max_chars = max(4, len(box_text_1), len(box_text_2));
    
    // Scale text dynamically to fit frame
    comp_sz = min((bw - 16) / max_chars * 1.3, bl * 0.24, 22);
    t_sz = max(5.5, comp_sz);
    
    if (enable_lid_border) {
        difference() {
            chamfered_rect_2d(bw, bl, 3.5);
            chamfered_rect_2d(bw - 4.0, bl - 4.0, 2.5);
        }
    }
    rotate([0, 0, 180]) {
        if (box_text_1 != "") {
            if (box_text_2 == "") {
                text(box_text_1, size=t_sz, font=font_style, halign="center", valign="center");
            } else {
                translate([0, t_sz * 0.7, 0])
                    text(box_text_1, size=t_sz, font=font_style, halign="center", valign="center");
                translate([0, -t_sz * 0.7, 0])
                    text(box_text_2, size=t_sz, font=font_style, halign="center", valign="center");
            }
        }
    }
}

module vault_lid() {
    hinge_r = 4.2;
    hinge_y = -shell_d / 2 - 4.6;
    hinge_x_span = shell_w * 0.28;
    lid_knuckle_w = 7.2;

    union() {
        difference() {
            union() {
                // Main Lid Body
                difference() {
                    translate([-shell_w / 2, -shell_d / 2, 0])
                        cube([shell_w, shell_d, lid_z]);
                    translate([-shell_w / 2 + wall_t, -shell_d / 2 + wall_t, -0.1])
                        cube([shell_w - wall_t * 2, shell_d - wall_t * 2, lid_z - floor_t + 0.1]);
                }

                // Exterior Ribs
                for (dir = [-1, 1]) {
                    translate([-shell_w / 2 - 1.8, dir * (shell_d * 0.26) - 5, 2])
                        cube([1.8, 10, lid_z - 2]);
                    translate([shell_w / 2, dir * (shell_d * 0.26) - 5, 2])
                        cube([1.8, 10, lid_z - 2]);
                    translate([dir * (shell_w * 0.36) - 5, -shell_d / 2 - 1.8, 2])
                        cube([10, 1.8, lid_z - 2]);
                    translate([dir * (shell_w * 0.36) - 5, shell_d / 2, 2])
                        cube([10, 1.8, lid_z - 2]);
                }

                // Dual Rear Lid Hinge Knuckles + Print-Flat 45-Deg Gussets
                for (side = [-1, 1]) {
                    hx = side * hinge_x_span;
                    union() {
                        translate([hx, hinge_y, 0])
                        rotate([0, 90, 0])
                            cylinder(r = hinge_r, h = lid_knuckle_w, center = true);
                        // Anchored flush to Z = lid_z (print bed) so it prints with zero overhang chatter!
                        hull() {
                            translate([hx, hinge_y, 2.3])
                                cube([lid_knuckle_w, hinge_r * 2, 3.8], center = true);
                            translate([hx, -shell_d / 2 - 0.5, lid_z - 1.0])
                                cube([lid_knuckle_w, 3.0, 2.0], center = true);
                        }
                    }
                }

                // Lid-Mounted Front M3 Latch Pivot Ears (Anchored flush to Z = lid_z on print bed)
                for (lx = (num_latches == 2 ? [-shell_w * 0.23, shell_w * 0.23] : [0])) {
                    for (cx = [-8.6, 8.6]) {
                        hull() {
                            translate([lx + cx, shell_d / 2 + 4.2, 6.0])
                            rotate([0, 90, 0])
                                cylinder(r = 4.5, h = 3.6, center = true);
                            translate([lx + cx, shell_d / 2 + 1.2, lid_z - 0.75])
                                cube([3.6, 4.4, 1.5], center = true);
                            translate([lx + cx, shell_d / 2 - 0.5, (lid_z + 1.5) / 2])
                                cube([3.6, 1.0, lid_z - 1.5], center = true);
                        }
                    }
                }
            }

            // Bores & Cutouts
            for (lx = (num_latches == 2 ? [-shell_w * 0.23, shell_w * 0.23] : [0])) {
                translate([lx - 5.0, shell_d / 2 + 4.2, 6.0])
                rotate([0, 90, 0]) cylinder(d = 3.3, h = 16.0, center = true);
                translate([lx + 5.0, shell_d / 2 + 4.2, 6.0])
                rotate([0, 90, 0]) cylinder(d = 2.85, h = 16.0, center = true);
            }

            for (side = [-1, 1]) {
                hx = side * hinge_x_span;
                for (ear_off = [-6.8, 6.8]) {
                    translate([hx + ear_off, hinge_y, 0])
                    rotate([0, 90, 0]) cylinder(r = hinge_r + 0.6, h = 6.4, center = true);
                }
                translate([hx, hinge_y, 0])
                rotate([0, 90, 0]) cylinder(d = 3.35, h = lid_knuckle_w + 2, center = true);
            }

            // Inlay Cutout
            translate([0, 0, lid_z - 0.8])
            linear_extrude(height = 1.0)
                lid_inlay_2d();
        }
    }
}

// --- 3. CAM-ACTION SNAP LATCHES ---
module cam_latch() {
    w = 13.2; 
    difference() {
        union() {
            rotate([90, 0, 90])
            linear_extrude(height = w, center = true) {
                union() {
                    circle(r = 3.6);
                    polygon(points = [
                        [-0.5, 2.4], [-0.5, 8.0], [-0.8, 8.4], [-0.8, 12.8],
                        [-4.5, 11.8], [-4.5, 13.8], [-0.4, 17.2], [ 1.4, 20.0],
                        [ 5.2, 20.0], [ 5.2, 17.6], [ 2.8, 16.2], [ 2.8, 0.0]
                    ]);
                }
            }
            for (rz = [5.2, 8.6, 12.0]) {
                translate([0, 3.0, rz])
                    cube([11.0, 0.9, 1.2], center = true);
            }
        }
        rotate([0, 90, 0])
            cylinder(d = 3.15, h = w + 2, center = true);
        rotate([90, 0, 90])
        linear_extrude(height = w + 2, center = true) {
            hull() {
                translate([0.95, 4.5]) circle(d = 1.20);
                translate([0.95, 15.2]) circle(d = 1.20);
            }
        }
    }
}

// --- EXPORT ROUTER ---
if (export_part == "full") {
    plate_gap = 18;
    
    // Base
    color(box_color) base_shell();
    
    // Lid
    translate([0, shell_d + plate_gap, lid_z])
    rotate([180, 0, 0]) {
        color(box_color) vault_lid();
        color(text_color) 
            translate([0, 0, lid_z - 0.8]) 
            linear_extrude(height = 0.8) 
                lid_inlay_2d();
    }
    
    // Latches
    for (i = [0 : num_latches - 1]) {
        translate([shell_w/2 + 20 + i*22, 0, 6.6]) 
        rotate([0, 90, 0])
        color(latch_color) cam_latch();
    }
} else if (export_part == "box_only") {
    color(box_color) base_shell();
} else if (export_part == "lid_only") {
    translate([0, 0, lid_z]) rotate([180, 0, 0]) color(box_color) vault_lid();
} else if (export_part == "text_only") {
    translate([0, 0, 0.8]) rotate([180, 0, 0]) color(text_color) linear_extrude(height = 0.8) lid_inlay_2d();
} else if (export_part == "latch_only") {
    for (i = [0 : num_latches - 1]) {
        translate([i * 22, 0, 6.6]) rotate([0, 90, 0]) color(latch_color) cam_latch();
    }
}
`;
  };

  // ==========================================
  // DESCRIPTIVE CARGO & AMMO .SCAD FILE NAMING
  // ==========================================
  const getCargoScadFilename = (mode = scadExportMode) => {
    const cleanCode = designCode || `CARGO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const safeText = (cargoText || '')
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toUpperCase() || 'NO-TEXT';

    const dims = `${cargoWidth}x${cargoLength}x${cargoHeight}mm`;
    const grid = `${cargoCompX}x${cargoCompY}Grid`;
    const colors = `${cargoBoxColorId}_inlay-${cargoTextColorId}_latch-${cargoLatchColorId}`;
    const borderTag = cargoBorder ? 'Border-YES' : 'Border-NO';

    const typeMap = {
      full: 'FULL-3MF',
      box_only: 'BASE-ONLY',
      lid_only: 'LID-ONLY',
      text_only: 'INLAY-ONLY',
      latch_only: 'LATCHES-ONLY'
    };

    return `${cleanCode}_${cargoPreset.toUpperCase()}_${safeText}_${dims}_${grid}_${colors}_${borderTag}_${typeMap[mode] || mode.toUpperCase()}.scad`;
  };

  const getAmmoScadFilename = (mode = scadExportMode) => {
    const cleanCode = designCode || `AMMO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const safeTitle = (ammoLidTitle || currentCalSpec?.short || ammoCaliber)
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toUpperCase() || 'NO-TEXT';

    return `${cleanCode}_${ammoCaliber.toUpperCase()}_${clampedAmmoCols}x${clampedAmmoRows}_${safeTitle}_${mode.toUpperCase()}.scad`;
  };

  const downloadScadFile = (mode = scadExportMode) => {
    const filename = getCargoScadFilename(mode);
    const blob = new Blob([generateScadCode(mode)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadScad = () => {
    const scadContent = activeTab === 'ammo'
      ? generateAmmoMatrixScad(scadExportMode)
      : generateScadCode(scadExportMode);
    const filename = activeTab === 'ammo'
      ? getAmmoScadFilename(scadExportMode)
      : getCargoScadFilename(scadExportMode);

    if (!scadContent) return;

    const blob = new Blob([scadContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ---> PASTE THE BUG REPORT HELPER HERE <---
  const getBugReportMailto = () => {
    const recipient = "fieldmatrix@glitchygrizzly.com";
    const activeCode = designCode || "No Design Code";
    const activeProduct = PRODUCT_CATALOG[activeTab]?.name || "Field Matrix";
    
    const subject = encodeURIComponent(`[${activeProduct} Bug Report] - Code: ${activeCode}`);
    
    const configDetails =
      activeTab === 'bench'
        ? `Preset: ${sizePreset}\nDimensions: ${width}x${depth}x${height}mm (${tiers} Tiers, ${drawersPerTier} Drawers/Tier)`
        : activeTab === 'cargo'
        ? `Preset: ${cargoPreset}\nDimensions: ${cargoWidth}x${cargoLength}x${cargoHeight}mm\nGrid: ${cargoCompX}x${cargoCompY}`
        : `Caliber: ${ammoCaliber}\nCapacity: ${clampedAmmoCols}x${clampedAmmoRows} (${ammoTotalRounds} Rounds)`;

    const bodyText = `Hi Field Matrix Team,

I encountered an issue with the ${activeProduct} configurator:

--- Issue Description ---
[Please describe what went wrong or unexpected behavior here]

--- Configuration Details (Auto-generated) ---
Design Code: ${activeCode}
Mode: ${activeTab} (${isEtsyMode ? 'Etsy' : 'Direct'})
${configDetails}
Browser: ${navigator.userAgent}
Date: ${new Date().toISOString()}
`;

    return `mailto:${recipient}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
  };

  // ==========================================
  // MODULAR FIRESTORE PAYLOAD BUILDER
  // ==========================================
  const buildOrderPayload = (codeToSave) => {
    const productMeta = PRODUCT_CATALOG[activeTab] || PRODUCT_CATALOG.bench;
    const estPrice = Number(calculatePrice().toFixed(2));

    const basePayload = {
      schemaVersion: '2.1-dual-channel',
      designCode: codeToSave,
      orderChannel: isEtsyMode ? 'etsy' : 'direct_square',
      productLine: activeTab,
      productName: productMeta.name,
      presetSelected: activeTab === 'bench' ? sizePreset : cargoPreset,
      estimatedPrice: estPrice,
      createdAt: serverTimestamp()
    };

    if (activeTab === 'bench') {
    const benchConfig = {
      sizePreset,
      tiers,
      drawersPerTier,
      opening,
      handlePos,
      width: Number(width),
      depth: Number(depth),
      height: Number(height),
      singleTierHeightMm,
      totalStackedHeightMm,
      enableLabelSlot,
      labelWidth,
      labelHeight,
      labelFont,
      labels,
      drawerDividers,
      casingColorId,
      casingColorHex: activeCasingColor.hex,
      drawerColorId,
      drawerColorHex: activeDrawerColor.hex
    };

    return {
      ...basePayload,
      dimensionsSummary: `${sizePreset}: ${width}W x ${depth}D x ${totalStackedHeightMm}H mm (${tiers} Tiers, ${tiers * drawersPerTier} Drawers)`,
      colorsSummary: `Casing: ${activeCasingColor.name} / Drawers: ${activeDrawerColor.name}`,
      configuration: benchConfig,
      productionOutput: {
        specSheet: generateSpecSheet()
      },
      width: Number(width),
      length: Number(depth),
      height: Number(height),
      scadCode: generateSpecSheet(),
      tiers,
      drawersPerTier,
      opening,
      handlePos,
      enableLabelSlot,
      labelWidth,
      labelHeight,
      labelFont,
      labels,
      drawerDividers,
      casingColorId,
      drawerColorId
    };
  } else if (activeTab === 'ammo') {
      const magCount = Math.max(ammoShellX, ammoShellY) >= 150 ? 12 : 8;

      const ammoConfig = {
        ammoCaliber,
        cols: Number(clampedAmmoCols),
        rows: Number(clampedAmmoRows),
        ammoCols: Number(clampedAmmoCols),
        ammoRows: Number(clampedAmmoRows),
        totalRounds: Number(ammoTotalRounds),
        preset: ammoPreset,
        ammoPreset,
        shellX: Number(ammoShellX),
        shellY: Number(ammoShellY),
        shellZ: Number(ammoShellZ),
        trayX: Number(ammoTrayX),
        trayY: Number(ammoTrayY),
        trayZ: Number(ammoTrayZ),
        ammoBaseColor: activeAmmoBaseColor.hex,
        ammoLidColor: activeAmmoLidColor.hex,
        ammoTrayColor: activeAmmoTrayColor.hex,
        ammoAccentColor: activeAmmoLatchColor.hex,
        baseColorHex: activeAmmoBaseColor.hex,
        lidColorHex: activeAmmoLidColor.hex,
        trayColorHex: activeAmmoTrayColor.hex,
        latchColorHex: activeAmmoLatchColor.hex,
        lidTitle: ammoLidTitle,
        ammoLidTitle,
        lidFont: ammoLidFont,
        ammoLidFont,
        enableAmmoLidBorder,
        lidSubtitle: showAmmoRoundCount ? `${ammoTotalRounds} RDS` : '',
        showAmmoRoundCount,
        magnetsCount: Number(magCount)
      };

      return {
        ...basePayload,
        presetSelected: ammoPreset,
        dimensionsSummary: `${currentCalSpec.name} (${ammoTotalRounds} Rds): ${ammoShellX}W x ${ammoShellY}L x ${ammoShellZ}H mm`,
        colorsSummary: `Base: ${activeAmmoBaseColor.name} / Lid: ${activeAmmoLidColor.name} / Tray: ${activeAmmoTrayColor.name} / Accent: ${activeAmmoLatchColor.name}`,
        configuration: ammoConfig,
        productionOutput: {
          scadFilename: getAmmoScadFilename(scadExportMode),
          scadCode: generateAmmoMatrixScad(scadExportMode),
          specSheet: generateSpecSheet()
        },
        width: Number(ammoShellX),
        length: Number(ammoShellY),
        height: Number(ammoShellZ),
        scadCode: generateAmmoMatrixScad(scadExportMode),
        scadFilename: getAmmoScadFilename(scadExportMode),
        ammoCaliber,
        ammoCols: Number(clampedAmmoCols),
        ammoRows: Number(clampedAmmoRows),
        ammoPreset,
        ammoBaseColor: activeAmmoBaseColor.hex,
        ammoLidColor: activeAmmoLidColor.hex,
        ammoTrayColor: activeAmmoTrayColor.hex,
        ammoAccentColor: activeAmmoLatchColor.hex,
        ammoLidTitle,
        ammoLidFont,
        enableAmmoLidBorder,
        showAmmoRoundCount
      };
  } else {
    const cargoConfig = {
      cargoPreset,
      cargoWidth: Number(cargoWidth),
      cargoLength: Number(cargoLength),
      cargoHeight: Number(cargoHeight),
      closedTotalHeight: Number(cargoHeight * 2),
      cargoCompX: Number(cargoCompX),
      cargoCompY: Number(cargoCompY),
      totalCompartments: Number(cargoCompX * cargoCompY),
      cargoBoxColorId,
      cargoTextColorId,
      cargoLatchColorId,
      cargoBoxColor: activeCargoBoxColor.hex,
      cargoTextColor: activeCargoTextColor.hex,
      cargoLatchColor: activeCargoLatchColor.hex,
      cargoBoxColorName: activeCargoBoxColor.name,
      cargoBoxColorHex: activeCargoBoxColor.hex,
      cargoTextColorName: activeCargoTextColor.name,
      cargoTextColorHex: activeCargoTextColor.hex,
      cargoLatchColorName: activeCargoLatchColor.name,
      cargoLatchColorHex: activeCargoLatchColor.hex,
      cargoText,
      cargoFont,
      cargoBorder
    };

    return {
      ...basePayload,
      dimensionsSummary: `${cargoPreset}: ${cargoWidth}W x ${cargoLength}L x ${cargoHeight}H mm (${cargoCompX}x${cargoCompY} Grid)`,
      colorsSummary: `Body: ${activeCargoBoxColor.name} / Inlay: ${activeCargoTextColor.name} / Latch: ${activeCargoLatchColor.name}`,
      configuration: cargoConfig,
      productionOutput: {
        scadFilename: getCargoScadFilename('full'),
        scadCode: generateScadCode('full'),
        specSheet: generateSpecSheet()
      },
      width: Number(cargoWidth),
      length: Number(cargoLength),
      height: Number(cargoHeight * 2),
      scadCode: generateScadCode('full'),
      scadFilename: getCargoScadFilename('full'),
      cargoPreset,
      cargoWidth,
      cargoLength,
      cargoHeight,
      cargoCompX,
      cargoCompY,
      cargoBoxColorId,
      cargoTextColorId,
      cargoBoxColor: activeCargoBoxColor.hex,
      cargoTextColor: activeCargoTextColor.hex,
      cargoText,
      cargoFont,
      cargoBorder
    };
  }
};

  const saveDesignToFirestore = async (codeToSave) => {
    if (!db) return;
    try {
      if (auth && !auth.currentUser) {
        await signInAnonymously(auth).catch(() => {});
      }
      const payload = buildOrderPayload(codeToSave);
      await setDoc(doc(db, FIRESTORE_COLLECTION, codeToSave), payload);
    } catch (e) {
      console.error('Could not save to Firestore collection fieldmatrix_orders:', e);
      setStatusBanner({
        type: 'error',
        text: `Firestore save error: ${e.message}`
      });
    }
  };

  const handleOpenSpecModal = () => {
    const prefix = PRODUCT_CATALOG[activeTab]?.codePrefix || 'MATRIX-';
    const tierTag = getActiveTierTag();
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCode = `${prefix}${tierTag}-${randomChars}`;
    setDesignCode(newCode);
    setCodeCopied(false);
    setModalTab('spec');
    setShowModal(true);
  };

  const [cart, setCart] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleAddToCart = async () => {
    if (!designCode) return;

    const codeToAdd = designCode;
    navigator.clipboard.writeText(codeToAdd);
    setCodeCopied(true);
    await saveDesignToFirestore(codeToAdd);

    const currentPrice = Number(calculatePrice().toFixed(2));
    const orderPayload = buildOrderPayload(codeToAdd);
    delete orderPayload.createdAt;

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.designCode === codeToAdd
      );
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }
      return [
        ...prevCart,
        {
          designCode: codeToAdd,
          price: currentPrice,
          quantity: 1,
          orderPayload,
        },
      ];
    });

    // Generate a fresh Design Code so if the user builds another item, it doesn't overwrite the previous one
    const prefix = PRODUCT_CATALOG[activeTab]?.codePrefix || 'MATRIX-';
    const tierTag = getActiveTierTag();
    const nextChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    setDesignCode(`${prefix}${tierTag}-${nextChars}`);
  };

  const handleUpdateCartQty = (code, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.designCode === code
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleResetDirectDimensions = () => {
    if (activeTab === 'bench') {
      // Bench Matrix default direct dimensions
      setWidth(140);
      setDepth(110);
      setHeight(15.5);
      setTiers(2);
      setDrawersPerTier(4);
    } else if (activeTab === 'cargo') {
      setCargoWidth(120);
      setCargoLength(90);
      setCargoHeight(20);
    } else if (activeTab === 'ammo') {
      setAmmoCaliber('22lr');
      setAmmoCols(10);
      setAmmoRows(5);
      setAmmoPreset('50');
    }
  };

  const handleCheckoutActionClick = async () => {
    if (isEtsyMode) {
      if (designCode) {
        navigator.clipboard.writeText(designCode);
        setCodeCopied(true);
        await saveDesignToFirestore(designCode);
      }
      return;
    }

    try {
      setIsCheckingOut(true);
      let itemsToCheckout = [...cart];

      // If the cart is empty, automatically save & check out the current build on screen
      if (itemsToCheckout.length === 0 && designCode) {
        navigator.clipboard.writeText(designCode);
        setCodeCopied(true);
        await saveDesignToFirestore(designCode);
        const orderPayload = buildOrderPayload(designCode);
        delete orderPayload.createdAt; // Remove serverTimestamp sentinel for JSON transport
        itemsToCheckout = [
          {
            designCode,
            price: Number(calculatePrice().toFixed(2)),
            quantity: 1,
            orderPayload,
          },
        ];
      }

      if (itemsToCheckout.length === 0) {
        setIsCheckingOut(false);
        return;
      }

      const response = await fetch("https://us-central1-fieldmatrix-3d.cloudfunctions.net/createCheckoutLink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToCheckout }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to initiate checkout.");
      }

      console.log("SQUARE LINK:", data.url);
      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout Error:", error);
      alert(`Unable to initiate checkout: ${error.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleAdminRecall = async () => {
    if (!recallCode.trim() || !db) {
      setStatusBanner({
        type: 'error',
        text: 'Enter a valid Design Code and ensure Firebase keys are configured.'
      });
      return;
    }
    try {
      if (auth && !auth.currentUser) {
        await signInAnonymously(auth).catch(() => {});
      }
      const cleanCode = recallCode.trim().toUpperCase();
      const snap = await getDoc(doc(db, FIRESTORE_COLLECTION, cleanCode));

      if (snap.exists()) {
        const data = snap.data();
        const cfg = data.configuration || data;
        setDesignCode(cleanCode);

        if (data.productLine === 'bench') {
          setActiveTab('bench');
          if (cfg.sizePreset ?? data.sizePreset) setSizePreset(cfg.sizePreset ?? data.sizePreset);
          setTiers(cfg.tiers ?? data.tiers ?? 2);
          setDrawersPerTier(cfg.drawersPerTier ?? data.drawersPerTier ?? 4);
          setOpening(cfg.opening ?? data.opening ?? 'Left');
          setHandlePos(cfg.handlePos ?? data.handlePos ?? 'Front');
          setWidth(cfg.width ?? data.width ?? 140);
          setDepth(cfg.depth ?? cfg.length ?? data.length ?? 110);
          setHeight(cfg.height ?? data.height ?? 15.5);
          setEnableLabelSlot(cfg.enableLabelSlot ?? data.enableLabelSlot ?? true);
          setLabelWidth(cfg.labelWidth ?? data.labelWidth ?? 30);
          setLabelHeight(cfg.labelHeight ?? data.labelHeight ?? 11);
          setLabelFont(cfg.labelFont ?? data.labelFont ?? 'Inter');
          setLabels(cfg.labels || data.labels || {});
          setDrawerDividers(cfg.drawerDividers || data.drawerDividers || {});
          setCasingColorId(cfg.casingColorId || data.casingColorId || 'cocoa-brown');
          setDrawerColorId(cfg.drawerColorId || data.drawerColorId || 'matte-latte-brown');
        } else if (data.productLine === 'ammo' || cfg.ammoCaliber || data.ammoCaliber) {
          setActiveTab('ammo');

          const loadedCal = cfg.ammoCaliber ?? data.ammoCaliber;
          const loadedCols = cfg.ammoCols ?? cfg.cols ?? data.ammoCols;
          const loadedRows = cfg.ammoRows ?? cfg.rows ?? data.ammoRows;
          const loadedPreset = cfg.ammoPreset ?? cfg.preset ?? data.ammoPreset;

          const loadedBaseColor = cfg.ammoBaseColor ?? cfg.baseColor ?? data.ammoBaseColor;
          const loadedLidColor = cfg.ammoLidColor ?? cfg.lidColor ?? data.ammoLidColor;
          const loadedTrayColor = cfg.ammoTrayColor ?? cfg.trayColor ?? data.ammoTrayColor;
          const loadedAccentColor = cfg.ammoAccentColor ?? cfg.accentColor ?? data.ammoAccentColor;

          const loadedLidTitle = cfg.ammoLidTitle ?? cfg.lidTitle ?? data.ammoLidTitle;
          const loadedLidFont = cfg.ammoLidFont ?? cfg.lidFont ?? data.ammoLidFont;
          const loadedShowCount = cfg.showAmmoRoundCount ?? data.showAmmoRoundCount;
          const loadedLidBorder = cfg.enableAmmoLidBorder ?? data.enableAmmoLidBorder;

          if (loadedCal) setAmmoCaliber(loadedCal);
          if (loadedCols !== undefined) setAmmoCols(Number(loadedCols));
          if (loadedRows !== undefined) setAmmoRows(Number(loadedRows));
          if (loadedPreset) setAmmoPreset(String(loadedPreset));

          const findPetgId = (val, fallback) =>
            BAMBU_PETG_COLORS.find((c) => c.id === val || c.hex === val)?.id || fallback;

          if (loadedBaseColor) setAmmoBaseColorId(findPetgId(loadedBaseColor, 'petg-pine-green'));
          if (loadedLidColor) setAmmoLidColorId(findPetgId(loadedLidColor, 'petg-black'));
          if (loadedTrayColor) setAmmoTrayColorId(findPetgId(loadedTrayColor, 'petg-dark-beige'));
          if (loadedAccentColor) setAmmoLatchColorId(findPetgId(loadedAccentColor, 'petg-orange'));

          if (loadedLidTitle !== undefined) setAmmoLidTitle(loadedLidTitle);
          if (loadedLidFont) setAmmoLidFont(loadedLidFont);
          if (loadedShowCount !== undefined) setShowAmmoRoundCount(Boolean(loadedShowCount));
          if (loadedLidBorder !== undefined) setEnableAmmoLidBorder(Boolean(loadedLidBorder));
        } else {
          setActiveTab('cargo');
          if (cfg.cargoPreset ?? data.cargoPreset) setCargoPreset(cfg.cargoPreset ?? data.cargoPreset);
          setCargoWidth(cfg.cargoWidth ?? data.cargoWidth ?? data.width ?? 120);
          setCargoLength(cfg.cargoLength ?? data.cargoLength ?? data.length ?? 90);
          setCargoHeight(cfg.cargoHeight ?? data.cargoHeight ?? (data.height ? data.height / 2 : 20));
          setCargoCompX(cfg.cargoCompX ?? data.cargoCompX ?? 2);
          setCargoCompY(cfg.cargoCompY ?? data.cargoCompY ?? 2);
          if (cfg.cargoBoxColorId ?? data.cargoBoxColorId) setCargoBoxColorId(cfg.cargoBoxColorId ?? data.cargoBoxColorId);
          if (cfg.cargoTextColorId ?? data.cargoTextColorId) setCargoTextColorId(cfg.cargoTextColorId ?? data.cargoTextColorId);
          if (cfg.cargoLatchColorId ?? data.cargoLatchColorId) setCargoLatchColorId(cfg.cargoLatchColorId ?? data.cargoLatchColorId);
          if ((cfg.cargoText ?? data.cargoText) !== undefined) setCargoText(cfg.cargoText ?? data.cargoText);
          if (cfg.cargoFont ?? data.cargoFont) setCargoFont(cfg.cargoFont ?? data.cargoFont);
          if ((cfg.cargoBorder ?? data.cargoBorder) !== undefined) setCargoBorder(cfg.cargoBorder ?? data.cargoBorder);
        }

        setStatusBanner({
          type: 'success',
          text: `Loaded ${data.productName || cleanCode} (${cleanCode})`
        });
        setAdminMode(false);
        setShowModal(true);
      } else {
        setStatusBanner({ type: 'error', text: `Order code ${cleanCode} not found.` });
      }
    } catch (e) {
      setStatusBanner({ type: 'error', text: `Error recalling order: ${e.message}` });
    }
  };

  // ==========================================
  // THREE.JS VIEWPORT SETUP
  // ==========================================
  const mountRef = useRef(null);
  const modelGroupRef = useRef(null);
  const drawerPivotsRef = useRef([]);
  const controlsState = useRef({
    isDragging: false,
    isPanning: false,
    prevX: 0,
    prevY: 0,
    theta: 0.62,
    phi: 1.08,
    radius: 360,
    targetY: 45
  });

  const fitCameraToModel = useCallback(() => {
    if (activeTab === 'bench') {
      const totalH = tiers * singleTierHeightMm;
      const maxSpan = Math.max(width, depth, totalH);
      controlsState.current.targetY = totalH * 0.45;
      controlsState.current.radius = Math.max(250, maxSpan * 1.9 + 90);
    } else if (activeTab === 'ammo') {
      const maxSpan = Math.max(ammoShellX, ammoShellY, ammoShellZ);
      controlsState.current.targetY = ammoShellZ * 0.5;
      controlsState.current.radius = Math.max(220, maxSpan * 1.85 + 60);
    } else {
      const maxSpan = Math.max(cargoWidth, cargoLength * 2.1, cargoHeight * 2);
      controlsState.current.targetY = cargoHeight * 0.8;
      controlsState.current.radius = Math.max(220, maxSpan * 1.65 + 60);
    }
  }, [activeTab, tiers, singleTierHeightMm, width, depth, cargoWidth, cargoLength, cargoHeight, ammoShellX, ammoShellY, ammoShellZ]);

  useEffect(() => {
    fitCameraToModel();
  }, [activeTab, fitCameraToModel]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0d121d');

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      1,
      15000
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xf1f5f9, 0.85));

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.15);
    dirLight1.position.set(260, 480, 340);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.35);
    dirLight2.position.set(-280, 200, -220);
    scene.add(dirLight2);

    const gridHelper = new THREE.GridHelper(600, 30, 0x0ea5e9, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const domElem = renderer.domElement;
    domElem.style.touchAction = 'none';

    let activePointers = new Map();
    let prevPinchDist = null;

    const onPointerDown = (e) => {
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 1) {
        controlsState.current.isDragging = true;
        controlsState.current.isPanning = e.button === 2 || e.shiftKey;
        controlsState.current.prevX = e.clientX;
        controlsState.current.prevY = e.clientY;
        downX = e.clientX;
        downY = e.clientY;
      } else if (activePointers.size === 2) {
        controlsState.current.isDragging = false;
        const pts = Array.from(activePointers.values());
        prevPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    };

    const onPointerMove = (e) => {
      if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (prevPinchDist !== null) {
          const delta = prevPinchDist - dist;
          controlsState.current.radius = Math.max(100, Math.min(3500, controlsState.current.radius + delta * 1.5));
        }
        prevPinchDist = dist;
        return;
      }

      if (!controlsState.current.isDragging) return;
      const dx = e.clientX - controlsState.current.prevX;
      const dy = e.clientY - controlsState.current.prevY;
      controlsState.current.prevX = e.clientX;
      controlsState.current.prevY = e.clientY;
      if (controlsState.current.isPanning) {
        controlsState.current.targetY = Math.max(-100, Math.min(800, controlsState.current.targetY + dy * 0.7));
      } else {
        controlsState.current.theta -= dx * 0.0085;
        controlsState.current.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.02, controlsState.current.phi - dy * 0.0085));
      }
    };

    const onPointerUp = (e) => {
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) prevPinchDist = null;
      if (activePointers.size === 0) controlsState.current.isDragging = false;

      const moveDist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (moveDist < 5) {
        const rect = domElem.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(modelGroup.children, true);
        if (intersects.length > 0) {
          let obj = intersects[0].object;
          while (obj && obj !== modelGroup) {
            if (obj.userData && obj.userData.drawerKey) {
              const key = obj.userData.drawerKey;
              setOpenDrawersMap((prev) => ({ ...prev, [key]: !prev[key] }));
              break;
            }
            obj = obj.parent;
          }
        }
      }
    };
    const onWheel = (e) => {
      e.preventDefault();
      controlsState.current.radius = Math.max(100, Math.min(3500, controlsState.current.radius + e.deltaY * 0.45));
    };

    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });
    domElem.addEventListener('contextmenu', (e) => e.preventDefault());

    let reqId;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const { theta, phi, radius, targetY } = controlsState.current;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = targetY + radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, targetY, 0);

      drawerPivotsRef.current.forEach((item) => {
        if (item?.pivotGroup) {
          item.pivotGroup.rotation.y += ((item.targetAngle || 0) - item.pivotGroup.rotation.y) * 0.16;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // ==========================================
    // 3D VIEWPORT BUG FIX: Force layout calculation
    // ==========================================
    // Give the DOM 50ms to finish building the flexbox layout, 
    // then fake a window resize so Three.js draws at full scale.
    const initialResizeTimer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);

    return () => {
      clearTimeout(initialResizeTimer); // Always clean up timers!
      cancelAnimationFrame(reqId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []); // End of Three.js initialization hook

  // ==========================================
  // BUILD 3D GEOMETRY FOR ACTIVE PRODUCT TAB
  // ==========================================
  useEffect(() => {
    const group = modelGroupRef.current;
    if (!group) return;
    while (group.children.length > 0) {
      const child = group.children[0];
      child.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        }
      });
      group.remove(child);
    }
    drawerPivotsRef.current = [];

    if (activeTab === 'bench') {
      const casingMat = new THREE.MeshStandardMaterial({
        color: activeCasingColor.hex,
        roughness: activeCasingColor.roughness ?? 0.55,
        transparent: xrayMode,
        opacity: xrayMode ? 0.32 : 1.0
      });
      const drawerMat = new THREE.MeshStandardMaterial({
        color: activeDrawerColor.hex,
        roughness: activeDrawerColor.roughness ?? 0.5,
        transparent: xrayMode,
        opacity: xrayMode ? 0.45 : 1.0
      });

      const wallThick = 2.6;
      const tierUnitPitch = height + TIER_CLEARANCE_PER_DRAWER_MM;
      const singleTierH = drawersPerTier * tierUnitPitch + TIER_FRAME_BASE_TOP_MM;
      const explodeDrawerGap = explodedView ? Math.max(14, height * 0.85) : 0;
      const explodeTierGap = explodedView ? drawersPerTier * explodeDrawerGap + 28 : 0;

      const pivotIsLeft = opening === 'Left';
      const closedSideSign = pivotIsLeft ? -1 : 1;
      const openSideName = pivotIsLeft ? 'right' : 'left';

      for (let t = 0; t < tiers; t++) {
        const tierGroup = new THREE.Group();
        tierGroup.position.y = t * (singleTierH + explodeTierGap);
        const visualTierH = singleTierH + (drawersPerTier - 1) * explodeDrawerGap;

        const plateGeo = new THREE.BoxGeometry(width, wallThick, depth);
        const bottomPlate = new THREE.Mesh(plateGeo, casingMat);
        bottomPlate.position.set(0, wallThick / 2, 0);
        tierGroup.add(bottomPlate);

        const topPlate = new THREE.Mesh(plateGeo, casingMat);
        topPlate.position.set(0, visualTierH - wallThick / 2, 0);
        tierGroup.add(topPlate);

        const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, visualTierH, wallThick), casingMat);
        backWall.position.set(0, visualTierH / 2, -depth / 2 + wallThick / 2);
        tierGroup.add(backWall);

        const sideWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, visualTierH, depth), casingMat);
        sideWall.position.set(closedSideSign * (width / 2 - wallThick / 2), visualTierH / 2, 0);
        tierGroup.add(sideWall);

        const rodRadius = 4.6;
        const pivotWorldX = closedSideSign * (width / 2 - 7.5);
        const pivotWorldZ = depth / 2 - 7.5;

        const rodMesh = new THREE.Mesh(new THREE.CylinderGeometry(rodRadius, rodRadius, visualTierH, 24), casingMat);
        rodMesh.position.set(pivotWorldX, visualTierH / 2, pivotWorldZ);
        tierGroup.add(rodMesh);

        const dW = width - wallThick * 2 - 2.0;
        const dD = depth - wallThick - 2.5;
        const dH = height;
        const drawerFloorThick = 1.6;
        const drawerWallThick = 1.8;
        const cornerR = 8.0;
        const notchR = Math.min(12.5, Math.min(dW, dD) * 0.24);

        const outerPts = createDrawerContourPoints(dW / 2, dD / 2, cornerR, notchR, openSideName, handlePos, 0);
        const innerPts = createDrawerContourPoints(dW / 2, dD / 2, cornerR, notchR, openSideName, handlePos, drawerWallThick);

        const floorShape = new THREE.Shape(outerPts);
        const floorGeo = new THREE.ExtrudeGeometry(floorShape, { depth: drawerFloorThick, bevelEnabled: false });
        floorGeo.rotateX(-Math.PI / 2);

        const wallShape = new THREE.Shape(outerPts);
        wallShape.holes.push(new THREE.Path(innerPts.slice().reverse()));
        const perimeterWallGeo = new THREE.ExtrudeGeometry(wallShape, { depth: Math.max(2, dH - drawerFloorThick), bevelEnabled: false });
        perimeterWallGeo.rotateX(-Math.PI / 2);

        for (let b = 0; b < drawersPerTier; b++) {
          const drawerKey = `tier_${t}_box_${b}`;
          const drawerY = wallThick + b * (tierUnitPitch + explodeDrawerGap) + 0.5;
          const pivotGroup = new THREE.Group();
          pivotGroup.position.set(pivotWorldX, drawerY, pivotWorldZ);

          const drawerCenterX = -closedSideSign * (wallThick / 2);
          const drawerCenterZ = wallThick / 2;
          const drawerLocal = new THREE.Group();
          drawerLocal.position.set(drawerCenterX - pivotWorldX, 0, drawerCenterZ - pivotWorldZ);
          drawerLocal.userData = { drawerKey };

          const floorMesh = new THREE.Mesh(floorGeo, drawerMat);
          floorMesh.userData = { drawerKey };
          drawerLocal.add(floorMesh);

          const wallMesh = new THREE.Mesh(perimeterWallGeo, drawerMat);
          wallMesh.position.y = drawerFloorThick;
          wallMesh.userData = { drawerKey };
          drawerLocal.add(wallMesh);

          const divConfig = getDividerForDrawer(t, b);
          const innerSpanW = dW - drawerWallThick * 2 - 2;
          const innerSpanD = dD - drawerWallThick * 2 - 2;
          const divHeight = Math.max(2, dH - drawerFloorThick - 1.2);

          for (let i = 1; i < (divConfig.h || 1); i++) {
            const zPos = -innerSpanD / 2 + (innerSpanD / divConfig.h) * i;
            const hDiv = new THREE.Mesh(new THREE.BoxGeometry(innerSpanW, divHeight, 1.4), drawerMat);
            hDiv.position.set(0, drawerFloorThick + divHeight / 2, zPos);
            hDiv.userData = { drawerKey };
            drawerLocal.add(hDiv);
          }
          for (let j = 1; j < (divConfig.v || 1); j++) {
            const xPos = -innerSpanW / 2 + (innerSpanW / divConfig.v) * j;
            const vDiv = new THREE.Mesh(new THREE.BoxGeometry(1.4, divHeight, innerSpanD), drawerMat);
            vDiv.position.set(xPos, drawerFloorThick + divHeight / 2, 0);
            vDiv.userData = { drawerKey };
            drawerLocal.add(vDiv);
          }

          if (enableLabelSlot) {
            const effLW = Math.min(labelWidth, maxLabelWidth, dW - 14);
            const effLH = Math.min(labelHeight, maxLabelHeight, dH - 2.5);
            const labelTex = createLabelTexture(labels[drawerKey] || '', activeCasingColor.hex, activeDrawerColor.hex, labelFont);
            const labelPlate = new THREE.Mesh(
              new THREE.BoxGeometry(effLW, effLH, 1.2),
              new THREE.MeshBasicMaterial({ map: labelTex })
            );
            labelPlate.position.set(0, dH / 2, dD / 2 + 0.8);
            labelPlate.userData = { drawerKey };
            drawerLocal.add(labelPlate);
          }

          pivotGroup.add(drawerLocal);
          tierGroup.add(pivotGroup);
          drawerPivotsRef.current.push({ drawerKey, boxIndex: b, pivotGroup, targetAngle: 0 });
        }
        group.add(tierGroup);
      }

      if (showDimensions) {
        const wSprite = createDimensionSprite(`${width} mm`);
        wSprite.position.set(0, 6, depth / 2 + 28);
        group.add(wSprite);
        const hSprite = createDimensionSprite(`${singleTierHeightMm} mm / tier`, isOverP1SLimit);
        hSprite.position.set(width / 2 + 38, singleTierH / 2, depth / 2);
        group.add(hSprite);
      }
    } else if (activeTab === 'ammo') {
      // ==========================================
      // THE AMMOMATRIX (TACTICAL UPGRADE V3)
      // ==========================================
      const baseMat = new THREE.MeshStandardMaterial({
        color: activeAmmoBaseColor.hex, roughness: 0.75,
        transparent: showMagnetXray, opacity: showMagnetXray ? 0.32 : 1.0
      });
      const lidMat = new THREE.MeshStandardMaterial({
        color: activeAmmoLidColor.hex, roughness: 0.75,
        transparent: showMagnetXray, opacity: showMagnetXray ? 0.32 : 1.0
      });
      const trayMat = new THREE.MeshStandardMaterial({
        color: activeAmmoTrayColor.hex, roughness: 0.85,
        transparent: showMagnetXray, opacity: showMagnetXray ? 0.55 : 1.0
      });
      const accentMat = new THREE.MeshStandardMaterial({ color: activeAmmoLatchColor.hex, roughness: 0.4 });
      const steelMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.85, roughness: 0.25 });
      const brassMat = new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 0.8, roughness: 0.22 });
      const leadMat = new THREE.MeshStandardMaterial({ color: '#7a7a7a', metalness: 0.35, roughness: 0.55 });
      const hullMat = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.5 }); // Shotgun hull
      const crimpMat = new THREE.MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.7 });

      const magBaseMat = new THREE.MeshBasicMaterial({ color: '#00ffff', depthTest: false, transparent: true, opacity: 0.85 });
      const magTrayMat = new THREE.MeshBasicMaterial({ color: '#38bdf8', wireframe: true, depthTest: false, transparent: true, opacity: 0.9 });
      const xrayLineMat = new THREE.LineDashedMaterial({ color: 0x00ffff, dashSize: 2, gapSize: 2, depthTest: false, transparent: true });

      const baseZ = ammoShellZ - 12.0;
      const wallT = 3.2;
      const floorT = 4.2;
      const ribThick = 1.8;
      const ribWidth = 10.0;
      const ammoGroup = new THREE.Group();

      // 1. ARMORED BASE SHELL (STRICTLY HOLLOW INTERIOR)
      const baseShellGroup = new THREE.Group();
      const baseFloor = new THREE.Mesh(new THREE.BoxGeometry(ammoShellX, floorT, ammoShellY), baseMat);
      baseFloor.position.y = floorT / 2;
      baseShellGroup.add(baseFloor);

      const wallH = baseZ - floorT;
      const wFront = new THREE.Mesh(new THREE.BoxGeometry(ammoShellX, wallH, wallT), baseMat);
      wFront.position.set(0, floorT + wallH / 2, ammoShellY / 2 - wallT / 2);
      const wBack = wFront.clone();
      wBack.position.set(0, floorT + wallH / 2, -ammoShellY / 2 + wallT / 2);
      baseShellGroup.add(wFront, wBack);

      const wLeft = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, ammoShellY - wallT * 2), baseMat);
      wLeft.position.set(-ammoShellX / 2 + wallT / 2, floorT + wallH / 2, 0);
      const wRight = wLeft.clone();
      wRight.position.set(ammoShellX / 2 - wallT / 2, floorT + wallH / 2, 0);
      baseShellGroup.add(wLeft, wRight);

      // Exterior-Only Tactical Ribs (Never cross interior cavity!)
      [-1, 1].forEach((dir) => {
        // Left & Right exterior vertical ribs
        const sideRibLeft = new THREE.Mesh(new THREE.BoxGeometry(ribThick, baseZ - 2, ribWidth), baseMat);
        sideRibLeft.position.set(-ammoShellX / 2 - ribThick / 2, (baseZ - 2) / 2, dir * (ammoShellY * 0.26));
        const sideRibRight = sideRibLeft.clone();
        sideRibRight.position.set(ammoShellX / 2 + ribThick / 2, (baseZ - 2) / 2, dir * (ammoShellY * 0.26));
        baseShellGroup.add(sideRibLeft, sideRibRight);

        // Front & Back exterior vertical ribs
        const fbRibFront = new THREE.Mesh(new THREE.BoxGeometry(ribWidth, baseZ - 2, ribThick), baseMat);
        fbRibFront.position.set(dir * (ammoShellX * 0.36), (baseZ - 2) / 2, ammoShellY / 2 + ribThick / 2);
        baseShellGroup.add(fbRibFront);
        const heelShape = new THREE.Shape();
        heelShape.moveTo(0, 0);
        heelShape.lineTo(12.0, 0);
        heelShape.lineTo(12.0, 3.0);
        heelShape.lineTo(1.8, baseZ - 2.0);
        heelShape.lineTo(0, baseZ - 2.0);
        heelShape.closePath();
        const heelGeo = new THREE.ExtrudeGeometry(heelShape, { depth: ribWidth, bevelEnabled: false });
        heelGeo.rotateY(Math.PI / 2);
        const heelMesh = new THREE.Mesh(heelGeo, baseMat);
        heelMesh.position.set(dir * (ammoShellX * 0.36) - ribWidth / 2, 0, -ammoShellY / 2);
        baseShellGroup.add(heelMesh);
      });

      // 2. TRUE DUAL M3 REAR CORNER HINGES (Base Clevis Ears + M3 Bolts)
      const hingeRadius = 4.2;
      const hingeXSpan = ammoShellX * 0.28;
      const hingeY = baseZ;
      const hingeZ = -ammoShellY / 2 - 4.6;

      [-1, 1].forEach((side) => {
        const hx = side * hingeXSpan;
        
        // Dual Base Ears (6.0mm wide, spaced 13.6mm apart)
        [-6.8, 6.8].forEach((earOff) => {
          const baseKnuckle = new THREE.Mesh(new THREE.CylinderGeometry(hingeRadius, hingeRadius, 6.0, 20).rotateZ(Math.PI / 2), baseMat);
          baseKnuckle.position.set(hx + earOff, hingeY, hingeZ);
          baseShellGroup.add(baseKnuckle);
        });

        // M3x20mm Stainless Steel Screw (1 per hinge assembly)
        const m3HingePin = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 20.0, 16).rotateZ(Math.PI / 2), steelMat);
        m3HingePin.position.set(hx, hingeY, hingeZ);
        baseShellGroup.add(m3HingePin);
      });

      // 3. LOWER BASE 45-DEG CATCH WEDGE + PROTECTIVE SIDE SHROUDS
      const latchOffsets = ammoShellX >= 130 ? [-ammoShellX * 0.23, ammoShellX * 0.23] : [0];
      latchOffsets.forEach((lx) => {
        const latchGroup = new THREE.Group();
        latchGroup.position.set(lx, baseZ, ammoShellY / 2);

        // 1. Center 45-Deg Catch Wedge on Base
        const wedgeMesh = new THREE.Mesh(new THREE.BoxGeometry(12.8, 5.2, 3.2), baseMat);
        wedgeMesh.position.set(0, -5.5, 1.6);
        latchGroup.add(wedgeMesh);

        // 2. Flanking Protective Side Shrouds on Base (Shields closed latch edges from bag snags)
        [-8.6, 8.6].forEach((cx) => {
          const shroudMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 10.5, 6.2), baseMat);
          shroudMesh.position.set(cx, -5.8, 3.1);
          latchGroup.add(shroudMesh);
        });

        baseShellGroup.add(latchGroup);
      });

      ammoGroup.add(baseShellGroup);

      // 4. ARTICULATED HOLLOW LID + CENTER HINGE KNUCKLE + LATCH CATCHES + BADGE
      const lidPivot = new THREE.Group();
      lidPivot.position.set(0, hingeY, hingeZ); // Rotate directly around rear M3 hinge pin!
      lidPivot.rotation.x = THREE.MathUtils.degToRad(-ammoHingeAngle || 0);

      const lidOffsetZ = -hingeZ; // Distance from rear hinge pin back to box center
      const lidRoof = new THREE.Mesh(new THREE.BoxGeometry(ammoShellX, 3.0, ammoShellY), lidMat);
      lidRoof.position.set(0, 12.0 - 1.5, lidOffsetZ);
      lidPivot.add(lidRoof);

      const lidWFront = new THREE.Mesh(new THREE.BoxGeometry(ammoShellX, 9.0, wallT), lidMat);
      lidWFront.position.set(0, 4.5, lidOffsetZ + ammoShellY / 2 - wallT / 2);
      const lidWBack = lidWFront.clone();
      lidWBack.position.set(0, 4.5, lidOffsetZ - ammoShellY / 2 + wallT / 2);
      lidPivot.add(lidWFront, lidWBack);

      const lidWLeft = new THREE.Mesh(new THREE.BoxGeometry(wallT, 9.0, ammoShellY - wallT * 2), lidMat);
      lidWLeft.position.set(-ammoShellX / 2 + wallT / 2, 4.5, lidOffsetZ);
      const lidWRight = lidWLeft.clone();
      lidWRight.position.set(ammoShellX / 2 - wallT / 2, 4.5, lidOffsetZ);
      lidPivot.add(lidWLeft, lidWRight);

      // 5.5mm TPU Anti-Rattle Pad Seated on 14.5mm Extended Lid Standoff Scaffold
      const padW = ammoTrayX - 1.6;
      const padD = ammoTrayY - 1.6;
      const roundOal = currentCalSpec?.oal || 29.7;
      const standoffH = Number(((ammoShellZ - 3.0) - (floorT + 4.5 + 2.4 + roundOal) - 3.4).toFixed(2));
      const padThick = 5.5;
      const lidCeilingY = 9.0;
      const standoffBottomY = lidCeilingY - standoffH;
      const hw = Math.min(ammoTrayX * 0.45, Math.max(28, (currentCalSpec?.pitch || 12) * 2.2)) / 2 + 1.5;

      const tpuMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.8, metalness: 0.0 });
      const standoffRailMat = new THREE.MeshStandardMaterial({ color: activeAmmoLidColor.hex, roughness: 0.4, metalness: 0.1 });

      // 1. Structural Standoff Rails (Split around center handle slot just like OpenSCAD!)
      [-0.42, -0.22, 0.22, 0.42].forEach((factor) => {
        const zOff = factor * padD;
        if (Math.abs(zOff) < 6.5) {
          // Near center handle slot: split rail into Left & Right segments so slot stays clear
          const segW = Math.max(4, (padW - 0.3) / 2 - hw);
          [-1, 1].forEach((side) => {
            const segRail = new THREE.Mesh(new THREE.BoxGeometry(segW, standoffH, 2.4), standoffRailMat);
            segRail.position.set(side * (hw + segW / 2), lidCeilingY - standoffH / 2, lidOffsetZ + zOff);
            lidPivot.add(segRail);
          });
        } else {
          const supportRail = new THREE.Mesh(new THREE.BoxGeometry(padW - 0.3, standoffH, 2.4), standoffRailMat);
          supportRail.position.set(0, lidCeilingY - standoffH / 2, lidOffsetZ + zOff);
          lidPivot.add(supportRail);
        }
      });

      // Outer 1.5mm Lip that frames all 4 edges of the TPU pad for easy centering/gluing
      [-1, 1].forEach((dir) => {
        const guideLipNS = new THREE.Mesh(
          new THREE.BoxGeometry(padW + 1.6, standoffH + 1.5, 1.6),
          standoffRailMat
        );
        guideLipNS.position.set(0, lidCeilingY - (standoffH + 1.5) / 2, lidOffsetZ + dir * (padD / 2 + 0.8));
        lidPivot.add(guideLipNS);

        const guideLipEW = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, standoffH + 1.5, padD + 3.2),
          standoffRailMat
        );
        guideLipEW.position.set(dir * (padW / 2 + 0.8), lidCeilingY - (standoffH + 1.5) / 2, lidOffsetZ);
        lidPivot.add(guideLipEW);
      });

      // 2. 4.5mm Black TPU Cushion Pad (Mounted to the face of the Standoff Ribs)
      const tpuShape = new THREE.Shape();
      tpuShape.moveTo(-padW / 2, -padD / 2);
      tpuShape.lineTo(padW / 2, -padD / 2);
      tpuShape.lineTo(padW / 2, padD / 2);
      tpuShape.lineTo(-padW / 2, padD / 2);
      tpuShape.lineTo(-padW / 2, -padD / 2);

      // Center Handle Cutout Slot
      const holePath = new THREE.Path();
      holePath.moveTo(-hw, -5.75);
      holePath.lineTo(hw, -5.75);
      holePath.lineTo(hw, 5.75);
      holePath.lineTo(-hw, 5.75);
      holePath.lineTo(-hw, -5.75);
      tpuShape.holes.push(holePath);

      const tpuGeo = new THREE.ExtrudeGeometry(tpuShape, { depth: padThick, bevelEnabled: false });
      const tpuPad = new THREE.Mesh(tpuGeo, tpuMat);
      tpuPad.rotation.x = Math.PI / 2;
      tpuPad.position.set(0, standoffBottomY, lidOffsetZ);
      lidPivot.add(tpuPad);

      // Lid Exterior Side Ribs (Match Base Alignment, Rotate with Lid)
      [-1, 1].forEach((dir) => {
        const lidRibL = new THREE.Mesh(new THREE.BoxGeometry(ribThick, 10.5, ribWidth), lidMat);
        lidRibL.position.set(-ammoShellX / 2 - ribThick / 2, 5.5, lidOffsetZ + dir * (ammoShellY * 0.26));
        const lidRibR = lidRibL.clone();
        lidRibR.position.set(ammoShellX / 2 + ribThick / 2, 5.5, lidOffsetZ + dir * (ammoShellY * 0.26));
        lidPivot.add(lidRibL, lidRibR);
      });

      // Dual Lid Hinge Knuckles (7.2mm wide)
      [-1, 1].forEach((side) => {
        const hx = side * hingeXSpan;
        const lidKnuckle = new THREE.Mesh(new THREE.CylinderGeometry(hingeRadius, hingeRadius, 7.2, 20).rotateZ(Math.PI / 2), lidMat);
        lidKnuckle.position.set(hx, 0, 0);
        lidPivot.add(lidKnuckle);
      });

      // Upper Lid-Mounted M3 Latch Pivot Ears + Complete Wrap-Around Cam Latch
      const latchPinMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.85, roughness: 0.25 });
      latchOffsets.forEach((lx) => {
        const fZ = lidOffsetZ + ammoShellY / 2;

        // 1. Dual Lid M3 Pivot Ears (Wall Root + Rounded Outer Barrel around Pin)
        [-8.6, 8.6].forEach((cx) => {
          // Rectangular base anchored into the lid wall
          const earBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 8.8, 4.2), lidMat);
          earBase.position.set(lx + cx, 6.0, fZ + 2.1);
          lidPivot.add(earBase);

          // Rounded outer ear boss concentric with the M3 pin
          const earBossGeo = new THREE.CylinderGeometry(4.4, 4.4, 3.6, 20);
          earBossGeo.rotateZ(Math.PI / 2);
          const earBoss = new THREE.Mesh(earBossGeo, lidMat);
          earBoss.position.set(lx + cx, 6.0, fZ + 4.2);
          lidPivot.add(earBoss);
        });

        // 2. M3x20mm Stainless Screw Pin (Sits cleanly flush inside the outer ear bosses)
        const pinGeo = new THREE.CylinderGeometry(1.65, 1.65, 21.0, 16);
        pinGeo.rotateZ(Math.PI / 2);
        const pinMesh = new THREE.Mesh(pinGeo, latchPinMat);
        pinMesh.position.set(lx, 6.0, fZ + 4.2);
        lidPivot.add(pinMesh);

        // 3. Orange Latch Top Rounded Pivot Barrel (Wraps 360° around the M3 pin!)
        const latchBarrelGeo = new THREE.CylinderGeometry(3.6, 3.6, 13.2, 20);
        latchBarrelGeo.rotateZ(Math.PI / 2);
        const latchBarrel = new THREE.Mesh(latchBarrelGeo, accentMat);
        latchBarrel.position.set(lx, 6.0, fZ + 4.2);
        lidPivot.add(latchBarrel);

        // 4. Orange Cam-Action Latch Spine (Connects seamlessly from top barrel down to lip)
        const latchBody = new THREE.Mesh(new THREE.BoxGeometry(13.2, 15.6, 3.4), accentMat);
        latchBody.position.set(lx, -1.8, fZ + 5.3);
        lidPivot.add(latchBody);

        // 5. Inner Upper Hook Shoulder (Bridges latch body to lid wall above base wedge)
        const latchShoulder = new THREE.Mesh(new THREE.BoxGeometry(13.2, 10.0, 2.6), accentMat);
        latchShoulder.position.set(lx, 1.0, fZ + 3.5);
        lidPivot.add(latchShoulder);

        // 6. Bottom Outward Finger-Pull Release Lip
        const latchLip = new THREE.Mesh(new THREE.BoxGeometry(13.2, 2.4, 5.2), accentMat);
        latchLip.position.set(lx, -9.2, fZ + 6.2);
        lidPivot.add(latchLip);

        // 7. Tactile Grip Ridges on Orange Latch Face
        [1.2, -1.8, -4.8].forEach((ry) => {
          const ridge = new THREE.Mesh(new THREE.BoxGeometry(11.0, 1.0, 0.9), accentMat); // Changed lidMat to accentMat
          ridge.position.set(lx, ry, fZ + 7.1);
          lidPivot.add(ridge);
        });
      });

      // Map 2D Procedural Texture to Lid Surface (Transparent Decal — No Rectangular Patch!)
      if (currentCalSpec && (ammoLidTitle.trim() !== '' || showAmmoRoundCount || enableAmmoLidBorder)) {
        const badgeTexture = createBadgeTexture({
          caliberSpec: currentCalSpec,
          customText: ammoLidTitle,
          showRoundCount: showAmmoRoundCount,
          fontFamily: ammoLidFont,
          lidColorHex: activeAmmoLidColor.hex,
          accentColorHex: activeAmmoLatchColor.hex,
          rounds: ammoTotalRounds,
          showBorder: enableAmmoLidBorder
        });
        const badgeMat = new THREE.MeshStandardMaterial({
          map: badgeTexture,
          transparent: true,
          alphaTest: 0.05,
          roughness: 0.4,
          metalness: 0.1,
          polygonOffset: true,
          polygonOffsetFactor: -1
        });
        const badge = new THREE.Mesh(
          new THREE.PlaneGeometry(ammoShellX * 0.78, ammoShellY * 0.58),
          badgeMat
        );
        badge.rotation.x = -Math.PI / 2;
        badge.position.set(0, 12.05, lidOffsetZ);
        lidPivot.add(badge);
      }
      ammoGroup.add(lidPivot);

      // 5. TRAY, MAGNET POCKETS (BASE + TRAY), & CARTRIDGES / SHOTGUN SHELLS
      const footH = 4.5;
      let trayWorldY = floorT + footH + ammoTrayZ / 2; // Seated cleanly on feet above floorT
      let trayWorldZ = 0;

      if (ammoTrayPose === 'extracted') trayWorldY = baseZ + ammoTrayZ + 18;
      else if (ammoTrayPose === 'bench') {
        trayWorldY = ammoTrayZ / 2 + footH;
        trayWorldZ = ammoShellY + 28;
      }

      const trayGroup = new THREE.Group();
      trayGroup.position.set(0, trayWorldY, trayWorldZ);
      const trayMesh = new THREE.Mesh(new THREE.BoxGeometry(ammoTrayX, ammoTrayZ, ammoTrayY), trayMat);
      trayGroup.add(trayMesh);

      const mx = ammoTrayX / 2 - 7.5;
      const my = ammoTrayY / 2 - 7.5;
      
      // Default 4 corners
      let magCoords = [[-mx, -my], [mx, -my], [-mx, my], [mx, my]];

      // Add the 2 extra center magnets to the longest edge
      if (Math.max(ammoShellX, ammoShellY) >= 150) {
        if (ammoShellX >= ammoShellY) {
          // Box is wider than it is deep: add to front and back center
          magCoords.push([0, -my], [0, my]);
        } else {
          // Box is deeper than it is wide: add to left and right center
          magCoords.push([-mx, 0], [mx, 0]);
        }
      }

      magCoords.forEach(([fx, fy]) => {
        // Tray Standoff Foot
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(activeMagnetDia / 2 + 2.2, 7.25, footH, 16), trayMat); // Changed from accentMat to trayMat
        foot.position.set(fx, -ammoTrayZ / 2 - footH / 2, fy);
        trayGroup.add(foot);

        // Base Floor Embedded Magnet Boss (Always physically present in Base Floor)
        const baseBoss = new THREE.Mesh(new THREE.CylinderGeometry(activeMagnetDia / 2 + 2.2, activeMagnetDia / 2 + 2.2, 0.6, 16), baseMat); // Changed from accentMat to baseMat
        baseBoss.position.set(fx, floorT + 0.3, fy);
        baseShellGroup.add(baseBoss);

        if (showMagnetXray) {
          // 1. Tray Foot Magnet (Dynamically Sized 2mm thick)
          const trayMag = new THREE.Mesh(new THREE.CylinderGeometry(activeMagnetDia / 2, activeMagnetDia / 2, 2.0, 16), magTrayMat);
          trayMag.position.set(fx, -ammoTrayZ / 2 - footH + 1.0, fy); // Center of 2mm depth
          trayGroup.add(trayMag);

          // 2. Base Shell Floor Magnet (Dynamically Sized 2mm thick)
          const baseMag = new THREE.Mesh(new THREE.CylinderGeometry(activeMagnetDia / 2, activeMagnetDia / 2, 2.0, 16), magBaseMat);
          baseMag.position.set(fx, floorT - 1.0, fy); // Center of 2mm depth
          ammoGroup.add(baseMag);

          // Magnetic Flux Alignment Line
          const pts = [
            new THREE.Vector3(fx, floorT, fy),
            new THREE.Vector3(fx, trayWorldY - ammoTrayZ / 2 - footH, fy + trayWorldZ)
          ];
          const forceLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), xrayLineMat);
          forceLine.computeLineDistances();
          ammoGroup.add(forceLine);
        }
      });

      // 6. TRAY, HOLES, AND CALIBER-ACCURATE CARTRIDGES
      if (currentCalSpec) {
        const leftCols = Math.ceil(clampedAmmoCols / 2);
        const centerSplitGap = 6.5;
        const basePitch = currentCalSpec.pitch;
        const rad = currentCalSpec.holeDia / 2 - 0.15;

        // Clean, tight tray width with NO empty phantom column on the right!
        const spineAllowance = clampedAmmoCols > 1 ? centerSplitGap : 0;
        const effectiveTrayW = (clampedAmmoCols * basePitch) + spineAllowance + 6.4;
        const effectiveTrayD = (clampedAmmoRows * basePitch) + 6.4;

        // Every column sits flush from left wall to right wall with the 6.5mm spine between leftCols and rightCols
        const getColCenterX = (c) => {
          const colOffset = (clampedAmmoCols > 1 && c >= leftCols) ? centerSplitGap : 0;
          return (-effectiveTrayW / 2) + 3.2 + (basePitch / 2) + (c * basePitch) + colOffset;
        };

        // Spine X coordinate sits directly in the 6.5mm channel between leftCols and rightCols
        const spineCenterX = clampedAmmoCols > 1
          ? (-effectiveTrayW / 2) + 3.2 + (leftCols * basePitch) + (centerSplitGap / 2)
          : 0;

        const holeMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
        const pocketBottomY = -ammoTrayZ / 2 + 2.4;
        const roundOal = currentCalSpec.oal || 29.7;
        const calUpper = (currentCalSpec.name + ' ' + (currentCalSpec.short || '')).toUpperCase();
        const is12Ga = calUpper.includes('12GA') || calUpper.includes('12 GA');
        const is20Ga = calUpper.includes('20GA') || calUpper.includes('20 GA');
        const isShotgun = is12Ga || is20Ga || currentCalSpec.category === 'Shotgun';

        // --- HOLE POCKETS ---
        for (let c = 0; c < clampedAmmoCols; c++) {
          const cx = getColCenterX(c);
          for (let r = 0; r < clampedAmmoRows; r++) {
            const cy = (-effectiveTrayD / 2) + 3.2 + (basePitch / 2) + (r * basePitch);
            const hole = new THREE.Mesh(new THREE.CylinderGeometry(rad + 0.2, rad + 0.2, 0.2, 16), holeMat);
            hole.position.set(cx, ammoTrayZ / 2 + 0.05, cy);
            trayGroup.add(hole);
          }
        }

        // --- 1. CALIBER-ACCURATE CARTRIDGES (SHOTGUN SHELLS vs RIFLE/PISTOL) ---
        if (showAmmoRounds) {
          const roundBrassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.22 });
          const copperMat = new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.75, roughness: 0.28 });
          // Authentic Red hull for 12GA, Sporting Yellow hull for 20GA!
          const hullMat = new THREE.MeshStandardMaterial({
            color: is20Ga ? 0xeab308 : 0xd91c24,
            roughness: 0.45,
            metalness: 0.05
          });
          const primerMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.9, roughness: 0.18 });
          const primerGapMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });

          const rRad = Math.max(2, ((currentCalSpec.holeDia || 10.3) - 0.5) / 2);
          const totalLen = roundOal;
          const caseLen = totalLen * 0.65;
          const bulletLen = totalLen * 0.35;
          const rimHeight = 1.2;
          const topY = pocketBottomY + totalLen;

          for (let c = 0; c < clampedAmmoCols; c++) {
            const cx = getColCenterX(c);
            for (let r = 0; r < clampedAmmoRows; r++) {
              const cy = (-effectiveTrayD / 2) + 3.2 + (basePitch / 2) + (r * basePitch);
              const roundGroup = new THREE.Group();

              if (isShotgun) {
                // Realistic Shotgun Shell: 8mm high-polish brass head at top + vibrant Red/Yellow ribbed plastic hull!
                const brassHeadLen = 8.5;
                const redHullLen = totalLen - rimHeight - brassHeadLen;

                // Slightly wider radius (0.98) so the red plastic hull is clearly visible above the tray pocket!
                const hullGeo = new THREE.CylinderGeometry(rRad * 0.96, rRad * 0.96, redHullLen, 24);
                const hullMesh = new THREE.Mesh(hullGeo, hullMat);
                hullMesh.position.y = pocketBottomY + redHullLen / 2;
                roundGroup.add(hullMesh);

                const brassHeadGeo = new THREE.CylinderGeometry(rRad * 0.99, rRad * 0.99, brassHeadLen, 24);
                const brassHeadMesh = new THREE.Mesh(brassHeadGeo, roundBrassMat);
                brassHeadMesh.position.y = pocketBottomY + redHullLen + brassHeadLen / 2;
                roundGroup.add(brassHeadMesh);

                // Extruded Brass Rim Flange at the top
                const shotgunRimGeo = new THREE.CylinderGeometry(rRad * 1.05, rRad * 1.02, rimHeight, 24);
                const shotgunRimMesh = new THREE.Mesh(shotgunRimGeo, roundBrassMat);
                shotgunRimMesh.position.y = topY - rimHeight / 2;
                roundGroup.add(shotgunRimMesh);
              } else {
                // Standard Rifle/Pistol Bullet
                const tipGeo = new THREE.ConeGeometry(rRad * 0.88, bulletLen, 16);
                tipGeo.rotateX(Math.PI);
                const tipMesh = new THREE.Mesh(tipGeo, copperMat);
                tipMesh.position.y = pocketBottomY + bulletLen / 2;
                roundGroup.add(tipMesh);

                const caseGeo = new THREE.CylinderGeometry(rRad * 0.96, rRad * 0.92, caseLen, 20);
                const caseMesh = new THREE.Mesh(caseGeo, roundBrassMat);
                caseMesh.position.y = pocketBottomY + bulletLen + caseLen / 2;
                roundGroup.add(caseMesh);

                const rimGeo = new THREE.CylinderGeometry(rRad * 0.98, rRad * 0.98, rimHeight, 20);
                const rimMesh = new THREE.Mesh(rimGeo, roundBrassMat);
                rimMesh.position.y = topY - rimHeight / 2;
                roundGroup.add(rimMesh);
              }

              const pocketRingGeo = new THREE.CylinderGeometry(rRad * 0.44, rRad * 0.44, 0.25, 16);
              const pocketRingMesh = new THREE.Mesh(pocketRingGeo, primerGapMat);
              pocketRingMesh.position.y = topY + 0.05;
              roundGroup.add(pocketRingMesh);

              const primerGeo = new THREE.CylinderGeometry(rRad * 0.38, rRad * 0.38, 0.35, 16);
              const primerMesh = new THREE.Mesh(primerGeo, primerMat);
              primerMesh.position.y = topY + 0.1;
              roundGroup.add(primerMesh);

              roundGroup.position.set(cx, 0, cy);
              trayGroup.add(roundGroup);
            }
          }
        }

        // --- 2. DUAL-LEG T-HANDLE ---
        const handleMat = new THREE.MeshStandardMaterial({ color: activeAmmoLatchColor.hex, roughness: 0.35, metalness: 0.1 });
        const handleGroup = new THREE.Group();
        const trayTopY = ammoTrayZ / 2;
        const fingerClearance = 14.0;
        const roundTopY = pocketBottomY + roundOal;

        const handleTopY = Math.max(trayTopY + 14.0, roundTopY + fingerClearance);
        const shaftHeight = handleTopY - trayTopY;
        const barWidth = Math.min(effectiveTrayW * 0.45, Math.max(28, basePitch * 2.2));

        handleGroup.position.x = spineCenterX;

        const spineBridgeGeo = new THREE.BoxGeometry(6.5, 2.4, clampedAmmoRows * basePitch);
        const spineBridgeMesh = new THREE.Mesh(spineBridgeGeo, handleMat);
        spineBridgeMesh.position.set(0, trayTopY + 1.2, 0);
        handleGroup.add(spineBridgeMesh);

        [-2.0, 2.0].forEach((xOff) => {
          const postGeo = new THREE.BoxGeometry(2.4, shaftHeight, 5.0);
          const postMesh = new THREE.Mesh(postGeo, handleMat);
          postMesh.position.set(xOff, trayTopY + shaftHeight / 2, 0);
          handleGroup.add(postMesh);
        });

        const tBarGeo = new THREE.BoxGeometry(barWidth, 4.8, 8.5);
        const tBarMesh = new THREE.Mesh(tBarGeo, handleMat);
        tBarMesh.position.set(0, handleTopY, 0);
        handleGroup.add(tBarMesh);

        for (let i = -2; i <= 2; i++) {
          const ridgeGeo = new THREE.BoxGeometry(1.4, 1.0, 7.8);
          const ridgeMesh = new THREE.Mesh(ridgeGeo, handleMat);
          ridgeMesh.position.set(i * 4.5, handleTopY + 2.7, 0);
          handleGroup.add(ridgeMesh);
        }

        trayGroup.add(handleGroup);
        ammoGroup.add(trayGroup);
        group.add(ammoGroup);
      }
      
      
      if (showDimensions) {
        const wSprite = createDimensionSprite(`${ammoShellX} mm W`);
        wSprite.position.set(0, 10, ammoShellY / 2 + 20);
        group.add(wSprite);
        const lSprite = createDimensionSprite(`${ammoShellY} mm L`);
        lSprite.position.set(ammoShellX / 2 + 20, 10, 0);
        group.add(lSprite);
      }
    } else if (activeTab === 'cargo') {
      // ==========================================
      // THE CARGO MATRIX (TACTICAL BOLTED UPGRADE)
      // ==========================================
      const boxMat = new THREE.MeshStandardMaterial({
        color: activeCargoBoxColor.hex,
        roughness: activeCargoBoxColor.roughness ?? 0.45,
        metalness: activeCargoBoxColor.metalness ?? 0.08
      });
      const textMat = new THREE.MeshStandardMaterial({ color: activeCargoTextColor.hex, roughness: 0.4 });
      const latchMat = new THREE.MeshStandardMaterial({ color: activeCargoLatchColor.hex, roughness: 0.4 }); // New material!
      const steelMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.85, roughness: 0.25 });

      const totalZ = cargoHeight * 2;
      const lidZ = 12.0;
      const baseZ = totalZ - lidZ;
      const wallT = 2.4;
      const floorT = 2.4;
      const ribThick = 1.8;
      const ribWidth = 10.0;
      const cargoGroup = new THREE.Group();

      // 1. ARMORED BASE SHELL (WITH COMPARTMENT GRID)
      const baseShellGroup = new THREE.Group();
      const baseFloor = new THREE.Mesh(new THREE.BoxGeometry(cargoWidth, floorT, cargoLength), boxMat);
      baseFloor.position.y = floorT / 2;
      baseShellGroup.add(baseFloor);

      const wallH = baseZ - floorT;
      const wFront = new THREE.Mesh(new THREE.BoxGeometry(cargoWidth, wallH, wallT), boxMat);
      wFront.position.set(0, floorT + wallH / 2, cargoLength / 2 - wallT / 2);
      const wBack = wFront.clone();
      wBack.position.set(0, floorT + wallH / 2, -cargoLength / 2 + wallT / 2);
      baseShellGroup.add(wFront, wBack);

      const wLeft = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, cargoLength - wallT * 2), boxMat);
      wLeft.position.set(-cargoWidth / 2 + wallT / 2, floorT + wallH / 2, 0);
      const wRight = wLeft.clone();
      wRight.position.set(cargoWidth / 2 - wallT / 2, floorT + wallH / 2, 0);
      baseShellGroup.add(wLeft, wRight);

      // Compartment Grid
      const innerW = cargoWidth - wallT * 2;
      const innerL = cargoLength - wallT * 2;
      const cw = (innerW - wallT * (cargoCompX - 1)) / cargoCompX;
      const cl = (innerL - wallT * (cargoCompY - 1)) / cargoCompY;

      if (cargoCompX > 1) {
        for (let i = 1; i < cargoCompX; i++) {
          const xPos = -innerW / 2 + i * (cw + wallT) - wallT / 2;
          const divX = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, innerL), boxMat);
          divX.position.set(xPos, floorT + wallH / 2, 0);
          baseShellGroup.add(divX);
        }
      }
      if (cargoCompY > 1) {
        for (let j = 1; j < cargoCompY; j++) {
          const zPos = -innerL / 2 + j * (cl + wallT) - wallT / 2;
          const divZ = new THREE.Mesh(new THREE.BoxGeometry(innerW, wallH, wallT), boxMat);
          divZ.position.set(0, floorT + wallH / 2, zPos);
          baseShellGroup.add(divZ);
        }
      }

      // Exterior Ribs
      [-1, 1].forEach((dir) => {
        const sideRibL = new THREE.Mesh(new THREE.BoxGeometry(ribThick, baseZ - 2, ribWidth), boxMat);
        sideRibL.position.set(-cargoWidth / 2 - ribThick / 2, (baseZ - 2) / 2, dir * (cargoLength * 0.26));
        const sideRibR = sideRibL.clone();
        sideRibR.position.set(cargoWidth / 2 + ribThick / 2, (baseZ - 2) / 2, dir * (cargoLength * 0.26));
        baseShellGroup.add(sideRibL, sideRibR);

        const fbRibFront = new THREE.Mesh(new THREE.BoxGeometry(ribWidth, baseZ - 2, ribThick), boxMat);
        fbRibFront.position.set(dir * (cargoWidth * 0.36), (baseZ - 2) / 2, cargoLength / 2 + ribThick / 2);
        baseShellGroup.add(fbRibFront);
        const heelShape = new THREE.Shape();
        heelShape.moveTo(0, 0);
        heelShape.lineTo(12.0, 0);
        heelShape.lineTo(12.0, 3.0);
        heelShape.lineTo(1.8, baseZ - 2.0);
        heelShape.lineTo(0, baseZ - 2.0);
        heelShape.closePath();
        const heelGeo = new THREE.ExtrudeGeometry(heelShape, { depth: ribWidth, bevelEnabled: false });
        heelGeo.rotateY(Math.PI / 2);
        const heelMesh = new THREE.Mesh(heelGeo, boxMat);
        heelMesh.position.set(dir * (cargoWidth * 0.36) - ribWidth / 2, 0, -cargoLength / 2);
        baseShellGroup.add(heelMesh);
      });

      // 2. TRUE DUAL M3 REAR CORNER HINGES (Base Clevis Ears + M3 Bolts)
      const hingeRadius = 4.2;
      const hingeXSpan = cargoWidth * 0.28;
      const hingeY = baseZ;
      const hingeZ = -cargoLength / 2 - 4.6;

      [-1, 1].forEach((side) => {
        const hx = side * hingeXSpan;
        
        // Dual Base Ears (6.0mm wide, spaced 13.6mm apart)
        [-6.8, 6.8].forEach((earOff) => {
          const baseKnuckle = new THREE.Mesh(new THREE.CylinderGeometry(hingeRadius, hingeRadius, 6.0, 20).rotateZ(Math.PI / 2), boxMat);
          baseKnuckle.position.set(hx + earOff, hingeY, hingeZ);
          baseShellGroup.add(baseKnuckle);
        });

        // M3x20mm Stainless Steel Screw (1 per hinge assembly)
        const m3HingePin = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 20.0, 16).rotateZ(Math.PI / 2), steelMat);
        m3HingePin.position.set(hx, hingeY, hingeZ);
        baseShellGroup.add(m3HingePin);
      });

      // Base Latches
      const numLatches = cargoWidth >= 130 ? 2 : 1;
      const latchOffsets = numLatches === 2 ? [-cargoWidth * 0.23, cargoWidth * 0.23] : [0];
      latchOffsets.forEach((lx) => {
        const latchGroup = new THREE.Group();
        latchGroup.position.set(lx, baseZ, cargoLength / 2);

        const wedgeMesh = new THREE.Mesh(new THREE.BoxGeometry(12.8, 5.2, 3.2), boxMat);
        wedgeMesh.position.set(0, -5.5, 1.6);
        latchGroup.add(wedgeMesh);

        [-8.6, 8.6].forEach((cx) => {
          const shroudMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 10.5, 6.2), boxMat);
          shroudMesh.position.set(cx, -5.8, 3.1);
          latchGroup.add(shroudMesh);
        });
        baseShellGroup.add(latchGroup);
      });

      cargoGroup.add(baseShellGroup);

      // 2. SHALLOW VAULT LID
      const lidPivot = new THREE.Group();
      lidPivot.position.set(0, hingeY, hingeZ);
      lidPivot.rotation.x = THREE.MathUtils.degToRad(-foldAngle || 0);

      const lidOffsetZ = -hingeZ;
      const lidRoof = new THREE.Mesh(new THREE.BoxGeometry(cargoWidth, 3.0, cargoLength), boxMat);
      lidRoof.position.set(0, lidZ - 1.5, lidOffsetZ);
      lidPivot.add(lidRoof);

      const lidWFront = new THREE.Mesh(new THREE.BoxGeometry(cargoWidth, 9.0, wallT), boxMat);
      lidWFront.position.set(0, 4.5, lidOffsetZ + cargoLength / 2 - wallT / 2);
      const lidWBack = lidWFront.clone();
      lidWBack.position.set(0, 4.5, lidOffsetZ - cargoLength / 2 + wallT / 2);
      lidPivot.add(lidWFront, lidWBack);

      const lidWLeft = new THREE.Mesh(new THREE.BoxGeometry(wallT, 9.0, cargoLength - wallT * 2), boxMat);
      lidWLeft.position.set(-cargoWidth / 2 + wallT / 2, 4.5, lidOffsetZ);
      const lidWRight = lidWLeft.clone();
      lidWRight.position.set(cargoWidth / 2 - wallT / 2, 4.5, lidOffsetZ);
      lidPivot.add(lidWLeft, lidWRight);

      // Lid Exterior Ribs
      [-1, 1].forEach((dir) => {
        const lidRibL = new THREE.Mesh(new THREE.BoxGeometry(ribThick, 10.5, ribWidth), boxMat);
        lidRibL.position.set(-cargoWidth / 2 - ribThick / 2, 5.5, lidOffsetZ + dir * (cargoLength * 0.26));
        const lidRibR = lidRibL.clone();
        lidRibR.position.set(cargoWidth / 2 + ribThick / 2, 5.5, lidOffsetZ + dir * (cargoLength * 0.26));
        lidPivot.add(lidRibL, lidRibR);

        const frontLidRib = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 1.8), boxMat);
        frontLidRib.position.set(dir * (cargoWidth * 0.36), 7, lidOffsetZ + cargoLength / 2 + 0.9);
        lidPivot.add(frontLidRib);

        const backLidRib = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 1.8), boxMat);
        backLidRib.position.set(dir * (cargoWidth * 0.36), 7, lidOffsetZ - cargoLength / 2 - 0.9);
        lidPivot.add(backLidRib);
      });

      // Dual Lid Hinge Knuckles (7.2mm wide)
      [-1, 1].forEach((side) => {
        const hx = side * hingeXSpan;
        const lidKnuckle = new THREE.Mesh(new THREE.CylinderGeometry(hingeRadius, hingeRadius, 7.2, 20).rotateZ(Math.PI / 2), boxMat);
        lidKnuckle.position.set(hx, 0, 0);
        lidPivot.add(lidKnuckle);
      });

      // Lid Latches
      const latchPinMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.85, roughness: 0.25 });
      latchOffsets.forEach((lx) => {
        const fZ = lidOffsetZ + cargoLength / 2;

        [-8.6, 8.6].forEach((cx) => {
          const earBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 8.8, 4.2), boxMat);
          earBase.position.set(lx + cx, 6.0, fZ + 2.1);
          lidPivot.add(earBase);

          const earBoss = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.4, 3.6, 20).rotateZ(Math.PI / 2), boxMat);
          earBoss.position.set(lx + cx, 6.0, fZ + 4.2);
          lidPivot.add(earBoss);
        });

        const pinMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 21.0, 16).rotateZ(Math.PI / 2), latchPinMat);
        pinMesh.position.set(lx, 6.0, fZ + 4.2);
        lidPivot.add(pinMesh);

        const latchBarrel = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 13.2, 20).rotateZ(Math.PI / 2), latchMat);
        latchBarrel.position.set(lx, 6.0, fZ + 4.2);
        lidPivot.add(latchBarrel);

        const latchBody = new THREE.Mesh(new THREE.BoxGeometry(13.2, 15.6, 3.4), latchMat);
        latchBody.position.set(lx, -1.8, fZ + 5.3);
        lidPivot.add(latchBody);

        const latchShoulder = new THREE.Mesh(new THREE.BoxGeometry(13.2, 10.0, 2.6), latchMat);
        latchShoulder.position.set(lx, 1.0, fZ + 3.5);
        lidPivot.add(latchShoulder);

        const latchLip = new THREE.Mesh(new THREE.BoxGeometry(13.2, 2.4, 5.2), latchMat);
        latchLip.position.set(lx, -9.2, fZ + 6.2);
        lidPivot.add(latchLip);

        [1.2, -1.8, -4.8].forEach((ry) => {
          const ridge = new THREE.Mesh(new THREE.BoxGeometry(11.0, 1.0, 0.9), latchMat); // Changed boxMat to latchMat
          ridge.position.set(lx, ry, fZ + 7.1);
          lidPivot.add(ridge);
        });
      });

      // Text Inlay
      const lidTex = createCargoLidTexture(cargoText, activeCargoTextColor.hex, cargoFont, cargoBorder);
      const lidLabelPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(cargoWidth - 24, cargoLength - 24),
        new THREE.MeshStandardMaterial({
          map: lidTex,
          transparent: true,
          roughness: activeCargoTextColor.roughness ?? 0.5,
          metalness: activeCargoTextColor.metalness ?? 0.08,
          polygonOffset: true,
          polygonOffsetFactor: -1
        })
      );
      lidLabelPlane.rotation.x = -Math.PI / 2;
      lidLabelPlane.position.set(0, 12.05, lidOffsetZ);
      lidPivot.add(lidLabelPlane);

      cargoGroup.add(lidPivot);
      group.add(cargoGroup);

      if (showDimensions) {
        const wSprite = createDimensionSprite(`${cargoWidth} mm W`);
        wSprite.position.set(0, 8, cargoLength / 2 + 20);
        group.add(wSprite);
  
        const lSprite = createDimensionSprite(`${cargoLength} mm L`);
        lSprite.position.set(cargoWidth / 2 + 36, 8, 0);
        group.add(lSprite);
  
        const hSprite = createDimensionSprite(`${totalZ} mm H`);
        hSprite.position.set(-cargoWidth / 2 - 36, totalZ / 2, 0);
        group.add(hSprite);
      }
    }

  }, [
    activeTab,
    tiers,
    drawersPerTier,
    enableAmmoLidBorder,
    opening,
    handlePos,
    width,
    depth,
    height,
    enableLabelSlot,
    labelWidth,
    labelHeight,
    maxLabelWidth,
    maxLabelHeight,
    labelFont,
    labels,
    drawerDividers,
    getDividerForDrawer,
    activeCasingColor,
    activeDrawerColor,
    explodedView,
    xrayMode,
    showDimensions,
    singleTierHeightMm,
    isOverP1SLimit,
    cargoWidth,
    cargoLength,
    cargoHeight,
    cargoCompX,
    cargoCompY,
    activeCargoBoxColor,
    activeCargoTextColor,
    activeCargoLatchColor,
    cargoText,
    cargoFont,
    cargoBorder,
    foldAngle,
    ammoCaliber,
    ammoCols,
    ammoRows,
    activeAmmoBaseColor,
    activeAmmoLidColor,
    activeAmmoTrayColor,
    activeAmmoLatchColor,
    ammoHingeAngle,
    ammoTrayPose,
    showAmmoRounds,
    showMagnetXray,
    clampedAmmoCols,
    clampedAmmoRows,
    ammoTotalRounds,
    ammoShellX,
    ammoShellY,
    ammoShellZ,
    ammoTrayX,
    ammoTrayY,
    ammoTrayZ,
    ammoLidTitle,
    ammoLidFont,
    showAmmoRoundCount,
    currentCalSpec
  ]);

  useEffect(() => {
    const pivotSign = opening === 'Left' ? -1 : 1;
    const maxSwingRad = THREE.MathUtils.degToRad(68);
    drawerPivotsRef.current.forEach((item) => {
      const isIndividuallyOpen = !!openDrawersMap[item.drawerKey];
      const explodedFan = explodedView ? 0.35 + ((drawersPerTier - 1 - item.boxIndex) / Math.max(1, drawersPerTier)) * 0.45 : 0;
      const ratio = Math.max(swingOpenAmount, isIndividuallyOpen ? 0.78 : 0, explodedFan);
      item.targetAngle = pivotSign * ratio * maxSwingRad;
    });
  }, [swingOpenAmount, openDrawersMap, explodedView, opening, drawersPerTier]);
  // ADD SUCCESS VIEW HERE
  if (isSuccessPage) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-[#0b0f19] text-[#e2e8f0] font-sans p-6 text-center">
        <div className="max-w-md w-full bg-[#111827] border border-[#38bdf8]/40 rounded-2xl p-8 shadow-2xl space-y-4">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider">Payment Successful!</h1>
          <p className="text-xs text-[#94a3b8] leading-relaxed">
            Thank you for your custom FieldMatrix order. Your payment has been processed successfully through Square, and your build specs have been logged for printing.
          </p>
          <a
            href="/"
            className="block w-full py-2.5 rounded-lg bg-[#38bdf8] text-[#0b0f19] font-bold text-xs uppercase tracking-wider hover:bg-[#7dd3fc] transition-all"
          >
            Create Another Matrix
          </a>
        </div>
      </div>
    );
  }

  // YOUR EXISTING MAIN RETURN STAYS HERE

  return (
    <div className="flex flex-col-reverse md:flex-row h-[100dvh] w-full overflow-hidden bg-[#0b0f19] text-[#e2e8f0] font-sans select-none">
      <style>{`
        .box-studio-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          background: #334155;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
        }
        .box-studio-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: #f43f5e;
          border: 2.5px solid #ffffff;
          cursor: pointer;
        }
      `}</style>

      {/* ADMIN ORDER RECALL & CHANNEL SWITCHER MODAL */}
      {adminMode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#38bdf8]/40 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2 text-[#38bdf8] font-bold text-sm">
                <Lock size={16} />
                <span>{adminUnlocked ? 'Admin Control Center' : 'Admin Security Gate'}</span>
              </div>
              <button onClick={() => setAdminMode(false)} className="text-[#94a3b8] hover:text-white text-sm font-bold">
                ✕
              </button>
            </div>

            {!adminUnlocked ? (
              <div className="space-y-3 text-center py-2">
                <p className="text-xs text-[#94a3b8]">
                  Sign in with an authorized administrator Google account to unlock customer order lookup and OpenSCAD exports:
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const provider = new GoogleAuthProvider();
                      const result = await signInWithPopup(auth, provider);
                      const email = result.user.email;

                      // PUT YOUR EXACT ADMIN GMAIL ADDRESS HERE:
                      const AUTHORIZED_ADMINS = ['info@glitchygrizzly.com']; 

                      if (AUTHORIZED_ADMINS.includes(email)) {
                        setAdminUnlocked(true);
                        setStatusBanner({ type: 'success', text: `Welcome Admin (${email})` });
                      } else {
                        alert(`Access Denied: ${email} is not authorized as an admin.`);
                        await auth.signOut();
                      }
                    } catch (err) {
                      console.error("Google Admin Auth Error:", err);
                      alert(`Admin Sign-In Error (${err.code || 'Error'}): ${err.message}`);
                    }
                  }}
                  className="w-full py-2.5 rounded-lg bg-white text-slate-900 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Sign in with Google (Admin)
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* CHANNEL MODE PREVIEW SWITCHER */}
                <div className="p-3 rounded-lg bg-[#0b0f19] border border-[#1e293b] space-y-2">
                  <div className="text-[11px] font-bold text-[#38bdf8] uppercase tracking-wider">
                    Storefront Funnel Mode Preview
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleChannelMode(true)}
                      className={`py-1.5 px-2 rounded text-xs font-bold border transition-all ${
                        isEtsyMode
                          ? 'bg-[#3b1526] border-[#f43f5e] text-[#fecdd3]'
                          : 'bg-[#151e31] border-[#1e293b] text-[#94a3b8]'
                      }`}
                    >
                      Etsy Preset Mode (?source=etsy)
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleChannelMode(false)}
                      className={`py-1.5 px-2 rounded text-xs font-bold border transition-all ${
                        !isEtsyMode
                          ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8]'
                          : 'bg-[#151e31] border-[#1e293b] text-[#94a3b8]'
                      }`}
                    >
                      Direct Custom Mode (Square)
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-[#94a3b8]">
                    Recall Customer Design Code (<span className="text-white font-mono">BENCH-XXXXXX</span> or <span className="text-white font-mono">CARGO-XXXXXX</span>):
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={recallCode}
                      onChange={(e) => setRecallCode(e.target.value)}
                      placeholder="CARGO-XXXXXX"
                      className="flex-1 bg-[#0b0f19] border border-[#1e293b] rounded-lg px-3 py-2 text-sm font-mono text-white uppercase"
                    />
                    <button
                      onClick={handleAdminRecall}
                      className="px-4 py-2 rounded-lg bg-[#38bdf8] text-[#0b0f19] font-bold text-xs hover:bg-[#7dd3fc]"
                    >
                      Load Order
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1e293b] flex justify-between items-center">
                  <span className="text-[11px] text-emerald-400 font-semibold">✓ Admin .SCAD Unlocked</span>
                  <button
                    onClick={() => {
                      setAdminMode(false);
                      setModalTab('scad');
                      setShowModal(true);
                    }}
                    className="px-3 py-1.5 rounded bg-[#f43f5e] text-white text-xs font-bold"
                  >
                    Open .SCAD Generator
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SPEC SHEET & ADMIN-ONLY OPENSCAD GENERATOR MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 bg-[#0f172a] border-b border-[#1e293b] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#38bdf8] uppercase tracking-wider flex items-center gap-2">
                  <span>
                    {currentProductMeta.name} • Code: <span className="text-white">{designCode}</span>
                  </span>
                  {adminUnlocked && (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-[10px] text-emerald-300">
                      ADMIN UNLOCKED
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-[#94a3b8]">
                  {isEtsyMode
                    ? `Select the "${
                        activeTab === 'bench'
                          ? sizePreset
                          : activeTab === 'ammo'
                          ? `${ammoTotalRounds} Rds (${currentCalSpec.short})`
                          : cargoPreset
                      }" option on Etsy and paste your Design Code in the personalization box.`
                    : `Copy your Design Code and proceed to Square Checkout to complete your custom order.`}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#94a3b8] hover:text-white text-sm font-bold px-2">
                ✕
              </button>
            </div>

            {adminUnlocked && currentProductMeta.hasOpenScadGenerator && (
              <div className="px-5 pt-3 bg-[#111827] flex flex-wrap items-center justify-between gap-2 border-b border-[#1e293b]">
                <div className="flex gap-2">
                  <button
                    onClick={() => setModalTab('spec')}
                    className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors ${
                      modalTab === 'spec' ? 'border-[#38bdf8] text-[#38bdf8]' : 'border-transparent text-[#94a3b8]'
                    }`}
                  >
                    Customer Spec Summary
                  </button>
                  <button
                    onClick={() => setModalTab('scad')}
                    className={`pb-2 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                      modalTab === 'scad' ? 'border-[#f43f5e] text-[#fecdd3]' : 'border-transparent text-[#94a3b8]'
                    }`}
                  >
                    <Code size={13} /> Admin OpenSCAD (.scad)
                  </button>
                </div>

                {modalTab === 'scad' && (
                  <div className="flex items-center gap-1 pb-2 flex-wrap">
                    <span className="text-[10px] text-[#94a3b8] mr-1">Export Part:</span>
                    {(activeTab === 'ammo'
                      ? [
                          { id: 'full', label: 'All Parts Laid Out' },
                          { id: 'base_only', label: 'Base Shell' },
                          { id: 'lid_only', label: 'Vault Lid (Print Upside-Down)' },
                          { id: 'text_only', label: 'Lid Inlay (Text & Border)' },
                          { id: 'tray_only', label: 'Standing Tray' },
                          { id: 'handle_only', label: 'T-Handle (Flat)' },
                          { id: 'latch_only', label: 'Cam Latches (Flat)' },
                          { id: 'tpu_pad', label: 'TPU Rattle Pad (5.5mm)' }
                        ]
                        : [
                          { id: 'full', label: 'Full 3MF' },
                          { id: 'box_only', label: 'Base Only' },
                          { id: 'lid_only', label: 'Lid Only' },
                          { id: 'text_only', label: 'Inlay Only' },
                          { id: 'latch_only', label: 'Latches Only' }
                        ]
                    ).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setScadExportMode(m.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                          scadExportMode === m.id
                            ? 'bg-[#f43f5e] text-white'
                            : 'bg-[#151e31] text-[#94a3b8] hover:text-white border border-[#1e293b]'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {adminUnlocked && currentProductMeta.hasOpenScadGenerator && modalTab === 'scad' && (
              <div className="px-5 py-3 min-h-[44px] flex-shrink-0 bg-[#090d16] border-b border-[#1e293b] text-[11px] font-mono text-[#38bdf8] break-all leading-relaxed">
                Save Filename: <span className="text-white">{activeTab === 'ammo' ? getAmmoScadFilename(scadExportMode) : getCargoScadFilename(scadExportMode)}</span>
              </div>
            )}

            <div className="p-4 overflow-y-auto flex-1 bg-[#0b0f19] m-4 rounded-lg border border-[#1e293b]">
              <pre className="text-xs font-mono text-[#e2e8f0] whitespace-pre-wrap leading-relaxed">
                {adminUnlocked && currentProductMeta.hasOpenScadGenerator && modalTab === 'scad'
                  ? (activeTab === 'ammo' ? generateAmmoMatrixScad(scadExportMode) : generateScadCode(scadExportMode))
                  : generateSpecSheet()}
              </pre>
            </div>

            <div className="px-5 py-3.5 bg-[#0f172a] border-t border-[#1e293b] flex flex-wrap items-center justify-between gap-2">
              {adminUnlocked && currentProductMeta.hasOpenScadGenerator && modalTab === 'scad' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        activeTab === 'ammo' ? generateAmmoMatrixScad(scadExportMode) : generateScadCode(scadExportMode)
                      );
                      setScadCopied(true);
                      setTimeout(() => setScadCopied(false), 2000);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    {scadCopied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {scadCopied ? 'Copied .SCAD!' : 'Copy .SCAD Code'}
                  </button>
                  <button
                    onClick={() => (activeTab === 'ammo' ? handleDownloadScad() : downloadScadFile(scadExportMode))}
                    className="px-3.5 py-2 rounded-lg bg-[#38bdf8] text-[#0b0f19] font-bold text-xs flex items-center gap-1.5"
                  >
                    <Download size={14} /> Download {scadExportMode.toUpperCase()} .SCAD
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(designCode);
                      saveDesignToFirestore(designCode);
                      setCodeCopied(true);
                      setTimeout(() => setCodeCopied(false), 2500);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/50 hover:bg-[#38bdf8]/25 text-[#38bdf8] font-bold text-xs flex items-center gap-1.5"
                  >
                    {codeCopied ? <CheckCircle size={15} className="text-emerald-400" /> : <Copy size={15} />}
                    {codeCopied ? `Copied Code (${designCode})!` : `Copy Code: ${designCode}`}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generateSpecSheet());
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    {copied ? <CheckCircle size={15} className="text-emerald-400" /> : <Copy size={15} />}
                    {copied ? 'Copied Full Spec!' : 'Copy Spec Sheet'}
                  </button>
                </div>
              )}

              {isEtsyMode ? (
                <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                  <a
                    href={currentProductMeta.etsyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleCheckoutActionClick}
                    className="px-5 py-2 rounded-lg bg-[#f43f5e] hover:bg-[#fb7185] text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    {codeCopied
                      ? `Code Copied! Select "${
                          activeTab === 'bench'
                            ? sizePreset
                            : activeTab === 'ammo'
                            ? `${ammoTotalRounds} Rds (${currentCalSpec.short})`
                            : cargoPreset
                        }" on Etsy`
                      : `Copy Code & Finish on Etsy (${
                          activeTab === 'bench'
                            ? sizePreset
                            : activeTab === 'ammo'
                            ? `${ammoTotalRounds} Rds`
                            : cargoPreset
                        })`}{' '}
                    <ExternalLink size={14} />
                  </a>

                  {/* Etsy Multi-Item Helper Hint */}
                  <div className="flex items-start gap-2 w-full text-xs text-slate-400 bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-blue-400 text-sm leading-none">💡</span>
                    <p>
                      <strong className="text-slate-300">Ordering multiple different builds on Etsy?</strong><br />
                      Copy this code, add it to your Etsy cart, then come back here to design your next one. We'll generate a fresh code for each new item!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  {/* Mini Cart Summary Pills (shows when 1 or more items are in the cart) */}
                  {cart.length > 0 && (
                    <div className="flex flex-wrap items-center justify-end gap-1.5 bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-200 shadow-md">
                      <span className="font-semibold text-slate-400 mr-1">Cart:</span>
                      {cart.map((item) => (
                        <div
                          key={item.designCode}
                          className="flex items-center gap-1.5 bg-slate-800 border border-slate-600 px-2 py-0.5 rounded text-[11px]"
                        >
                          <span className="font-mono text-emerald-400">{item.designCode}</span>
                          <span className="text-slate-400">(${item.price.toFixed(2)})</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(item.designCode, -1)}
                            className="px-1.5 hover:bg-slate-700 rounded text-slate-300 font-bold"
                            title="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="font-bold text-white">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQty(item.designCode, 1)}
                            className="px-1.5 hover:bg-slate-700 rounded text-slate-300 font-bold"
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons: Add to Cart + Checkout */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow"
                    >
                      + Add Current Build (${calculatePrice().toFixed(2)})
                    </button>

                    <button
                      type="button"
                      disabled={isCheckingOut}
                      onClick={handleCheckoutActionClick}
                      className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center gap-2 transition-all shadow-lg"
                    >
                      {isCheckingOut
                        ? 'Redirecting to Square...'
                        : cart.length > 0
                        ? `Checkout Cart (${cart.reduce((s, i) => s + i.quantity, 0)} items — $${cart
                            .reduce((s, i) => s + i.price * i.quantity, 0)
                            .toFixed(2)})`
                        : `Buy Current Build ($${calculatePrice().toFixed(2)})`}{' '}
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR CONTROLS */}
      <aside className="w-full md:w-[390px] lg:w-[400px] shrink-0 h-[56dvh] md:h-full min-h-0 bg-[#111827] border-t md:border-t-0 md:border-r border-[#1e293b] flex flex-col z-20 shadow-2xl">
        <div className="px-4 py-3 border-b border-[#1e293b] bg-[#0f172a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Cube icon for 5-click admin unlock */}
              <div
                onClick={handleLogoSecretClick}
                className="w-8 h-8 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8] cursor-pointer"
              >
                <Package size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black tracking-wider text-sm text-white uppercase">
                    FieldMatrix 3D
                  </span>
                  {isEtsyMode && (
                    <span className="px-1.5 py-0.5 rounded bg-[#3b1526] border border-[#f43f5e]/50 text-[9px] font-bold text-[#fecdd3] uppercase">
                      Etsy Customizer
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#38bdf8] font-medium">
                  Glitchy Grizzly • <span className="text-[#94a3b8]">You configure your Matrix. We print &amp; ship.</span>
                </p>
              </div>
            </div>

            {adminUnlocked && (
              <button
                onClick={() => setAdminMode(true)}
                className="px-3 py-1.5 bg-slate-800 text-amber-400 rounded-lg shadow hover:bg-slate-700 transition border border-amber-500/40 flex items-center gap-1.5 text-xs font-medium"
              >
                <span>🔑</span>
                <span>Admin</span>
              </button>
            )}
          </div>

          {/* DYNAMIC PRODUCT CATALOG SELECTOR */}
          {!window.location.pathname.match(/^\/(cargo|ammo|bench)$/) && (
            <div className="grid grid-cols-2 gap-1.5 bg-[#090d16] p-1 rounded-lg border border-[#1e293b] mt-2.5">
              {Object.values(PRODUCT_CATALOG).map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => setActiveTab(prod.id)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === prod.id
                      ? 'bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/40'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  {prod.id === 'bench' ? <Sliders size={13} /> : prod.id === 'ammo' ? <Shield size={13} className="text-amber-400" /> : <Box size={13} />} {prod.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5 custom-scrollbar">
          {activeTab === 'bench' ? (
            <>
              {/* 4 BENCH MATRIX PRESET SIZES */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#94a3b8] px-0.5">
                  <span className="font-bold uppercase tracking-wider text-[#38bdf8]">
                    {isEtsyMode ? 'Select Etsy Size Tier:' : 'Preset Starting Sizes:'}
                  </span>
                  <span className="text-[#fecdd3] font-semibold">
                    {BENCH_PRESETS[sizePreset]?.summary || 'Custom Size'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {Object.keys(BENCH_PRESETS).map((presetKey) => (
                    <button
                      key={presetKey}
                      onClick={() => applyBenchPreset(presetKey)}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition-all ${
                        sizePreset === presetKey
                          ? 'bg-[#3b1526] border-[#f43f5e]/80 text-[#fecdd3] shadow'
                          : 'bg-[#0f172a] border-[#1e293b] text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      {presetKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* CONFIGURATION */}
              <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl">
                <button
                  onClick={() => toggleSection('config')}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase text-[#38bdf8] border-b border-[#1e293b]"
                >
                  <span className="flex items-center gap-1.5">
                    <Sliders size={13} /> {isEtsyMode ? 'Hardware Orientation' : 'Configuration & Dimensions'}
                  </span>
                  {openSections.config ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {openSections.config && (
                  <div className="p-3.5 space-y-3.5">
                    {/* Opening & Handle Orientation (Available in BOTH Etsy & Direct Modes) */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Opening Side</span>
                      <div className="grid grid-cols-2 gap-1 bg-[#090d16] p-0.5 rounded-md border border-[#1e293b]">
                        {['Right', 'Left'].map((dir) => (
                          <button
                            key={dir}
                            onClick={() => setOpening(dir)}
                            className={`px-3 py-1 rounded text-xs font-semibold ${
                              opening === dir ? 'bg-[#3b1526] text-[#fecdd3]' : 'text-[#94a3b8]'
                            }`}
                          >
                            {dir}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Handle Notch</span>
                      <div className="grid grid-cols-2 gap-1 bg-[#090d16] p-0.5 rounded-md border border-[#1e293b]">
                        {['Front', 'Back'].map((pos) => (
                          <button
                            key={pos}
                            onClick={() => setHandlePos(pos)}
                            className={`px-3 py-1 rounded text-xs font-semibold ${
                              handlePos === pos ? 'bg-[#3b1526] text-[#fecdd3]' : 'text-[#94a3b8]'
                            }`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>

                    {isEtsyMode ? (
                      <div className="p-2.5 rounded-lg bg-[#151e31] border border-[#1e293b] text-[11px] text-[#cbd5e1] flex items-center justify-between">
                        <span>Preset Dimensions ({sizePreset}):</span>
                        <span className="font-mono font-bold text-[#38bdf8]">
                          {width}W × {depth}D × {totalStackedHeightMm}H mm
                        </span>
                    </div>
                  ) : (
                    <>
                      {/* DIRECT MODE ONLY: FULL MILLIMETER SLIDERS */}
                      <div className="flex items-center justify-between bg-[#151e31] px-2.5 py-2 rounded-lg border border-[#1e293b]">
                        <div className="flex items-center text-xs text-[#cbd5e1]">
                          <Lock size={13} className="text-emerald-400 mr-1.5" />
                          <span>Lock to 250 mm Max Rod Height</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Enforced
                          </span>
                      
                          {/* Reset all dimensions to default */}
                          <button
                            type="button"
                            onClick={handleResetDirectDimensions}
                            title="Reset dimensions to default"
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          >
                            <RotateCcw size={13} />
                          </button>
                        </div>


                        {/* 
                          TODO: Re-enable toggle when a larger printer is available
                          <button
                            type="button"
                            onClick={() => setLockToP1S(!lockToP1S)}
                            className={`w-9 h-5 rounded-full transition-colors relative ${lockToP1S ? 'bg-[#f43f5e]' : 'bg-[#334155]'}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${lockToP1S ? 'translate-x-4' : ''}`} />
                          </button>
                        */}
                      </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold">Number of tiers</span>
                            <span className="text-[#fecdd3] font-bold">{tiers}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={tiers}
                            onChange={(e) => {
                              setSizePreset('Custom');
                              setTiers(parseInt(e.target.value, 10));
                            }}
                            className="w-full box-studio-slider"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold">Drawers per tier ({totalStackedHeightMm} mm)</span>
                            <span className="text-[#fecdd3] font-bold">{drawersPerTier}</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={drawersPerTier}
                            onChange={(e) => {
                              setSizePreset('Custom');
                              const v = parseInt(e.target.value, 10);
                              setDrawersPerTier(lockToP1S ? Math.min(v, maxAllowedDrawersForCurrentHeight) : v);
                            }}
                            className="w-full box-studio-slider"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold">↔ Width (mm)</span>
                            <span className="text-[#fecdd3] font-bold">{width} mm</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="200"
                            value={width}
                            onChange={(e) => {
                              setSizePreset('Custom');
                              setWidth(parseInt(e.target.value, 10));
                            }}
                            className="w-full box-studio-slider"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold">↗ Depth (mm)</span>
                            <span className="text-[#fecdd3] font-bold">{depth} mm</span>
                          </div>
                          <input
                            type="range"
                            min="58"
                            max="120"
                            value={depth}
                            onChange={(e) => {
                              setSizePreset('Custom');
                              setDepth(parseInt(e.target.value, 10));
                            }}
                            className="w-full box-studio-slider"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold">↕ Drawer Height (mm)</span>
                            <span className="text-[#fecdd3] font-bold">{height.toFixed(1)} mm</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="30"
                            step="0.1"
                            value={height}
                            onChange={(e) => {
                              setSizePreset('Custom');
                              const v = parseFloat(e.target.value);
                              setHeight(lockToP1S ? Math.min(v, maxAllowedHeightForCurrentDrawers) : v);
                            }}
                            className="w-full box-studio-slider"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* COLORS (BENCH MATRIX) */}
              <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl">
                <button
                  onClick={() => toggleSection('colors')}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase text-[#38bdf8] border-b border-[#1e293b]"
                >
                  <span className="flex items-center gap-1.5">
                    <Palette size={13} /> Colors (20 Bambu PLA Swatches)
                  </span>
                  {openSections.colors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {openSections.colors && (
                  <div className="p-3.5 space-y-3.5">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const temp = casingColorId;
                          setCasingColorId(drawerColorId);
                          setDrawerColorId(temp);
                        }}
                        className="flex-1 py-1.5 px-2 rounded bg-[#151e31] hover:bg-[#1e293b] border border-[#334155] text-[11px] font-semibold flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeftRight size={12} className="text-[#38bdf8]" /> Swap Colors
                      </button>
                    </div>
                    <div>
                      <div className="text-xs font-semibold mb-1.5">1. Outer Casing: {activeCasingColor.name}</div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {BAMBU_PLA_COLORS.map((col) => (
                          <button
                            key={`c_${col.id}`}
                            onClick={() => setCasingColorId(col.id)}
                            className={`p-1 rounded border flex flex-col items-center gap-1 ${
                              casingColorId === col.id ? 'border-[#f43f5e] bg-[#3b1526]/60' : 'border-[#1e293b] bg-[#151e31]'
                            }`}
                          >
                            <span className="w-full h-3.5 rounded-sm" style={{ backgroundColor: col.hex }} />
                            <span className="text-[9px] truncate w-full text-center">{col.name.replace('Matte ', '')}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold mb-1.5">2. Drawers &amp; Dividers: {activeDrawerColor.name}</div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {BAMBU_PLA_COLORS.map((col) => (
                          <button
                            key={`d_${col.id}`}
                            onClick={() => setDrawerColorId(col.id)}
                            className={`p-1 rounded border flex flex-col items-center gap-1 ${
                              drawerColorId === col.id ? 'border-[#f43f5e] bg-[#3b1526]/60' : 'border-[#1e293b] bg-[#151e31]'
                            }`}
                          >
                            <span className="w-full h-3.5 rounded-sm" style={{ backgroundColor: col.hex }} />
                            <span className="text-[9px] truncate w-full text-center">{col.name.replace('Matte ', '')}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* LABELS & DIVIDERS */}
              <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5">
                    <Tag size={13} /> Drawer Labels
                  </span>
                  <button
                    type="button"
                    onClick={() => setEnableLabelSlot(!enableLabelSlot)}
                    className={`w-9 h-5 rounded-full relative ${enableLabelSlot ? 'bg-[#f43f5e]' : 'bg-[#334155]'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enableLabelSlot ? 'translate-x-4' : ''}`} />
                  </button>
                </div>

                <div className="bg-[#151e31] p-2.5 rounded-lg border border-[#1e293b] flex items-center justify-between text-xs">
                  <span className="text-[11px] font-semibold text-[#38bdf8]">Batch Dividers:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#94a3b8]">H:</span>
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={`bh_${n}`}
                        onClick={() => applyBatchDividers(n, batchV)}
                        className={`w-5 h-5 rounded text-[10px] font-bold ${batchH === n ? 'bg-[#f43f5e] text-white' : 'bg-[#0b0f19] text-[#94a3b8]'}`}
                      >
                        {n - 1}
                      </button>
                    ))}
                    <span className="text-[10px] text-[#94a3b8] ml-2">V:</span>
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={`bv_${n}`}
                        onClick={() => applyBatchDividers(batchH, n)}
                        className={`w-5 h-5 rounded text-[10px] font-bold ${batchV === n ? 'bg-[#f43f5e] text-white' : 'bg-[#0b0f19] text-[#94a3b8]'}`}
                      >
                        {n - 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {Array.from({ length: tiers }).map((_, tRev) => {
                    const t = tiers - 1 - tRev;
                    return (
                      <div key={t} className="space-y-1.5">
                        <div className="text-[10px] font-bold text-[#38bdf8]">Tier {t + 1}</div>
                        {Array.from({ length: drawersPerTier }).map((_, bRev) => {
                          const b = drawersPerTier - 1 - bRev;
                          const key = `tier_${t}_box_${b}`;
                          const div = getDividerForDrawer(t, b);
                          return (
                            <div key={b} className="p-2 rounded bg-[#151e31] border border-[#1e293b] space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-[#94a3b8] w-4">{b + 1}.</span>
                                <input
                                  type="text"
                                  maxLength={benchMaxLabelChars}
                                  placeholder={`Label (max ${benchMaxLabelChars})...`}
                                  value={labels[key] || ''}
                                  onChange={(e) =>
                                    setLabels((p) => ({
                                      ...p,
                                      [key]: e.target.value.slice(0, benchMaxLabelChars)
                                    }))
                                  }
                                  className="flex-1 bg-[#0b0f19] border border-[#1e293b] rounded px-2 py-1 text-xs text-white"
                                />
                                <span className="text-[9px] font-mono text-[#64748b] w-8 text-right">
                                  {(labels[key] || '').length}/{benchMaxLabelChars}
                                </span>
                              </div>
                              <div className="flex items-center justify-between pl-5 text-[10px]">
                                <div className="flex items-center gap-1">
                                  <span className="text-[#64748b]">H:</span>
                                  {[1, 2, 3, 4].map((n) => (
                                    <button
                                      key={n}
                                      onClick={() => setDividerForDrawer(t, b, 'h', n)}
                                      className={`w-4 h-4 rounded ${div.h === n ? 'bg-[#f43f5e] text-white' : 'bg-[#0b0f19] text-[#64748b]'}`}
                                    >
                                      {n - 1}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[#64748b]">V:</span>
                                  {[1, 2, 3, 4].map((n) => (
                                    <button
                                      key={n}
                                      onClick={() => setDividerForDrawer(t, b, 'v', n)}
                                      className={`w-4 h-4 rounded ${div.v === n ? 'bg-[#f43f5e] text-white' : 'bg-[#0b0f19] text-[#64748b]'}`}
                                    >
                                      {n - 1}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : activeTab === 'ammo' ? (
              /* ================= AMMOMATRIX LEFT PANEL CONTROLS ================= */
              <div className="space-y-4">
                {/* 1. CALIBER SELECTOR (GROUPED BY CATEGORY) */}
                <div className="bg-[#0f172a] p-3 rounded-xl border border-[#1e293b]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">1. Caliber Spec</span>
                    <span className="text-[10px] font-mono text-amber-400">{currentCalSpec?.category === 'Pistol' ? 'Pistol / Lever' : currentCalSpec?.category}</span>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {[
                      { id: 'Rimfire', label: 'Rimfire' },
                      { id: 'Pistol',  label: 'Pistol & Lever-Action (.357 / .44 / .45)' },
                      { id: 'Rifle',   label: 'Centerfire Rifles' },
                      { id: 'Shotgun', label: 'Shotgun' }
                    ].map((group) => {
                      const groupCalibers = Object.values(AMMO_CALIBERS).filter(
                        (cal) => cal.category === group.id
                      );
                      return (
                        <div key={group.id} className="space-y-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#38bdf8] border-b border-[#1e293b] pb-1">
                            {group.label}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {groupCalibers.map((cal) => (
                              <button
                                key={cal.id}
                                onClick={() => handleSelectAmmoCaliber(cal.id)}
                                disabled={isEtsyMode && cal.id !== '22lr'}
                                className={`text-left p-2 rounded-lg border transition-all ${
                                  ammoCaliber === cal.id
                                    ? 'bg-amber-500/15 border-amber-500/60 text-white'
                                    : isEtsyMode && cal.id !== '22lr'
                                    ? 'opacity-40 cursor-not-allowed border-[#1e293b]'
                                    : 'bg-[#151e31] border-[#1e293b] text-slate-300 hover:border-slate-600'
                                }`}
                              >
                                <div className="font-bold text-xs">{cal.short}</div>
                                <div className="text-[9px] text-slate-500 mt-0.5 truncate">{cal.name}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. PRESET SIZES & SLIDERS */}
                <div className="bg-[#0f172a] p-3 rounded-xl border border-[#1e293b]">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">2. Box Capacity</div>
                  <div className="grid grid-cols-3 gap-2">
                    {activeAmmoPresets.map((preset) => {
                      const isActive = clampedAmmoCols === preset.cols && clampedAmmoRows === preset.rows;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => handleSelectAmmoPreset(preset)}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            isActive
                              ? 'bg-amber-500 text-slate-900 border-amber-400 font-bold shadow-md'
                              : 'bg-[#151e31] border-[#1e293b] text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          <div className="text-xs uppercase tracking-wider">{preset.label}</div>
                        </button>
                      );
                    })}
                  </div>
                  
                  {!isEtsyMode && (
                    <div className="mt-4 pt-3 border-t border-[#1e293b] space-y-3">
                      <div className="flex justify-between text-xs text-amber-400 font-mono">
                        <span>Cols: {clampedAmmoCols}</span>
                        <span>Rows: {clampedAmmoRows}</span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={maxSafeCols}
                        step={2}
                        value={clampedAmmoCols}
                        onChange={(e) => setAmmoCols(Math.max(2, Math.round(Number(e.target.value) / 2) * 2))}
                        style={{
                          background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((clampedAmmoCols - 2) / Math.max(1, maxSafeCols - 2)) * 100}%, #1e293b ${((clampedAmmoCols - 2) / Math.max(1, maxSafeCols - 2)) * 100}%, #1e293b 100%)`
                        }}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                      <input
                        type="range"
                        min={2}
                        max={maxSafeRows}
                        step={1}
                        value={clampedAmmoRows}
                        onChange={(e) => setAmmoRows(Number(e.target.value))}
                        style={{
                          background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((clampedAmmoRows - 2) / Math.max(1, maxSafeRows - 2)) * 100}%, #1e293b ${((clampedAmmoRows - 2) / Math.max(1, maxSafeRows - 2)) * 100}%, #1e293b 100%)`
                        }}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>
                  )}
                </div>
                  
                  {/* 3. COLORS & LID TEXT */}
                <div className="bg-[#0f172a] p-3 rounded-xl border border-[#1e293b] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">3. Colors & Text</span>
                  </div>
                  
                  <div>
                    <div className="text-xs font-semibold mb-1.5">
                      1. Base Shell Body: <span className="text-[#fecdd3]">{activeAmmoBaseColor?.name}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {BAMBU_PETG_COLORS.map((col) => (
                        <button
                          key={`ab_${col.id}`}
                          onClick={() => setAmmoBaseColorId(col.id)}
                          className={`p-1 rounded border flex flex-col items-center gap-1 ${
                            ammoBaseColorId === col.id ? 'border-[#f43f5e] bg-[#3b1526]/60' : 'border-[#1e293b] bg-[#151e31]'
                          }`}
                        >
                          <span className="w-full h-3.5 rounded-sm" style={{ backgroundColor: col.hex }} />
                          <span className="text-[9px] truncate w-full text-center">{col.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold mb-1.5">
                      2. Vault Lid: <span className="text-[#38bdf8]">{activeAmmoLidColor?.name}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {BAMBU_PETG_COLORS.map((col) => (
                        <button
                          key={`al_${col.id}`}
                          onClick={() => setAmmoLidColorId(col.id)}
                          className={`p-1 rounded border flex flex-col items-center gap-1 ${
                            ammoLidColorId === col.id ? 'border-[#f43f5e] bg-[#3b1526]/60' : 'border-[#1e293b] bg-[#151e31]'
                          }`}
                        >
                          <span className="w-full h-3.5 rounded-sm" style={{ backgroundColor: col.hex }} />
                          <span className="text-[9px] truncate w-full text-center">{col.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold mb-1.5">
                      3. Ammo Tray: <span className="text-[#fecdd3]">{activeAmmoTrayColor?.name}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {BAMBU_PETG_COLORS.map((col) => (
                        <button
                          key={`at_${col.id}`}
                          onClick={() => setAmmoTrayColorId(col.id)}
                          className={`p-1 rounded border flex flex-col items-center gap-1 ${
                            ammoTrayColorId === col.id ? 'border-[#f43f5e] bg-[#3b1526]/60' : 'border-[#1e293b] bg-[#151e31]'
                          }`}
                        >
                          <span className="w-full h-3.5 rounded-sm" style={{ backgroundColor: col.hex }} />
                          <span className="text-[9px] truncate w-full text-center">{col.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold mb-1.5">
                      4. Latches &amp; Accents: <span className="text-[#38bdf8]">{activeAmmoLatchColor?.name}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {BAMBU_PETG_COLORS.map((col) => (
                        <button
                          key={`aa_${col.id}`}
                          onClick={() => setAmmoLatchColorId(col.id)}
                          className={`p-1 rounded border flex flex-col items-center gap-1 ${
                            ammoLatchColorId === col.id ? 'border-[#f43f5e] bg-[#3b1526]/60' : 'border-[#1e293b] bg-[#151e31]'
                          }`}
                        >
                          <span className="w-full h-3.5 rounded-sm" style={{ backgroundColor: col.hex }} />
                          <span className="text-[9px] truncate w-full text-center">{col.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Lid Text & Font Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <label className="text-slate-400">Custom Lid Text &amp; Font</label>
                      <span className="font-mono text-amber-400">
                        {ammoLidTitle.trim().length} / {ammoMaxLidChars} chars
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={ammoMaxLidChars}
                        value={ammoLidTitle.trim() === '' ? '' : ammoLidTitle}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().slice(0, ammoMaxLidChars);
                          // If they delete everything, pass a single space to prevent 3D/CAD engine crashes!
                          setAmmoLidTitle(val === '' ? ' ' : val);
                        }}
                        placeholder={`LID TITLE (MAX ${ammoMaxLidChars})`}
                        className="flex-1 bg-[#151e31] border border-[#1e293b] rounded p-2 text-xs text-white font-mono"
                      />
                      <select
                        value={ammoLidFont}
                        onChange={(e) => setAmmoLidFont(e.target.value)}
                        className="w-28 bg-[#151e31] border border-[#1e293b] rounded p-2 text-xs text-slate-200"
                      >
                        <option value="Impact">Impact</option>
                        <option value="Arial Black">Arial Black</option>
                        <option value="Trebuchet MS">Trebuchet</option>
                        <option value="Courier New">Courier</option>
                      </select>
                    </div>
                  </div>

                  {/* Auto Round Counter Toggle */}
                  <label className="flex items-center justify-between p-2 bg-[#151e31] rounded border border-[#1e293b] cursor-pointer">
                    <span className="text-xs text-slate-300">
                      Auto Round Count <span className="text-amber-400 font-mono">({ammoTotalRounds} RDS)</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showAmmoRoundCount}
                      onChange={(e) => setShowAmmoRoundCount(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 cursor-pointer"
                    />
                  </label>
                  {/* ---> THE NEW BORDER TOGGLE <--- */}
                  <div className="flex items-center gap-2 mt-1 bg-[#0f172a] border border-[#1e293b] rounded p-2">
                    <input
                      type="checkbox"
                      checked={enableAmmoLidBorder}
                      onChange={(e) => setEnableAmmoLidBorder(e.target.checked)}
                      className="form-checkbox h-4 w-4 text-[#f43f5e] rounded bg-[#090d16] border-[#1e293b] focus:ring-[#f43f5e] focus:ring-offset-[#0f172a]"
                    />
                    <span className="text-xs text-[#cbd5e1] font-medium tracking-wide">
                      Draw Accent Border on Lid
                    </span>
                  </div>
                </div>
              </div>
            ) : activeTab === 'cargo' ? (
            /* ==========================================
               THE CARGO MATRIX SIDEBAR CONTROLS
            ========================================== */
            <div className="space-y-3.5">
              {/* 4 CARGO MATRIX PRESET SIZES */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#94a3b8] px-0.5">
                  <span className="font-bold uppercase tracking-wider text-[#38bdf8]">
                    {isEtsyMode ? 'Select Etsy Case Size:' : 'Preset Case Sizes:'}
                  </span>
                  <span className="text-[#fecdd3] font-semibold">
                    {CARGO_PRESETS[cargoPreset]?.summary || 'Custom Size'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {Object.keys(CARGO_PRESETS).map((presetKey) => (
                    <button
                      key={presetKey}
                      onClick={() => applyCargoPreset(presetKey)}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition-all ${
                        cargoPreset === presetKey
                          ? 'bg-[#3b1526] border-[#f43f5e]/80 text-[#fecdd3] shadow'
                          : 'bg-[#0f172a] border-[#1e293b] text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      {presetKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* CUSTOM LID TEXT & BORDER */}
              <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#38bdf8] flex items-center gap-1.5">
                    <Tag size={13} /> Custom Lid Text &amp; Frame
                  </span>
                  <button
                    type="button"
                    onClick={() => setFoldAngle(foldAngle > 90 ? 25 : 180)}
                    className="px-2 py-0.5 rounded bg-[#3b1526] border border-[#f43f5e]/50 text-[10px] font-bold text-[#fecdd3]"
                  >
                    {foldAngle > 90 ? 'Open Box (25°)' : 'Close Lid (180°)'}
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <label>Lid Inlay Text</label>
                    <span className="text-[10px] font-mono text-[#38bdf8]">
                      {cargoText.length} / {cargoMaxLidChars} chars
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={cargoMaxLidChars}
                    value={cargoText}
                    onChange={(e) => setCargoText(e.target.value.slice(0, cargoMaxLidChars))}
                    placeholder={`Enter custom lid text (max ${cargoMaxLidChars} chars)...`}
                    className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#38bdf8]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Font Family</span>
                  <select
                    value={cargoFont}
                    onChange={(e) => setCargoFont(e.target.value)}
                    className="bg-[#0b0f19] border border-[#1e293b] rounded-lg px-2.5 py-1 text-xs text-white"
                  >
                    <option value="Impact">Impact Heavy</option>
                    <option value="Inter">Inter Bold</option>
                    <option value="JetBrains Mono">JetBrains Mono</option>
                    <option value="Arial Black">Arial Black</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#1e293b]">
                  <span className="text-xs font-semibold flex items-center">
                    Lid Rectangular Border Frame
                    <InfoPopover
                      title="Flush Inlay Border Frame"
                      text="Adds a 2mm wide rectangular border around the outer lid perimeter using the same flush multi-color inlay as your text."
                    />
                  </span>
                  <button
                    type="button"
                    onClick={() => setCargoBorder(!cargoBorder)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      cargoBorder ? 'bg-[#f43f5e]' : 'bg-[#334155]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        cargoBorder ? 'translate-x-4' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* DIMENSIONS & COMPARTMENTS */}
              <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-3.5 space-y-3.5">
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#38bdf8] flex items-center gap-1.5">
                  <Box size={13} /> {isEtsyMode ? 'Interior Compartment Grid' : 'Dimensions & Compartments'}
                </div>

                {isEtsyMode ? (
                  <div className="p-2.5 rounded-lg bg-[#151e31] border border-[#1e293b] text-[11px] text-[#cbd5e1] flex items-center justify-between">
                    <span>Preset Case ({cargoPreset}):</span>
                    <span className="font-mono font-bold text-[#38bdf8]">
                      {cargoWidth}W × {cargoLength}L × {cargoHeight * 2}H mm
                    </span>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold">↔ Box Width (X)</span>
                        <span className="text-[#fecdd3] font-bold">{cargoWidth} mm</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="220"
                        value={cargoWidth}
                        onChange={(e) => {
                          setCargoPreset('Custom');
                          setCargoWidth(parseInt(e.target.value, 10));
                        }}
                        className="w-full box-studio-slider"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold">↗ Box Length (Y)</span>
                        <span className="text-[#fecdd3] font-bold">{cargoLength} mm</span>
                      </div>
                      <input
                        type="range"
                        min="40"
                        max="180"
                        value={cargoLength}
                        onChange={(e) => {
                          setCargoPreset('Custom');
                          setCargoLength(parseInt(e.target.value, 10));
                        }}
                        className="w-full box-studio-slider"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold">↕ Total Case Height (Z)</span>
                        <span className="text-[#fecdd3] font-bold">{cargoHeight * 2} mm (12mm Lid, {cargoHeight * 2 - 12}mm Base)</span>
                      </div>
                      <input
                        type="range"
                        min="24"
                        max="100"
                        step="2"
                        value={cargoHeight * 2}
                        onChange={(e) => {
                          setCargoPreset('Custom');
                          setCargoHeight(parseInt(e.target.value, 10) / 2);
                        }}
                        className="w-full box-studio-slider"
                      />
                    </div>
                  </>
                )}

                {/* Compartment Grid Sliders (Available in BOTH Etsy & Direct Modes) */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#1e293b]">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">Columns (X)</span>
                      <span className="text-[#38bdf8] font-bold">{cargoCompX}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      value={cargoCompX}
                      onChange={(e) => setCargoCompX(parseInt(e.target.value, 10))}
                      className="w-full box-studio-slider"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold">Rows (Y)</span>
                      <span className="text-[#38bdf8] font-bold">{cargoCompY}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      value={cargoCompY}
                      onChange={(e) => setCargoCompY(parseInt(e.target.value, 10))}
                      className="w-full box-studio-slider"
                    />
                  </div>
                </div>
              </div>

              {/* CARGO MATRIX COLORS (13 SWATCHES) */}
              <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-3.5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#38bdf8] flex items-center gap-1.5">
                    <Palette size={13} /> Colors Swatches
                  </span>
                </div>

                <div>
                  <div className="text-xs font-semibold mb-1.5">
                    1. Box Body &amp; Hinges: <span className="text-[#fecdd3]">{activeCargoBoxColor?.name}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {BAMBU_PETG_COLORS.map((col) => (
                      <button
                        key={`cb_${col.id}`}
                        onClick={() => setCargoBoxColorId(col.id)}
                        className={`p-1 rounded border flex flex-col items-center gap-1 ${
                          cargoBoxColorId === col.id ? 'border-[#f43f5e] bg-[#3b1526]/60' : 'border-[#1e293b] bg-[#151e31]'
                        }`}
                      >
                        <span className="w-full h-3.5 rounded-sm" style={{ backgroundColor: col.hex }} />
                        <span className="text-[9px] truncate w-full text-center">{col.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold mb-1.5">
                    2. Lid Text &amp; Frame Inlay: <span className="text-[#38bdf8]">{activeCargoTextColor?.name}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {BAMBU_PETG_COLORS.map((col) => (
                      <button
                        key={`ct_${col.id}`}
                        onClick={() => setCargoTextColorId(col.id)}
                        className={`p-1 rounded border flex flex-col items-center gap-1 ${
                          cargoTextColorId === col.id ? 'border-[#f43f5e] bg-[#3b1526]/60' : 'border-[#1e293b] bg-[#151e31]'
                        }`}
                      >
                        <span className="w-full h-3.5 rounded-sm" style={{ backgroundColor: col.hex }} />
                        <span className="text-[9px] truncate w-full text-center">{col.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold mb-1.5">
                    3. Cam Latches: <span className="text-[#38bdf8]">{activeCargoLatchColor?.name}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {BAMBU_PETG_COLORS.map((col) => (
                      <button
                        key={`cl_${col.id}`}
                        onClick={() => setCargoLatchColorId(col.id)}
                        className={`p-1 rounded border flex flex-col items-center gap-1 ${
                          cargoLatchColorId === col.id ? 'border-[#f43f5e] bg-[#3b1526]/60' : 'border-[#1e293b] bg-[#151e31]'
                        }`}
                      >
                        <span className="w-full h-3.5 rounded-sm" style={{ backgroundColor: col.hex }} />
                        <span className="text-[9px] truncate w-full text-center">{col.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* STICKY FOOTER */}
        <div className="shrink-0 p-3 pb-4 md:p-3.5 bg-[#0f172a] border-t border-[#1e293b] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#94a3b8]">
              {activeTab === 'bench'
                ? `${tiers} Tiers • ${tiers * drawersPerTier} Drawers`
                : activeTab === 'ammo'
                  ? `${ammoShellX}×${ammoShellY}×${ammoShellZ}mm • ${ammoTotalRounds} Rds (${currentCalSpec.short})`
                  : `${cargoWidth}×${cargoLength}×${cargoHeight * 2}mm • ${cargoCompX * cargoCompY} Cells`}
            </span>
            {isEtsyMode ? (
              <span className="px-2.5 py-0.5 rounded bg-[#3b1526] border border-[#f43f5e]/60 text-xs font-bold text-[#fecdd3]">
                Etsy Tier: {activeTab === 'bench' ? sizePreset : activeTab === 'ammo' ? `${ammoTotalRounds} Rds` : cargoPreset}
              </span>
            ) : (
              <span className="text-lg font-black text-[#38bdf8]">${calculatePrice().toFixed(2)}</span>
            )}
          </div>

          <button
            onClick={handleOpenSpecModal}
            className="w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-[#f43f5e] hover:bg-[#fb7185] text-white shadow-lg"
          >
            <FileText size={15} />{' '}
            {isEtsyMode
              ? `Get Etsy Design Code (${
                  activeTab === 'bench'
                    ? sizePreset
                    : activeTab === 'ammo'
                    ? `${ammoTotalRounds} Rds ${currentCalSpec.short}`
                    : cargoPreset
                })`
              : `Review Spec & Checkout ($${calculatePrice().toFixed(2)})`}
          </button>
        </div>
      </aside>

      {/* RIGHT 3D VIEWPORT */}
      <main className="flex-1 h-[44dvh] md:h-full min-h-0 flex flex-col relative bg-[#0d121d] overflow-hidden">
        {statusBanner && (
          <div
            className={`px-4 py-2 text-xs font-semibold flex items-center justify-between ${
              statusBanner.type === 'error' ? 'bg-red-900/90 text-red-100' : 'bg-emerald-900/90 text-emerald-100'
            }`}
          >
            <span>{statusBanner.text}</span>
            <button onClick={() => setStatusBanner(null)} className="ml-4 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* ADD shrink-0 HERE AND REMOVE overflow-hidden */}
        <header className="relative shrink-0 bg-[#0f172a] border-b border-[#1e293b] px-2.5 md:px-4 py-2.5 flex flex-col gap-2.5 z-20">
  
          {/* TOP ROW: Logo on left, Bug Report on right */}
          <div className="flex items-center justify-between w-full shrink-0">
            
            <img
              src="/textlogo.png"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/favicon.png';
              }}
              alt="FieldMatrix Logo"
              className="h-8 w-auto max-w-[220px] object-contain drop-shadow pointer-events-none"
            />
            
            {/* ---> BUG REPORT BUTTON <--- */}
            <a
              href={getBugReportMailto()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              title="Report an issue or bug with this configuration or this page"
            >
              <svg 
                className="w-3.5 h-3.5 text-amber-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="hidden sm:inline">Report a Bug</span>
            </a>

          </div>

          {/* BOTTOM ROW: Controls pushed down safely in a scrollable bar */}
          <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap pb-1 w-full scrollbar-thin scrollbar-thumb-[#1e293b]">
            
            <span className="text-xs font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <Sparkles size={14} /> 3D Preview
            </span>

            {activeTab !== 'ammo' && (
              activeTab === 'bench' ? (
                <div className="flex items-center gap-2 bg-[#151e31] px-2.5 py-1 rounded-lg border border-[#1e293b] shrink-0">
                  <span className="text-[11px] font-semibold tabular-nums min-w-[115px]">
                    Swing Drawers ({Math.round(swingOpenAmount * 100)}%):
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={swingOpenAmount}
                    onChange={(e) => setSwingOpenAmount(parseFloat(e.target.value))}
                    className="w-24 box-studio-slider"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-[#151e31] px-2.5 py-1 rounded-lg border border-[#1e293b] shrink-0">
                  <span className="text-[11px] font-semibold tabular-nums min-w-[98px]">
                    Lid Hinge ({foldAngle}°):
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="110"
                    step="5"
                    value={foldAngle}
                    onChange={(e) => setFoldAngle(parseInt(e.target.value, 10))}
                    className="w-24 box-studio-slider"
                  />
                </div>
              )
            )}

            {/* Flexible spacer to push the right-side buttons nicely */}
            <div className="flex-1 min-w-[20px]"></div>

            {activeTab === 'bench' && (
              <>
                <button
                  onClick={() => setExplodedView(!explodedView)}
                  className={`px-2 py-1 rounded text-xs border shrink-0 ${
                    explodedView ? 'bg-[#3b1526] border-[#f43f5e] text-[#fecdd3]' : 'bg-[#151e31] border-[#1e293b] text-[#94a3b8]'
                  }`}
                >
                  Exploded
                </button>
                <button
                  onClick={() => setXrayMode(!xrayMode)}
                  className={`px-2 py-1 rounded text-xs border shrink-0 ${
                    xrayMode ? 'bg-[#3b1526] border-[#f43f5e] text-[#fecdd3]' : 'bg-[#151e31] border-[#1e293b] text-[#94a3b8]'
                  }`}
                >
                  X-Ray
                </button>
              </>
            )}
            
            <button
              onClick={() => setShowDimensions(!showDimensions)}
              className={`px-2 py-1 rounded text-xs border flex items-center gap-1 shrink-0 ${
                showDimensions ? 'bg-[#38bdf8]/15 border-[#38bdf8] text-[#38bdf8]' : 'bg-[#151e31] border-[#1e293b] text-[#94a3b8]'
              }`}
            >
              <Eye size={12} /> Dimensions
            </button>
            
            <button
              onClick={fitCameraToModel}
              className="px-2 py-1 rounded text-xs bg-[#151e31] border border-[#1e293b] text-[#e2e8f0] flex items-center gap-1 shrink-0"
            >
              <Maximize2 size={12} /> Fit
            </button>
            
            <button
              onClick={() => {
                setSwingOpenAmount(0);
                setOpenDrawersMap({});
                setFoldAngle(35);
                setAmmoHingeAngle(0);
                fitCameraToModel();
              }}
              className="px-2 py-1 rounded text-xs bg-[#151e31] border border-[#1e293b] text-[#94a3b8] flex items-center gap-1 shrink-0"
            >
              <RotateCcw size={12} /> Reset
            </button>

            {activeTab === 'ammo' && (
              <>
                <div className="flex items-center gap-2 px-3 py-1 rounded border bg-[#151e31] border-[#1e293b] text-xs text-[#94a3b8] shrink-0">
                  <span className="uppercase tracking-wider text-[10px] font-bold tabular-nums min-w-[102px]">
                    Lid Hinge ({ammoHingeAngle}°)
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={110}
                    step={5}
                    value={ammoHingeAngle}
                    onChange={(e) => setAmmoHingeAngle(Number(e.target.value))}
                    className="w-24 accent-amber-500 cursor-pointer"
                  />
                </div>
                
                <div className="flex items-center gap-1 px-1 py-1 rounded border bg-[#151e31] border-[#1e293b] shrink-0">
                  <span className="text-[#94a3b8] text-[10px] uppercase font-bold tracking-wider px-2">Tray:</span>
                  {['seated', 'extracted', 'bench'].map((pose) => (
                    <button
                      key={pose}
                      onClick={() => setAmmoTrayPose(pose)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
                        ammoTrayPose === pose
                          ? 'bg-amber-500 text-slate-900'
                          : 'text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      {pose === 'seated' ? 'Seated' : pose === 'extracted' ? 'Extracted' : 'Bench'}
                    </button>
                  ))}
                </div>
                
                <label className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded border bg-[#151e31] border-[#1e293b] shrink-0">
                  <input
                    type="checkbox"
                    checked={showAmmoRounds}
                    onChange={(e) => setShowAmmoRounds(e.target.checked)}
                    className="accent-amber-500"
                  />
                  <span className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">Show Rounds</span>
                </label>
                
                <label className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded border bg-[#151e31] border-[#1e293b] shrink-0">
                  <input
                    type="checkbox"
                    checked={showMagnetXray}
                    onChange={(e) => setShowMagnetXray(e.target.checked)}
                    className="accent-cyan-500"
                  />
                  <span className="text-cyan-400 text-[10px] font-bold uppercase tracking-wider">Magnet X-Ray</span>
                </label>
              </>
            )}
          </div>
        </header>

        <div ref={mountRef} className="flex-1 w-full min-h-0 relative overflow-hidden cursor-grab active:cursor-grabbing touch-none" />
      </main>
    </div>
  );
}