import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAuth, signInAnonymously } from 'firebase/auth';
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
    height: 14.0
  },
  Trail: {
    id: 'Trail',
    label: 'Trail',
    summary: '2 Tiers • 4 Drawers/Tier (8 Total)',
    tiers: 2,
    drawersPerTier: 4,
    width: 140,
    depth: 110,
    height: 15.5
  },
  Pursuit: {
    id: 'Pursuit',
    label: 'Pursuit',
    summary: '2 Tiers • 5 Drawers/Tier (10 Total)',
    tiers: 2,
    drawersPerTier: 5,
    width: 165,
    depth: 120,
    height: 17.0
  },
  Frontier: {
    id: 'Frontier',
    label: 'Frontier',
    summary: '3 Tiers • 5 Drawers/Tier (15 Total)',
    tiers: 3,
    drawersPerTier: 5,
    width: 185,
    depth: 120,
    height: 18.0
  }
};

const CARGO_PRESETS = {
  Trace: {
    id: 'Trace',
    label: 'Trace',
    summary: '80×60×16mm (32mm Closed)',
    width: 80,
    length: 60,
    height: 16,
    compX: 2,
    compY: 1
  },
  Trail: {
    id: 'Trail',
    label: 'Trail',
    summary: '120×90×20mm (40mm Closed)',
    width: 120,
    length: 90,
    height: 20,
    compX: 2,
    compY: 2
  },
  Pursuit: {
    id: 'Pursuit',
    label: 'Pursuit',
    summary: '160×120×25mm (50mm Closed)',
    width: 160,
    length: 120,
    height: 25,
    compX: 3,
    compY: 2
  },
  Frontier: {
    id: 'Frontier',
    label: 'Frontier',
    summary: '200×150×35mm (70mm Closed)',
    width: 200,
    length: 150,
    height: 35,
    compX: 4,
    compY: 3
  }
};

// ==========================================
// 3. MODULAR PRODUCT CATALOG REGISTRY
// ==========================================
const PRODUCT_CATALOG = {
  storage: {
    id: 'storage',
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

  if (typeof window !== 'undefined' && RECAPTCHA_V3_SITE_KEY) {
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
          className="absolute left-0 bottom-full mb-2 w-64 p-3 rounded-lg bg-[#0f172a] border border-[#38bdf8]/50 shadow-2xl z-50 text-left pointer-events-auto"
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
    const fontSize = clean.length > 16 ? 40 : clean.length > 11 ? 52 : 64;
    ctx.font = `700 ${fontSize}px "${fontName}", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(clean, canvas.width / 2, canvas.height / 2 + 2);
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
    ctx.strokeStyle = textHex;
    ctx.lineWidth = 18;
    ctx.strokeRect(38, 38, canvas.width - 76, canvas.height - 76);
  }

  if (text && text.trim() !== '') {
    const clean = text.trim();
    ctx.fillStyle = textHex;
    const fontSize = clean.length > 16 ? 78 : clean.length > 10 ? 105 : 132;
    ctx.font = `900 ${fontSize}px "${fontName}", "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(clean, canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createBadgeTexture({
  caliberSpec,
  customText,
  showRoundCount = true,
  fontFamily = 'Impact',
  lidColorHex = '#222222',
  accentColorHex = '#F36B21',
  rounds = 50
}) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Fill Background
  ctx.fillStyle = lidColorHex;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Border
  ctx.strokeStyle = accentColorHex;
  ctx.lineWidth = 16;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

  ctx.fillStyle = accentColorHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Safely handle the text string
  let title = '';
  if (customText !== undefined && customText !== null) {
      title = String(customText).trim();
  } else if (caliberSpec && caliberSpec.short) {
      title = String(caliberSpec.short).trim();
  }

  const sub = showRoundCount ? `${rounds} RDS` : '';

  // Only attempt to draw text if the string is not empty
  if (title.length > 0) {
    const titleSize = title.length > 14 ? 90 : title.length > 8 ? 120 : 150;
    ctx.font = `900 ${titleSize}px "${fontFamily}", "Arial Black", sans-serif`;
    ctx.fillText(title, canvas.width / 2, sub.length > 0 ? canvas.height * 0.42 : canvas.height * 0.5);
  }

  if (sub.length > 0) {
    ctx.font = title.length > 0 ? `700 68px monospace` : `700 110px monospace`;
    ctx.fillText(sub, canvas.width / 2, title.length > 0 ? canvas.height * 0.75 : canvas.height * 0.5);
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
  const [activeTab, setActiveTab] = useState('storage');
  const [isSuccessPage, setIsSuccessPage] = useState(false);
  useEffect(() => {
    if (window.location.pathname === '/success') {
      setIsSuccessPage(true);
    }
  }, []);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [designCode, setDesignCode] = useState('');
  // Auto-update the design code prefix whenever you switch tabs
  useEffect(() => {
    setDesignCode((prev) => {
      // Keep your existing 6 random characters, or generate them if it's the first load
      const suffix = prev.includes('-') 
        ? prev.split('-')[1] 
        : Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Grab the correct prefix (AMMO-, CARGO-, or BENCH-) straight from your catalog
      return `${PRODUCT_CATALOG[activeTab].codePrefix}${suffix}`;
    });
  }, [activeTab]);
  const [adminMode, setAdminMode] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState(false);
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
  
  // Colors are stored as hex strings from the BAMBU_PETG_COLORS array
  const [ammoBaseColor, setAmmoBaseColor] = useState(BAMBU_PETG_COLORS.find(c => c.id === 'petg-pine-green')?.hex || '#2C4C3B');
  const [ammoLidColor, setAmmoLidColor] = useState(BAMBU_PETG_COLORS.find(c => c.id === 'petg-black')?.hex || '#222222');
  const [ammoTrayColor, setAmmoTrayColor] = useState(BAMBU_PETG_COLORS.find(c => c.id === 'petg-dark-beige')?.hex || '#9E8569');
  const [ammoAccentColor, setAmmoAccentColor] = useState(BAMBU_PETG_COLORS.find(c => c.id === 'petg-orange')?.hex || '#F36B21');

  // Text & Viewport States
  const [ammoLidTitle, setAmmoLidTitle] = useState('9MM');
  const [showAmmoRoundCount, setShowAmmoRoundCount] = useState(true);
  const [ammoHingeAngle, setAmmoHingeAngle] = useState(0); 
  const [ammoTrayPose, setAmmoTrayPose] = useState('seated'); // 'seated', 'extracted', 'bench'
  const [showAmmoRounds, setShowAmmoRounds] = useState(true);
  const [showMagnetXray, setShowMagnetXray] = useState(false);

  // Derived Ammo Matrix Geometry
  const currentCalSpec = AMMO_CALIBERS[ammoCaliber] || AMMO_CALIBERS['22lr'];
  const maxSafeGrid = Math.min(25, Math.floor((236 - 19.2) / currentCalSpec.pitch));
  const clampedAmmoCols = Math.min(Math.max(3, ammoCols), maxSafeGrid);
  const clampedAmmoRows = Math.min(Math.max(3, ammoRows), maxSafeGrid);
  const ammoTotalRounds = clampedAmmoCols * clampedAmmoRows;

  // Standing Tray & Exterior Shell Millimeter Math
  const ammoTrayX = Number((clampedAmmoCols * currentCalSpec.pitch + 6.4).toFixed(1));
  const ammoTrayY = Number((clampedAmmoRows * currentCalSpec.pitch + 6.4).toFixed(1));
  const ammoTrayZ = currentCalSpec.trayZ;

  const ammoShellX = Number((ammoTrayX + 12.8).toFixed(1));
  const ammoShellY = Number((ammoTrayY + 12.8).toFixed(1));
  const ammoShellZ = currentCalSpec ? Math.max(currentCalSpec.shellZ, Math.ceil(currentCalSpec.oal + 14.5)) : 40.5;

  // Magnet scaling: 4 pairs (8 magnets) under 150mm, 6 pairs (12 magnets) at or above 150mm
  const ammoMagnetPairs = ammoShellX >= 150 ? 6 : 4;
  const ammoTotalMagnets = ammoMagnetPairs * 2;

  // Dynamic Lid Character Limit based on physical lid width
  const ammoMaxLidChars = Math.max(6, Math.min(28, Math.floor((ammoShellX - 28) / 5.5)));

  // Estimated PETG Mass (grams) & Print Time (hours)
  const ammoEstimatedGrams = Math.round(
    ((ammoShellX * ammoShellY * 3.2 + (ammoShellX + ammoShellY) * 2 * ammoShellZ * 2.8) * 0.00127) +
    ((ammoTrayX * ammoTrayY * ammoTrayZ * 0.38) * 0.00127)
  );
  const ammoEstimatedHours = Number((ammoEstimatedGrams / 28).toFixed(1));

  // Switch caliber helper (clamps grid to P1S bed & updates default lid title)
  const handleSelectAmmoCaliber = (calId) => {
    const nextCal = AMMO_CALIBERS[calId];
    if (!nextCal) return;
    setAmmoCaliber(calId);
    setAmmoLidTitle(nextCal.short);
    const maxSafe = Math.max(3, Math.floor((226 - 20.8) / nextCal.pitch));
    const nextCols = Math.min(ammoCols, maxSafe);
    const nextRows = Math.min(ammoRows, maxSafe);
    setAmmoCols(nextCols);
    setAmmoRows(nextRows);
    
  };

  const handleSelectAmmoPreset = (preset) => {
    setAmmoPreset(preset.id);
    if (preset.cols && preset.rows && currentCalSpec) {
      const nextCols = Math.min(preset.cols, maxSafeGrid);
      const nextRows = Math.min(preset.rows, maxSafeGrid);
      setAmmoCols(nextCols);
      setAmmoRows(nextRows);
      
    }
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

  const ADMIN_SECRET_PIN = '1024';
  const PRODUCT_META = {
  storage: {
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
  const currentProductMeta = PRODUCT_CATALOG[activeTab] || PRODUCT_CATALOG.storage;

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
  const [cargoText, setCargoText] = useState('FIELD KIT');
  const [cargoFont, setCargoFont] = useState('Impact');
  const [cargoBorder, setCargoBorder] = useState(true);
  const [foldAngle, setFoldAngle] = useState(35);


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
      const bKey = BENCH_PRESETS[sizePreset] ? sizePreset : 'Medium';
      applyBenchPreset(bKey);
      const cKey = CARGO_PRESETS[cargoPreset] ? cargoPreset : 'Standard';
      applyCargoPreset(cKey);
    }
  }, [isEtsyMode, sizePreset, cargoPreset, applyBenchPreset, applyCargoPreset]);

  const activeCargoBoxColor = useMemo(
    () => BAMBU_PETG_COLORS.find((c) => c.id === cargoBoxColorId) || BAMBU_PETG_COLORS[7],
    [cargoBoxColorId]
  );
  const activeCargoTextColor = useMemo(
    () => BAMBU_PETG_COLORS.find((c) => c.id === cargoTextColorId) || BAMBU_PETG_COLORS[8],
    [cargoTextColorId]
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
    // Add this safe definition so it never crashes!
    const ammoLidSubtitle = showAmmoRoundCount ? `${ammoTotalRounds} RDS` : '';
    
    if (activeTab === 'storage') {
      const basePrice = 16;
      const volumeFactor = ((width * depth * height) / 25000) * 1.35;
      const totalDrawers = tiers * drawersPerTier;
      const drawersCost = totalDrawers * (1.75 + volumeFactor * 0.45);
      const tierFrameCost = tiers * 4.5;

      let dividerCellsExtra = 0;
      for (let t = 0; t < tiers; t++) {
        for (let b = 0; b < drawersPerTier; b++) {
          const div = getDividerForDrawer(t, b);
          dividerCellsExtra += (div.h - 1 + (div.v - 1)) * 0.5;
        }
      }
      return basePrice + tierFrameCost + drawersCost + dividerCellsExtra;
    } else if (activeTab === 'ammo') {
      const basePrice = 14;
      const vol = (ammoShellX * ammoShellY * ammoShellZ) / 30000;
      const roundsExtra = ammoTotalRounds * 0.08;
      const hardwareExtra = ammoTotalMagnets * 0.25 + 1.5; // 8x3mm magnets + M3x20mm hardware
      const textExtra =
        ammoLidTitle.trim() !== '' || ammoLidSubtitle.trim() !== '' ? 2.5 : 0;
      return basePrice + vol * 2.2 + roundsExtra + hardwareExtra + textExtra;  
    } else {
      const basePrice = 14;
      const vol = (cargoWidth * cargoLength * (cargoHeight * 2)) / 30000;
      const compExtra = (cargoCompX * cargoCompY - 1) * 0.75;
      const textExtra = cargoText.trim() !== '' ? 2.5 : 0;
      return basePrice + vol * 2.2 + compExtra + textExtra;
    }
  };

  const generateAmmoMatrixScad = () => {
    const cal = currentCalSpec || AMMO_CALIBERS['9mm'];
    const baseZ = +(ammoShellZ - 12.0).toFixed(1);
    const magCount = ammoShellX >= 150 ? 12 : 8;
    const twoLatches = ammoShellX >= 130 ? 1 : 0;

    return `// ============================================================================
// FIELD MATRIX // AMMOMATRIX BALLISTIC VAULT — PARAMETRIC OPENSCAD
// Design Code : ${designCode}
// Caliber     : ${cal.name} (${ammoTotalRounds} Rounds: ${clampedAmmoCols}x${clampedAmmoRows})
// Shell Size  : ${ammoShellX} x ${ammoShellY} x ${ammoShellZ} mm
// Tray Size   : ${ammoTrayX} x ${ammoTrayY} x ${ammoTrayZ} mm
// Hardware    : 4x M3x20mm SHCS + 4x M3 Hex Nuts + ${magCount}x (8x3mm) Neodymium Magnets
// ============================================================================

$fn = 48;

// --- 1. PARAMETERS ---
cols = ${clampedAmmoCols};
rows = ${clampedAmmoRows};
hole_dia = ${cal.holeDia};
pitch = ${cal.pitch};

shell_x = ${ammoShellX};
shell_y = ${ammoShellY};
shell_z = ${ammoShellZ};
base_z  = ${baseZ};
lid_z   = 12.0;

wall_t    = 3.2;
floor_t   = 4.2;
corner_r  = 4.0;
rib_t     = 1.8;
rib_w     = 10.0;

tray_x = ${ammoTrayX};
tray_y = ${ammoTrayY};
tray_z = ${ammoTrayZ};
foot_h = 4.5;

mag_dia = 8.15;
mag_h   = 3.15;
m3_bore = 3.2;

lid_title    = "${ammoLidTitle}";
lid_subtitle = "${showAmmoRoundCount ? `${ammoTotalRounds} RDS` : ''}";
two_latches  = ${twoLatches};

// --- 2. MAGNET POSITIONS ---
mx = tray_x / 2 - 7.5;
my = tray_y / 2 - 7.5;
mag_coords = (shell_x >= 150)
    ? [[-mx, -my], [mx, -my], [-mx, my], [mx, my], [0, -my], [0, my]]
    : [[-mx, -my], [mx, -my], [-mx, my], [mx, my]];

latch_coords = (two_latches == 1)
    ? [-shell_x * 0.23, shell_x * 0.23]
    : [0];

// --- 3. ARMORED LOWER SHELL ---
module armored_lower_shell() {
    knuckle_w = min(28, shell_x * 0.22);
    hinge_r   = 4.2;
    hinge_y   = -shell_y / 2 - hinge_r * 0.65;

    difference() {
        union() {
            // Main Rounded Outer Shell
            rounded_box(shell_x, shell_y, base_z, corner_r);

            // Exterior-Only Tactical Ribs (Union BEFORE interior subtraction)
            exterior_ribs(base_z - 2.0);

            // Rear M3 Knuckle Hinge Barrels (Left & Right Base Knuckles)
            for (side = [-1, 1]) {
                translate([side * (knuckle_w * 1.05), hinge_y, base_z])
                    rotate([0, 90, 0])
                    cylinder(r=hinge_r, h=knuckle_w, center=true);
                // Structural hull gusset to back wall
                hull() {
                    translate([side * (knuckle_w * 1.05), hinge_y, base_z])
                        rotate([0, 90, 0])
                        cylinder(r=hinge_r, h=knuckle_w, center=true);
                    translate([side * (knuckle_w * 1.05), -shell_y / 2 + 1.0, base_z - 6.0])
                        cube([knuckle_w, 2.0, 12.0], center=true);
                }
            }

            // Front Cam-Latch Clevis Mounts
            for (lx = latch_coords) {
                for (cx = [-8.5, 8.5]) {
                    translate([lx + cx, shell_y / 2 + 2.75, base_z - 8.0])
                        cube([3.2, 5.5, 12.0], center=true);
                }
            }
        }

        // Subtract Strictly Hollow Interior Cavity (Guarantees ribs never enter interior!)
        translate([0, 0, floor_t])
            rounded_box(shell_x - wall_t * 2, shell_y - wall_t * 2, base_z + 2.0, max(1.0, corner_r - wall_t));

        // Rear M3 Hinge Pin Bore
        translate([0, hinge_y, base_z])
            rotate([0, 90, 0])
            cylinder(d=m3_bore, h=shell_x + 10, center=true);

        // Front M3 Cam-Latch Pivot Pin Bores
        for (lx = latch_coords) {
            translate([lx, shell_y / 2 + 3.5, base_z - 6.0])
                rotate([0, 90, 0])
                cylinder(d=m3_bore, h=28, center=true);
        }

        // Base Floor Embedded Magnet Pockets (Ø8x3mm)
        for (pt = mag_coords) {
            translate([pt[0], pt[1], floor_t - mag_h + 0.05])
                cylinder(d=mag_dia, h=mag_h + 0.1);
        }
    }
}

// --- 4. ARMORED UPPER LID ---
module armored_upper_lid() {
    knuckle_w = min(28, shell_x * 0.22);
    hinge_r   = 4.2;
    hinge_y   = -shell_y / 2 - hinge_r * 0.65;

    difference() {
        union() {
            // Main Rounded Lid Shell
            rounded_box(shell_x, shell_y, lid_z, corner_r);

            // Exterior-Only Lid Tactical Ribs
            exterior_ribs(lid_z - 1.5);

            // Center M3 Hinge Knuckle
            hull() {
                translate([0, hinge_y, 0])
                    rotate([0, 90, 0])
                    cylinder(r=hinge_r, h=knuckle_w - 0.6, center=true);
                translate([0, -shell_y / 2 + 1.0, 4.0])
                    cube([knuckle_w - 0.6, 2.0, 8.0], center=true);
            }

            // Front Upper Latch Catch Hooks
            for (lx = latch_coords) {
                translate([lx, shell_y / 2 + 2.2, 3.25])
                    cube([13.0, 4.5, 6.5], center=true);
            }
        }

        // Subtract Hollow Lid Interior
        translate([0, 0, -0.1])
            rounded_box(shell_x - wall_t * 2, shell_y - wall_t * 2, lid_z - 3.0, max(1.0, corner_r - wall_t));

        // Center Hinge M3 Pin Bore
        translate([0, hinge_y, 0])
            rotate([0, 90, 0])
            cylinder(d=m3_bore, h=knuckle_w + 6, center=true);

        // Recessed Top Badge Cavity & Text Inlay
        translate([0, 4, lid_z - 0.8])
            linear_extrude(1.0)
            text(lid_title, size=min(14, shell_x * 0.09), font="Impact:style=Bold", halign="center", valign="center");
        translate([0, -shell_y * 0.18, lid_z - 0.8])
            linear_extrude(1.0)
            text(lid_subtitle, size=min(8, shell_x * 0.05), font="Liberation Mono:style=Bold", halign="center", valign="center");
    }
}

// --- 5. REMOVABLE MAGNETIC STANDING TRAY ---
module standing_ammo_tray() {
    start_x = -((cols - 1) * pitch) / 2;
    start_y = -((rows - 1) * pitch) / 2;

    difference() {
        union() {
            // Main Tray Block raised by foot_h
            translate([0, 0, foot_h])
                rounded_box(tray_x, tray_y, tray_z, 2.5);

            // Tapered Magnetic Standoff Feet
            for (pt = mag_coords) {
                translate([pt[0], pt[1], 0])
                    cylinder(r1=6.5, r2=7.25, h=foot_h + 0.2);
            }
        }

        // Precision Cartridge Bores
        for (c = [0 : cols - 1]) {
            for (r = [0 : rows - 1]) {
                translate([start_x + c * pitch, start_y + r * pitch, foot_h + 1.5])
                    cylinder(d=hole_dia, h=tray_z);
            }
        }

        // Underside Foot Magnet Pockets (Ø8x3mm)
        for (pt = mag_coords) {
            translate([pt[0], pt[1], -0.05])
                cylinder(d=mag_dia, h=mag_h + 0.1);
        }
    }
}

// --- 6. HELPER: ROUNDED BOX, EXTERIOR RIBS & CAM LATCH ---
module rounded_box(w, l, h, r) {
    hull() {
        for (dx = [-w / 2 + r, w / 2 - r]) {
            for (dy = [-l / 2 + r, l / 2 - r]) {
                translate([dx, dy, 0])
                    cylinder(r=r, h=h);
            }
        }
    }
}

module exterior_ribs(h) {
    for (dir = [-1, 1]) {
        // Left & Right Exterior Vertical Ribs
        translate([-shell_x / 2 - rib_t / 2, dir * (shell_y * 0.26), h / 2])
            cube([rib_t, rib_w, h], center=true);
        translate([shell_x / 2 + rib_t / 2, dir * (shell_y * 0.26), h / 2])
            cube([rib_t, rib_w, h], center=true);

        // Front & Back Exterior Vertical Ribs
        translate([dir * (shell_x * 0.36), shell_y / 2 + rib_t / 2, h / 2])
            cube([rib_w, rib_t, h], center=true);
        translate([dir * (shell_x * 0.36), -shell_y / 2 - rib_t / 2, h / 2])
            cube([rib_w, rib_t, h], center=true);
    }
}

module tactical_cam_latch() {
    difference() {
        union() {
            cube([13.2, 22.0, 4.2], center=true);
            translate([0, -9.25, 1.3])
                cube([13.2, 3.5, 6.8], center=true);
        }
        translate([0, 7.0, 0])
            rotate([0, 90, 0])
            cylinder(d=m3_bore, h=16, center=true);
    }
}

// --- 7. ASSEMBLY / BUILD PLATE LAYOUT ---
armored_lower_shell();

translate([0, shell_y + 28, lid_z])
    rotate([180, 0, 0])
    armored_upper_lid();

translate([shell_x + 28, 0, 0])
    standing_ammo_tray();

for (i = [0 : len(latch_coords) - 1]) {
    translate([shell_x + 28 + i * 22, -shell_y / 2 - 20, 2.1])
        tactical_cam_latch();
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
        activeTab === 'storage'
          ? `${sizePreset} (${tiers}T x ${drawersPerTier}D)`
          : activeTab === 'ammo'
          ? `${ammoPreset} Rounds (${clampedAmmoCols}x${clampedAmmoRows} ${currentCalSpec.short})`
          : `${cargoSizePreset}`; // (or whatever variable sits at the end of your existing line)
      spec += `Etsy Option  : ${etsyOptLabel}\n\n`;
    } else {
      spec += `Est. Price   : $${calculatePrice().toFixed(2)}\n\n`;
    }

    if (activeTab === 'ammo') {
      const getPetgName = (hex) => BAMBU_PETG_COLORS.find((c) => c.hex === hex)?.name || hex;
      const magCount = ammoShellX >= 150 ? 12 : 8; // <-- ADD THIS LINE

      spec += `[ 1. PRINT & SHIP SPECIFICATIONS — BALLISTIC VAULT ]\n`;
      spec += `- Caliber           : ${currentCalSpec.name} (${currentCalSpec.short})\n`;
      spec += `- Capacity          : ${ammoTotalRounds} Rounds (${clampedAmmoCols} Cols x ${clampedAmmoRows} Rows)\n`;
      spec += `- Exterior Shell    : ${ammoShellX} x ${ammoShellY} x ${ammoShellZ} mm\n`;
      spec += `- Standing Tray     : ${ammoTrayX} x ${ammoTrayY} x ${ammoTrayZ} mm\n`;
      spec += `- Bore & Pitch      : Ø${currentCalSpec.holeDia} mm Hole / ${currentCalSpec.pitch} mm Pitch\n`;
      spec += `- Hardware BOM      : 4x M3x20mm SHCS, 4x M3 Hex Nuts, ${magCount}x (8x3mm) Magnets\n`;
      spec += `- Base / Lid Color  : ${getPetgName(ammoBaseColor)} (${ammoBaseColor}) / ${getPetgName(ammoLidColor)} (${ammoLidColor})\n`;
      spec += `- Tray / Accent     : ${getPetgName(ammoTrayColor)} (${ammoTrayColor}) / ${getPetgName(ammoAccentColor)} (${ammoAccentColor})\n`;
      spec += `- Lid Inlay Text    : "${ammoLidTitle}"${showAmmoRoundCount ? ` / "${ammoTotalRounds} RDS"` : ' (Round Count Off)'}\n`;
    } else if (activeTab === 'storage') {
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
      spec += `- Custom Lid Text    : "${cargoText.trim() || '(None)'}"\n`;
      spec += `- Lid Font Style     : ${cargoFont}\n`;
      spec += `- Lid Border Inlay   : ${cargoBorder ? 'YES (Flush Inlay Frame)' : 'NO'}\n`;
    }
    return spec;
  };

  // ==========================================
  // BAMBU P1S V12 PARAMETRIC OPENSCAD GENERATOR FOR CARGO MATRIX
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
    const maxChars = Math.max(line1.length, line2.length, 4);
    const wall = 2.0;
    const gap = 1.6;
    const innerW = cargoWidth - wall * 2 - 14;
    const innerL = cargoLength - wall * 2 - 14;
    const computedFontSize = Math.min(
      (innerW / maxChars) * 1.38,
      line2 ? innerL * 0.24 : innerL * 0.34,
      22
    );
    const fontSizeMm = Math.max(5.5, computedFontSize).toFixed(2);

    return `// =========================================================================
// FIELDMATRIX 3D - THE CARGO MATRIX (PRINT-IN-PLACE CLAMSHELL V12)
// Design Code : ${designCode || 'CUSTOM'}
// Preset Tier : ${cargoPreset}
// Dimensions  : ${cargoWidth}mm (W) x ${cargoLength}mm (L) x ${cargoHeight}mm (Half-H) / ${cargoHeight * 2}mm (Closed)
// Grid Layout : ${cargoCompX} Columns (X) x ${cargoCompY} Rows (Y) (${cargoCompX * cargoCompY} Compartments)
// Colors      : Body=${activeCargoBoxColor.name} (${activeCargoBoxColor.hex}) | Inlay=${activeCargoTextColor.name} (${activeCargoTextColor.hex})
// Lid Inlay   : Text="${cleanLine1}${cleanLine2 ? ' / ' + cleanLine2 : ''}" | Font=${cargoFont} | Border=${cargoBorder ? 'YES' : 'NO'}
// Export Mode : ${mode.toUpperCase()}
// =========================================================================

export_part = "${mode}";

width = ${cargoWidth};
length = ${cargoLength};
height = ${cargoHeight};
wall = ${wall};
compX = ${cargoCompX};
compY = ${cargoCompY};
gap = ${gap};
$fn = 64;

box_color  = "${activeCargoBoxColor.hex}";
text_color = "${activeCargoTextColor.hex}";
box_text_1 = "${cleanLine1}";
box_text_2 = "${cleanLine2}";
text_size  = ${fontSizeMm};
font_style = "${cargoFont}:style=Bold";
enable_lid_border = ${cargoBorder ? 'true' : 'false'};
border_inset = 5.0;
border_line_w = 2.0;

num_k     = 5;
k_span    = width / num_k;
hr        = 3.20;
pin_r     = 1.33;
bore_r    = 1.65;
k_tol     = 0.35;
shell_clr = 0.65;
gusset_h  = 4.8;

base_indices = [-2, 0, 2];
lid_indices  = [-1, 1];

module render_lid_text() {
    if (box_text_1 != "") {
        mirror([0, 1, 0]) {
            if (box_text_2 == "") {
                text(box_text_1, font=font_style, size=text_size, halign="center", valign="center");
            } else {
                line_step = text_size * 1.35;
                translate([0,  line_step/2, 0])
                    text(box_text_1, font=font_style, size=text_size, halign="center", valign="center");
                translate([0, -line_step/2, 0])
                    text(box_text_2, font=font_style, size=text_size, halign="center", valign="center");
            }
        }
    }
    if (enable_lid_border) {
        bw = width - border_inset * 2;
        bl = length - border_inset * 2;
        difference() {
            square([bw, bl], center = true);
            square([bw - border_line_w * 2, bl - border_line_w * 2], center = true);
        }
    }
}

module complete_model() {
    if (export_part == "hinge") {
        intersection() {
            box_body_assembly();
            translate([0, 0, height]) cube([width + 2, 24, height*2.5], center=true);
        }
    } else if (export_part == "latch") {
        intersection() {
            box_body_assembly();
            armW = max(16.0, width / 4.0);
            translate([0, 0, height]) cube([armW + 8, length*2 + 20, height*2.5], center=true);
        }
    } else if (export_part == "box_only") {
        box_body_assembly();
    } else if (export_part == "text_only") {
        text_inlay_assembly();
    } else {
        box_body_assembly();
        text_inlay_assembly();
    }
}

module box_body_assembly() {
    color(box_color) {
        union() {
            difference() {
                union() {
                    translate([0, -length/2 - gap/2, 0]) base_box();
                    build_base_hinges();
                }
                for(i = lid_indices) {
                    knuckle_cradle_cutter(i * k_span, is_base_side = true);
                }
            }
            translate([0, 0, height])
            rotate([0, 90, 0])
            cylinder(r=pin_r, h=width - k_tol, center=true);
        }

        difference() {
            union() {
                translate([0, length/2 + gap/2, 0]) lid_box();
                build_lid_hinges();
            }
            for(i = base_indices) {
                knuckle_cradle_cutter(i * k_span, is_base_side = false);
            }
            for(i = lid_indices) {
                translate([i * k_span, 0, 0])
                lid_bore_tunnel(bore_r, k_span + 0.2);
            }
        }
    }
}

module text_inlay_assembly() {
    if (box_text_1 != "" || enable_lid_border) {
        color(text_color)
        translate([0, length/2 + gap/2, 0])
        linear_extrude(0.60)
        render_lid_text();
    }
}

module lid_bore_tunnel(r, len) {
    translate([0, 0, height])
    rotate([90, 0, 90])
    linear_extrude(len, center=true)
    union() {
        circle(r=r, $fn=48);
        polygon([
            [-r * 0.7071, r * 0.7071],
            [0,           r * 1.32],
            [ r * 0.7071, r * 0.7071]
        ]);
    }
}

module knuckle_cradle_cutter(x_pos, is_base_side) {
    cut_w = k_span;
    cut_r = hr + shell_clr;
    y_dir = is_base_side ? -1 : 1;

    translate([x_pos, 0, height]) {
        hull() {
            rotate([0, 90, 0]) cylinder(r=cut_r, h=cut_w, center=true);
            translate([0, 0, cut_r]) rotate([0, 90, 0]) cylinder(r=cut_r, h=cut_w, center=true);
            translate([0, y_dir * (gap/2 + 0.6), -cut_r - 1.2]) rotate([0, 90, 0]) cylinder(r=0.4, h=cut_w, center=true);
        }
    }
}

module hinge_wall_backing_rib(is_base) {
    rib_depth = 2.5;
    rib_drop  = 5.5;
    y_edge    = is_base ? (length/2 - wall) : (-length/2 + wall);
    y_inward  = is_base ? (y_edge - rib_depth) : (y_edge + rib_depth);

    hull() {
        translate([-width/2, min(y_edge, y_inward), height - rib_drop])
        cube([width, rib_depth, rib_drop]);
        translate([-width/2, is_base ? (y_edge - 0.1) : y_edge, height - rib_drop - rib_depth])
        cube([width, 0.1, 0.1]);
    }
}

module base_box() {
    armW = max(16.0, width / 4.0);
    c_span = armW - 0.4; 

    union() {
        difference() {
            translate([-width/2, -length/2, 0]) cube([width, length, height]);
            
            comp_w = (width - wall * (compX + 1)) / compX;
            comp_l = (length - wall * (compY + 1)) / compY;
            for(i=[0:compX-1]) {
                for(j=[0:compY-1]) {
                    translate([-width/2 + wall + i*(comp_w+wall), -length/2 + wall + j*(comp_l+wall), wall])
                    cube([comp_w, comp_l, height + 1]);
                }
            }
        }
        hinge_wall_backing_rib(is_base = true);
        
        polyhedron(
            points = [
                [-c_span/2, -length/2,        height - 0.2],
                [ c_span/2, -length/2,        height - 0.2],
                [-c_span/2, -length/2,        height - 3.60],
                [ c_span/2, -length/2,        height - 3.60],
                [-c_span/2, -length/2 - 0.85, height - 2.75],
                [ c_span/2, -length/2 - 0.85, height - 2.75]
            ],
            faces = [[0,1,3,2], [2,3,5,4], [0,4,5,1], [0,2,4], [1,5,3]]
        );
    }
}

module lid_box() {
    armW = max(16.0, width / 4.0);
    armT = 1.4;
    armH = 5.8;

    union() {
        difference() {
            union() {
                translate([-width/2, -length/2, 0]) cube([width, length, height]);
                translate([0, length/2, 0]) {
                    translate([-armW/2, 0, height - 3.5]) 
                    cube([armW, armT, armH + 3.5]);

                    translate([-(armW*0.85)/2, armT, height + armH - 1.8]) 
                    cube([armW*0.85, 1.8, 1.8]);

                    polyhedron(
                        points = [
                            [-armW/2, 0,        height + 3.65],
                            [ armW/2, 0,        height + 3.65],
                            [-armW/2, -0.80,    height + 4.45],
                            [ armW/2, -0.80,    height + 4.45],
                            [-armW/2, 0,        height + 5.80],
                            [ armW/2, 0,        height + 5.80]
                        ],
                        faces = [[0,2,3,1], [2,4,5,3], [0,1,5,4], [0,4,2], [1,3,5]]
                    );

                    polyhedron(
                        points = [
                            [-armW/2, 0,          height - 3.5],
                            [ armW/2, 0,          height - 3.5],
                            [-armW/2, armT * 1.6, height - 3.5],
                            [ armW/2, armT * 1.6, height - 3.5],
                            [-armW/2, armT,       height + 1.0],
                            [ armW/2, armT,       height + 1.0]
                        ],
                        faces = [[0,1,3,2], [2,3,5,4], [0,4,5,1], [0,2,4], [1,5,3]]
                    );
                }
            }
            translate([-width/2 + wall, -length/2 + wall, wall])
            cube([width - wall*2, length - wall*2, height + 1]);
            if (box_text_1 != "" || enable_lid_border) {
                translate([0, 0, -0.02])
                linear_extrude(0.64)
                offset(r=0.01)
                render_lid_text();
            }
        }
        hinge_wall_backing_rib(is_base = false);
    }
}

module build_base_hinges() {
    for(i = base_indices) {
        x_pos = i * k_span;
        k_len = k_span - k_tol;
        translate([x_pos, 0, height]) {
            union() {
                rotate([0, 90, 0]) cylinder(r=hr, h=k_len, center=true);
                hull() {
                    intersection() {
                        rotate([0, 90, 0]) cylinder(r=hr, h=k_len, center=true);
                        translate([-k_len, -hr*2, -hr*2]) cube([k_len*2, hr*2 - gap/2, hr*2]);
                    }
                    translate([-k_len/2, -wall - gap/2, -gusset_h]) cube([k_len, wall, 0.1]);
                }
            }
        }
    }
}

module build_lid_hinges() {
    for(i = lid_indices) {
        x_pos = i * k_span;
        k_len = k_span - k_tol;
        translate([x_pos, 0, height]) {
            union() {
                rotate([0, 90, 0]) cylinder(r=hr, h=k_len, center=true);
                hull() {
                    intersection() {
                        rotate([0, 90, 0]) cylinder(r=hr, h=k_len, center=true);
                        translate([-k_len, gap/2, -hr*2]) cube([k_len*2, hr*2, hr*2]);
                    }
                    translate([-k_len/2, gap/2, -gusset_h]) cube([k_len, wall, 0.1]);
                }
            }
        }
    }
}

complete_model();
`;
  };

  // ==========================================
  // DESCRIPTIVE CARGO MATRIX .SCAD FILE NAMING
  // ==========================================
  const getCargoScadFilename = (mode = scadExportMode) => {
    const cleanCode = designCode || `CARGO-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const safeText = (cargoText || '')
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toUpperCase() || 'NO-TEXT';

    const dims = `${cargoWidth}x${cargoLength}x${cargoHeight}mm`;
    const grid = `${cargoCompX}x${cargoCompY}Grid`;
    const colors = `${cargoBoxColorId}_inlay-${cargoTextColorId}`;
    const borderTag = cargoBorder ? 'Border-YES' : 'Border-NO';

    const typeMap = {
      full: 'FULL-3MF-V12',
      box_only: 'BOX-ONLY-V12',
      text_only: 'INLAY-ONLY-V12',
      hinge: 'HINGE-TEST-V12',
      latch: 'LATCH-TEST-V12'
    };

    return `${cleanCode}_${cargoPreset.toUpperCase()}_${safeText}_${dims}_${grid}_${colors}_${borderTag}_${typeMap[mode] || 'V12'}.scad`;
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
    let scadContent = "";
    let filename = "";

    if (activeTab === 'ammo') {
      scadContent = generateAmmoMatrixScad();
      filename = `ammomatrix_${ammoCaliber}_${clampedAmmoCols}x${clampedAmmoRows}.scad`;
    } else if (activeTab === 'cargo') {
      // Assuming you have a cargo generator too!
      scadContent = typeof generateCargoScad === 'function' ? generateCargoScad() : '';
      filename = `cargomatrix_${cargoWidth}x${cargoLength}x${cargoHeight}.scad`;
    }

    if (!scadContent) return;

    const blob = new Blob([scadContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // MODULAR FIRESTORE PAYLOAD BUILDER
  // ==========================================
  const buildOrderPayload = (codeToSave) => {
    const productMeta = PRODUCT_CATALOG[activeTab] || PRODUCT_CATALOG.storage;
    const estPrice = Number(calculatePrice().toFixed(2));

    const basePayload = {
      schemaVersion: '2.1-dual-channel',
      designCode: codeToSave,
      orderChannel: isEtsyMode ? 'etsy' : 'direct_square',
      productLine: activeTab,
      productName: productMeta.name,
      presetSelected: activeTab === 'storage' ? sizePreset : cargoPreset,
      estimatedPrice: estPrice,
      createdAt: serverTimestamp()
    };

    if (activeTab === 'storage') {
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
      const magCount = ammoShellX >= 150 ? 12 : 8; 

      const ammoConfig = {
        ammoCaliber,
        cols: Number(clampedAmmoCols),
        rows: Number(clampedAmmoRows),
        totalRounds: Number(ammoTotalRounds),
        preset: ammoPreset,
        shellX: Number(ammoShellX),
        shellY: Number(ammoShellY),
        shellZ: Number(ammoShellZ),
        trayX: Number(ammoTrayX),
        trayY: Number(ammoTrayY),
        trayZ: Number(ammoTrayZ),
        baseColor: ammoBaseColor,
        lidColor: ammoLidColor,
        trayColor: ammoTrayColor,
        accentColor: ammoAccentColor,
        lidTitle: ammoLidTitle,
        lidSubtitle: showAmmoRoundCount ? `${ammoTotalRounds} RDS` : '',
        showAmmoRoundCount,
        magnetsCount: Number(magCount)
      };

    return {
        ...basePayload,
      dimensionsSummary: `${currentCalSpec.name} (${ammoTotalRounds} Rds): ${ammoShellX}W x ${ammoShellY}L x ${ammoShellZ}H mm`,
      colorsSummary: `Base: ${ammoBaseColor} / Lid: ${ammoLidColor} / Tray: ${ammoTrayColor}`,
      configuration: ammoConfig,
      productionOutput: {
        scadFilename: `ammomatrix_${ammoCaliber}_${clampedAmmoCols}x${clampedAmmoRows}.scad`,
        scadCode: generateAmmoMatrixScad(),
        specSheet: generateSpecSheet()
      },
      width: Number(ammoShellX),
      length: Number(ammoShellY),
      height: Number(ammoShellZ),
      scadCode: generateAmmoMatrixScad(),
      scadFilename: `ammomatrix_${ammoCaliber}_${clampedAmmoCols}x${clampedAmmoRows}.scad`,
      ammoCaliber,
      ammoCols: clampedAmmoCols,
      ammoRows: clampedAmmoRows,
      ammoPreset,
      ammoBaseColor,
      ammoLidColor,
      ammoTrayColor,
      ammoAccentColor,
      ammoLidTitle,
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
      cargoBoxColorName: activeCargoBoxColor.name,
      cargoBoxColorHex: activeCargoBoxColor.hex,
      cargoTextColorId,
      cargoTextColorName: activeCargoTextColor.name,
      cargoTextColorHex: activeCargoTextColor.hex,
      cargoText,
      cargoFont,
      cargoBorder
    };

    return {
      ...basePayload,
      dimensionsSummary: `${cargoPreset}: ${cargoWidth}W x ${cargoLength}L x ${cargoHeight}H mm (${cargoCompX}x${cargoCompY} Grid)`,
      colorsSummary: `Body: ${activeCargoBoxColor.name} / Inlay: ${activeCargoTextColor.name}`,
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
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCode = `${prefix}${randomChars}`;
    setDesignCode(newCode);
    setCodeCopied(false);
    setModalTab('spec');
    setShowModal(true);
  };

  const [cart, setCart] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleAddToCart = async () => {
    if (!designCode) return;

    navigator.clipboard.writeText(designCode);
    setCodeCopied(true);
    await saveDesignToFirestore(designCode);

    const currentPrice = Number(calculatePrice().toFixed(2));

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.designCode === designCode
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
          designCode,
          price: currentPrice,
          quantity: 1,
        },
      ];
    });
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
    if (activeTab === 'storage') {
      // Storage / Bench Matrix default direct dimensions
      setWidth(140);
      setDepth(110);
      setHeight(15.5);
      setTiers(2);
      setDrawersPerTier(4);
    } else if (activeTab === 'cargo') {
      setCargoWidth(120);
      setCargoDepth(90);
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
        itemsToCheckout = [
          {
            designCode,
            price: Number(calculatePrice().toFixed(2)),
            quantity: 1,
          },
        ];
      }

      if (itemsToCheckout.length === 0) {
        setIsCheckingOut(false);
        return;
      }

      const functions = getFunctions();
      const createCheckoutLink = httpsCallable(functions, "createCheckoutLink");

      const response = await createCheckoutLink({
        items: itemsToCheckout,
      });

      console.log("SQUARE LINK:", response.data.url);
      window.location.href = response.data.url;
    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Unable to initiate checkout. Please try again.");
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

        if (data.productLine === 'storage') {
          setActiveTab('storage');
          if (cfg.sizePreset) setSizePreset(cfg.sizePreset);
          setTiers(cfg.tiers ?? 2);
          setDrawersPerTier(cfg.drawersPerTier ?? 4);
          setOpening(cfg.opening ?? 'Left');
          setHandlePos(cfg.handlePos ?? 'Front');
          setWidth(cfg.width ?? 140);
          setDepth(cfg.depth ?? cfg.length ?? 110);
          setHeight(cfg.height ?? 15.5);
          setEnableLabelSlot(cfg.enableLabelSlot ?? true);
          setLabelWidth(cfg.labelWidth ?? 30);
          setLabelHeight(cfg.labelHeight ?? 11);
          setLabelFont(cfg.labelFont ?? 'Inter');
          setLabels(cfg.labels || {});
          setDrawerDividers(cfg.drawerDividers || {});
          setCasingColorId(cfg.casingColorId || 'cocoa-brown');
          setDrawerColorId(cfg.drawerColorId || 'matte-latte-brown');
        } else if (data.productLine === 'ammo' || cfg.ammoCaliber) {
          setActiveTab('ammo');
          if (cfg.ammoCaliber) setAmmoCaliber(cfg.ammoCaliber);
          if (cfg.ammoCols) setAmmoCols(cfg.ammoCols);
          if (cfg.ammoRows) setAmmoRows(cfg.ammoRows);
          if (cfg.ammoPreset) setAmmoPreset(cfg.ammoPreset);
          if (cfg.ammoBaseColor) setAmmoBaseColor(cfg.ammoBaseColor);
          if (cfg.ammoLidColor) setAmmoLidColor(cfg.ammoLidColor);
          if (cfg.ammoTrayColor) setAmmoTrayColor(cfg.ammoTrayColor);
          if (cfg.ammoAccentColor) setAmmoAccentColor(cfg.ammoAccentColor);
          if (cfg.ammoLidTitle !== undefined) setAmmoLidTitle(cfg.ammoLidTitle);
          if (cfg.ammoLidSubtitle !== undefined) setAmmoLidSubtitle(cfg.ammoLidSubtitle);
        } else {
          setActiveTab('cargo');
          if (cfg.cargoPreset) setCargoPreset(cfg.cargoPreset);
          setCargoWidth(cfg.cargoWidth ?? data.width ?? 120);
          setCargoLength(cfg.cargoLength ?? data.length ?? 90);
          setCargoHeight(cfg.cargoHeight ?? (data.height ? data.height / 2 : 20));
          setCargoCompX(cfg.cargoCompX ?? 2);
          setCargoCompY(cfg.cargoCompY ?? 2);
          if (cfg.cargoBoxColorId) setCargoBoxColorId(cfg.cargoBoxColorId);
          if (cfg.cargoTextColorId) setCargoTextColorId(cfg.cargoTextColorId);
          if (cfg.cargoText !== undefined) setCargoText(cfg.cargoText);
          if (cfg.cargoFont) setCargoFont(cfg.cargoFont);
          if (cfg.cargoBorder !== undefined) setCargoBorder(cfg.cargoBorder);
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
    if (activeTab === 'storage') {
      const totalH = tiers * singleTierHeightMm;
      const maxSpan = Math.max(width, depth, totalH);
      controlsState.current.targetY = totalH * 0.45;
      controlsState.current.radius = Math.max(250, maxSpan * 1.9 + 90);
    } else {
      const maxSpan = Math.max(cargoWidth, cargoLength * 2.1, cargoHeight * 2);
      controlsState.current.targetY = cargoHeight * 0.8;
      controlsState.current.radius = Math.max(220, maxSpan * 1.65 + 60);
    }
  }, [activeTab, tiers, singleTierHeightMm, width, depth, cargoWidth, cargoLength, cargoHeight]);

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

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // ==========================================
  // BUILD 3D GEOMETRY FOR ACTIVE PRODUCT TAB
  // ==========================================
  useEffect(() => {
    const group = modelGroupRef.current;
    if (!group) return;
    while (group.children.length > 0) group.remove(group.children[0]);
    drawerPivotsRef.current = [];

    if (activeTab === 'storage') {
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
        color: ammoBaseColor, roughness: 0.75,
        transparent: showMagnetXray, opacity: showMagnetXray ? 0.32 : 1.0
      });
      const lidMat = new THREE.MeshStandardMaterial({
        color: ammoLidColor, roughness: 0.75,
        transparent: showMagnetXray, opacity: showMagnetXray ? 0.32 : 1.0
      });
      const trayMat = new THREE.MeshStandardMaterial({
        color: ammoTrayColor, roughness: 0.85,
        transparent: showMagnetXray, opacity: showMagnetXray ? 0.55 : 1.0
      });
      const accentMat = new THREE.MeshStandardMaterial({ color: ammoAccentColor, roughness: 0.4 });
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
        const fbRibBack = fbRibFront.clone();
        fbRibBack.position.set(dir * (ammoShellX * 0.36), (baseZ - 2) / 2, -ammoShellY / 2 - ribThick / 2);
        baseShellGroup.add(fbRibFront, fbRibBack);
      });

      // 2. HEAVY-DUTY REAR KNUCKLE HINGE (Base Knuckles + M3 Steel Pin)
      const hingeRadius = 4.2;
      const knuckleW = Math.min(28, ammoShellX * 0.22);
      const hingeY = baseZ;
      const hingeZ = -ammoShellY / 2 - hingeRadius * 0.65;

      [-1, 1].forEach((side) => {
        const baseKnuckle = new THREE.Mesh(new THREE.CylinderGeometry(hingeRadius, hingeRadius, knuckleW, 20), baseMat);
        baseKnuckle.rotation.z = Math.PI / 2;
        baseKnuckle.position.set(side * (knuckleW * 1.05), hingeY, hingeZ);
        baseShellGroup.add(baseKnuckle);
      });

      const m3HingePin = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, knuckleW * 3.2, 16), steelMat);
      m3HingePin.rotation.z = Math.PI / 2;
      m3HingePin.position.set(0, hingeY, hingeZ);
      baseShellGroup.add(m3HingePin);

      // 3. TACTICAL CAM-ACTION DRAW LATCHES (Front Mount + Lever + M3 Pin)
      const latchOffsets = ammoShellX >= 130 ? [-ammoShellX * 0.23, ammoShellX * 0.23] : [0];
      latchOffsets.forEach((lx) => {
        const latchGroup = new THREE.Group();
        latchGroup.position.set(lx, baseZ - 2, ammoShellY / 2);

        // Base clevis bracket
        const clevisL = new THREE.Mesh(new THREE.BoxGeometry(3.2, 12, 5.5), baseMat);
        clevisL.position.set(-8.5, -6, 2.75);
        const clevisR = clevisL.clone();
        clevisR.position.set(8.5, -6, 2.75);
        latchGroup.add(clevisL, clevisR);

        // M3 Stainless Pivot Pin
        const latchPin = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 22, 12), steelMat);
        latchPin.rotation.z = Math.PI / 2;
        latchPin.position.set(0, -4, 3.5);
        latchGroup.add(latchPin);

        // Articulated Cam Lever Body (Accent Color)
        const camBody = new THREE.Mesh(new THREE.BoxGeometry(13.2, 22, 4.2), accentMat);
        camBody.position.set(0, -7, 4.8);
        latchGroup.add(camBody);

        // Finger Pull Lip at bottom of latch
        const pullLip = new THREE.Mesh(new THREE.BoxGeometry(13.2, 3.5, 6.8), accentMat);
        pullLip.position.set(0, -17.5, 6.0);
        latchGroup.add(pullLip);

        // Grip ridges on latch face
        [-3, -7, -11].forEach((ry) => {
          const grip = new THREE.Mesh(new THREE.BoxGeometry(11.0, 1.2, 1.0), latchPin.material);
          grip.position.set(0, ry, 7.1);
          latchGroup.add(grip);
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

      // Lid Exterior Side Ribs (Match Base Alignment, Rotate with Lid)
      [-1, 1].forEach((dir) => {
        const lidRibL = new THREE.Mesh(new THREE.BoxGeometry(ribThick, 10.5, ribWidth), lidMat);
        lidRibL.position.set(-ammoShellX / 2 - ribThick / 2, 5.5, lidOffsetZ + dir * (ammoShellY * 0.26));
        const lidRibR = lidRibL.clone();
        lidRibR.position.set(ammoShellX / 2 + ribThick / 2, 5.5, lidOffsetZ + dir * (ammoShellY * 0.26));
        lidPivot.add(lidRibL, lidRibR);
      });

      // Center Lid Hinge Knuckle
      const lidCenterKnuckle = new THREE.Mesh(new THREE.CylinderGeometry(hingeRadius, hingeRadius, knuckleW, 20), accentMat);
      lidCenterKnuckle.rotation.z = Math.PI / 2;
      lidCenterKnuckle.position.set(0, 0, 0);
      lidPivot.add(lidCenterKnuckle);

      // Upper Lid Latch Catch Hooks
      latchOffsets.forEach((lx) => {
        const catchHook = new THREE.Mesh(new THREE.BoxGeometry(13.0, 6.5, 4.5), lidMat);
        catchHook.position.set(lx, 3.25, lidOffsetZ + ammoShellY / 2 + 2.2);
        lidPivot.add(catchHook);
      });

      // Map 2D Procedural Texture to Recessed 3D Lid Badge
      if (currentCalSpec && (ammoLidTitle.trim() !== '' || showAmmoRoundCount)) {
        const badgeTexture = createBadgeTexture({
          caliberSpec: currentCalSpec,
          customText: ammoLidTitle,
          showRoundCount: showAmmoRoundCount,
          fontFamily: ammoLidFont,
          lidColorHex: ammoLidColor,
          accentColorHex: ammoAccentColor,
          rounds: ammoTotalRounds
        });
        const badgeTopMat = new THREE.MeshStandardMaterial({ map: badgeTexture, roughness: 0.5 });
        const badgeSideMat = new THREE.MeshStandardMaterial({ color: ammoAccentColor, roughness: 0.5 });
        const badge = new THREE.Mesh(
          new THREE.BoxGeometry(ammoShellX * 0.78, 0.6, ammoShellY * 0.58),
          [badgeSideMat, badgeSideMat, badgeTopMat, badgeSideMat, badgeSideMat, badgeSideMat]
        );
        badge.position.set(0, 12.1, lidOffsetZ);
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
      const magCoords = ammoShellX >= 150
        ? [[-mx, -my], [mx, -my], [-mx, my], [mx, my], [0, -my], [0, my]]
        : [[-mx, -my], [mx, -my], [-mx, my], [mx, my]];

      magCoords.forEach(([fx, fy]) => {
        // Tray Standoff Foot
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 7.25, footH, 16), accentMat);
        foot.position.set(fx, -ammoTrayZ / 2 - footH / 2, fy);
        trayGroup.add(foot);

        // Base Floor Embedded Magnet Boss (Always physically present in Base Floor)
        const baseBoss = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, 0.6, 16), accentMat);
        baseBoss.position.set(fx, floorT + 0.3, fy);
        baseShellGroup.add(baseBoss);

        if (showMagnetXray) {
          // 1. Tray Foot Magnet (Ø8x3mm)
          const trayMag = new THREE.Mesh(new THREE.CylinderGeometry(4.07, 4.07, 3.15, 16), magTrayMat);
          trayMag.position.set(fx, -ammoTrayZ / 2 - footH + 1.6, fy);
          trayGroup.add(trayMag);

          // 2. Base Shell Floor Magnet (Ø8x3mm - Always visible in bottom shell!)
          const baseMag = new THREE.Mesh(new THREE.CylinderGeometry(4.07, 4.07, 3.15, 16), magBaseMat);
          baseMag.position.set(fx, floorT - 1.6, fy);
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

      // 6. CALIBER-ACCURATE CARTRIDGES (Rifle/Pistol vs. Shotgun Shells)
      if (currentCalSpec) {
        const startX = -((clampedAmmoCols - 1) * currentCalSpec.pitch) / 2;
        const startY = -((clampedAmmoRows - 1) * currentCalSpec.pitch) / 2;
        const rad = currentCalSpec.holeDia / 2 - 0.15;
        const isShotgun = currentCalSpec.category === 'Shotgun';

        const roundGeo = new THREE.Group();
        if (isShotgun) {
          // 12GA / 20GA Shotgun Shell: High-Brass Head + Ribbed Red Hull + Star Crimp
          const brassHeadH = Math.min(16, currentCalSpec.oal * 0.25);
          const hullH = currentCalSpec.oal - brassHeadH;
          const rim = new THREE.Mesh(new THREE.CylinderGeometry(rad * 1.06, rad * 1.06, 1.4, 20), brassMat);
          rim.position.y = 0.7;
          const highBrass = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, brassHeadH, 20), brassMat);
          highBrass.position.y = brassHeadH / 2;
          const plasticHull = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.98, rad * 0.98, hullH, 20), hullMat);
          plasticHull.position.y = brassHeadH + hullH / 2;
          const starCrimp = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.82, rad * 0.92, 0.8, 12), crimpMat);
          starCrimp.position.y = currentCalSpec.oal + 0.1;
          roundGeo.add(rim, highBrass, plasticHull, starCrimp);
        } else {
          // Rifle / Pistol Metallic Cartridge
          const caseH = currentCalSpec.oal * 0.68;
          const bulletH = currentCalSpec.oal * 0.32;
          const brass = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.95, rad, caseH, 16), brassMat);
          brass.position.y = caseH / 2;
          const tip = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.32, rad * 0.88, bulletH, 16), leadMat);
          tip.position.y = caseH + bulletH / 2;
          roundGeo.add(brass, tip);
        }

        const holeMat = new THREE.MeshBasicMaterial({ color: 0x090d16 });
        for (let c = 0; c < clampedAmmoCols; c++) {
          for (let r = 0; r < clampedAmmoRows; r++) {
            const cx = startX + c * currentCalSpec.pitch;
            const cy = startY + r * currentCalSpec.pitch;
            const hole = new THREE.Mesh(new THREE.CylinderGeometry(rad + 0.2, rad + 0.2, 0.2, 16), holeMat);
            hole.position.set(cx, ammoTrayZ / 2 + 0.05, cy);
            trayGroup.add(hole);
            if (showAmmoRounds) {
              const b = roundGeo.clone();
              b.position.set(cx, -ammoTrayZ / 2 + 1.5, cy);  // Sinks bullets deeper into the tray
              trayGroup.add(b);
            }
          }
        }
      }
      ammoGroup.add(trayGroup);
      group.add(ammoGroup);
      
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
      // THE CARGO MATRIX (PRINT-IN-PLACE CLAMSHELL)
      // ==========================================
      const boxMat = new THREE.MeshStandardMaterial({
        color: activeCargoBoxColor.hex,
        roughness: activeCargoBoxColor.roughness ?? 0.45,
        metalness: activeCargoBoxColor.metalness ?? 0.08
      });

      const wall = 2.0;
      const floorT = 2.0;
      const hingeGap = 1.6;
      const armW = Math.max(16.0, cargoWidth / 4.0);

      const createHalfShell = (isBase) => {
        const shellGroup = new THREE.Group();

        const floorMesh = new THREE.Mesh(
          new THREE.BoxGeometry(cargoWidth, floorT, cargoLength),
          boxMat
        );
        floorMesh.position.y = floorT / 2;
        floorMesh.castShadow = true;
        floorMesh.receiveShadow = true;
        shellGroup.add(floorMesh);

        const wallH = Math.max(2, cargoHeight - floorT);
        const wallY = floorT + wallH / 2;

        const frontBackGeo = new THREE.BoxGeometry(cargoWidth, wallH, wall);
        const frontWall = new THREE.Mesh(frontBackGeo, boxMat);
        frontWall.position.set(0, wallY, cargoLength / 2 - wall / 2);
        shellGroup.add(frontWall);

        const backWall = new THREE.Mesh(frontBackGeo, boxMat);
        backWall.position.set(0, wallY, -cargoLength / 2 + wall / 2);
        shellGroup.add(backWall);

        const sideGeo = new THREE.BoxGeometry(wall, wallH, cargoLength - wall * 2);
        const leftWall = new THREE.Mesh(sideGeo, boxMat);
        leftWall.position.set(-cargoWidth / 2 + wall / 2, wallY, 0);
        shellGroup.add(leftWall);

        const rightWall = new THREE.Mesh(sideGeo, boxMat);
        rightWall.position.set(cargoWidth / 2 - wall / 2, wallY, 0);
        shellGroup.add(rightWall);

        if (isBase) {
          const innerW = cargoWidth - wall * 2;
          const innerL = cargoLength - wall * 2;
          const divH = Math.max(2, wallH - 0.5);
          const divY = floorT + divH / 2;

          if (cargoCompX > 1) {
            for (let i = 1; i < cargoCompX; i++) {
              const xPos = -innerW / 2 + (innerW / cargoCompX) * i;
              const divX = new THREE.Mesh(new THREE.BoxGeometry(wall, divH, innerL), boxMat);
              divX.position.set(xPos, divY, 0);
              shellGroup.add(divX);
            }
          }
          if (cargoCompY > 1) {
            for (let j = 1; j < cargoCompY; j++) {
              const zPos = -innerL / 2 + (innerL / cargoCompY) * j;
              const divZ = new THREE.Mesh(new THREE.BoxGeometry(innerW, divH, wall), boxMat);
              divZ.position.set(0, divY, zPos);
              shellGroup.add(divZ);
            }
          }

          const catchSpan = armW - 0.4;
          const wedgeShape = new THREE.Shape();
          wedgeShape.moveTo(0, -0.2);
          wedgeShape.lineTo(0, -3.6);
          wedgeShape.lineTo(1.25, -2.75);
          wedgeShape.closePath();

          const wedgeGeo = new THREE.ExtrudeGeometry(wedgeShape, {
            depth: catchSpan,
            bevelEnabled: false
          });
          wedgeGeo.translate(0, 0, -catchSpan / 2);
          wedgeGeo.rotateY(-Math.PI / 2);

          const catchMesh = new THREE.Mesh(wedgeGeo, boxMat);
          catchMesh.position.set(0, cargoHeight, cargoLength / 2);
          shellGroup.add(catchMesh);
        } else {
          const armT = 1.4;
          const armH = 5.8;
          const latchGroup = new THREE.Group();
          latchGroup.position.set(0, 0, -cargoLength / 2);

          const plateH = armH + 3.5;
          const plateGeo = new THREE.BoxGeometry(armW, plateH, armT);
          const plateMesh = new THREE.Mesh(plateGeo, boxMat);
          plateMesh.position.set(0, cargoHeight - 3.5 + plateH / 2, -armT / 2);
          latchGroup.add(plateMesh);

          const pullGeo = new THREE.BoxGeometry(armW * 0.85, 1.8, 1.8);
          const pullMesh = new THREE.Mesh(pullGeo, boxMat);
          pullMesh.position.set(0, cargoHeight + armH - 0.9, -armT - 0.9);
          latchGroup.add(pullMesh);

          const toothShape = new THREE.Shape();
          toothShape.moveTo(0, 3.65);
          toothShape.lineTo(1.15, 4.45);
          toothShape.lineTo(0, 5.8);
          toothShape.closePath();

          const toothGeo = new THREE.ExtrudeGeometry(toothShape, {
            depth: armW,
            bevelEnabled: false
          });
          toothGeo.translate(0, 0, -armW / 2);
          toothGeo.rotateY(-Math.PI / 2);

          const toothMesh = new THREE.Mesh(toothGeo, boxMat);
          toothMesh.position.set(0, cargoHeight, 0);
          latchGroup.add(toothMesh);

          shellGroup.add(latchGroup);
        }

        return shellGroup;
      };

      const baseHalf = createHalfShell(true);
      baseHalf.position.set(0, 0, cargoLength / 2 + hingeGap / 2);
      group.add(baseHalf);

      const lidPivot = new THREE.Group();
      lidPivot.position.set(0, cargoHeight, 0);
      lidPivot.rotation.x = THREE.MathUtils.degToRad(foldAngle);

      const knuckleCount = 5;
      const kSpan = cargoWidth / knuckleCount;
      const kLen = kSpan - 0.45;
      const hr = 3.2;

      for (let k = 0; k < knuckleCount; k++) {
        const kx = (k - 2) * kSpan;
        const isBaseKnuckle = k % 2 === 0;

        const knuckleGeo = new THREE.CylinderGeometry(hr, hr, kLen, 24);
        knuckleGeo.rotateZ(Math.PI / 2);
        const knuckleMesh = new THREE.Mesh(knuckleGeo, boxMat);

        const gussetGeo = new THREE.BoxGeometry(kLen, 4.2, wall + hingeGap / 2);
        const gussetMesh = new THREE.Mesh(gussetGeo, boxMat);

        if (isBaseKnuckle) {
          knuckleMesh.position.set(kx, cargoHeight, 0);
          gussetMesh.position.set(kx, cargoHeight - 2.1, hingeGap / 2 + wall / 2);
          group.add(knuckleMesh);
          group.add(gussetMesh);
        } else {
          knuckleMesh.position.set(kx, 0, 0);
          gussetMesh.position.set(kx, -2.1, -hingeGap / 2 - wall / 2);
          lidPivot.add(knuckleMesh);
          lidPivot.add(gussetMesh);
        }
      }

      const lidHalf = createHalfShell(false);
      lidHalf.position.set(0, -cargoHeight, -cargoLength / 2 - hingeGap / 2);

      const lidTex = createCargoLidTexture(
        cargoText,
        activeCargoTextColor.hex,
        cargoFont,
        cargoBorder
      );
      const lidLabelPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(cargoWidth - 4, cargoLength - 4),
        new THREE.MeshStandardMaterial({
          map: lidTex,
          transparent: true,
          roughness: activeCargoTextColor.roughness ?? 0.5,
          metalness: activeCargoTextColor.metalness ?? 0.08,
          polygonOffset: true,
          polygonOffsetFactor: -1
        })
      );
      lidLabelPlane.rotation.x = Math.PI / 2;
      lidLabelPlane.rotation.z = 0;
      lidLabelPlane.position.set(0, -0.06, 0);
      lidHalf.add(lidLabelPlane);

      lidPivot.add(lidHalf);
      group.add(lidPivot);

      if (showDimensions) {
        const wSprite = createDimensionSprite(`${cargoWidth} mm W`);
        wSprite.position.set(0, 8, cargoLength + 28);
        group.add(wSprite);

        const lSprite = createDimensionSprite(`${cargoLength} mm L`);
        lSprite.position.set(cargoWidth / 2 + 36, 8, cargoLength / 2);
        group.add(lSprite);

        const hSprite = createDimensionSprite(`${cargoHeight} mm H (half)`);
        hSprite.position.set(-cargoWidth / 2 - 36, cargoHeight / 2, cargoLength / 2);
        group.add(hSprite);
      }
    }
  }, [
    activeTab,
    tiers,
    drawersPerTier,
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
    cargoText,
    cargoFont,
    cargoBorder,
    foldAngle,
    ammoCaliber,
    ammoCols,
    ammoRows,
    ammoBaseColor,
    ammoLidColor,
    ammoTrayColor,
    ammoAccentColor,
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
              <form onSubmit={handleVerifyPin} className="space-y-3">
                <p className="text-xs text-[#94a3b8]">
                  Enter your 4-digit Admin PIN to unlock customer order lookup, channel switching, and V12 OpenSCAD exports:
                </p>
                <input
                  type="password"
                  value={adminPinInput}
                  onChange={(e) => {
                    setAdminPinInput(e.target.value);
                    setAdminPinError(false);
                  }}
                  placeholder="••••"
                  autoFocus
                  className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-lg px-3 py-2 text-center tracking-[0.5em] text-sm font-mono text-white"
                />
                {adminPinError && (
                  <p className="text-[11px] text-red-400 font-semibold">Invalid PIN code.</p>
                )}
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-[#38bdf8] text-[#0b0f19] font-bold text-xs hover:bg-[#7dd3fc]"
                >
                  Unlock Admin Tools
                </button>
              </form>
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
                  <span className="text-[11px] text-emerald-400 font-semibold">✓ Admin V12 .SCAD Unlocked</span>
                  <button
                    onClick={() => {
                      setAdminMode(false);
                      setModalTab('scad');
                      setShowModal(true);
                    }}
                    className="px-3 py-1.5 rounded bg-[#f43f5e] text-white text-xs font-bold"
                  >
                    Open V12 .SCAD Generator
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
                    ? `Select the "${activeTab === 'storage' ? sizePreset : cargoPreset}" option on Etsy and paste your Design Code in the personalization box.`
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
                    <Code size={13} /> Admin V12 OpenSCAD (.scad)
                  </button>
                </div>

                {modalTab === 'scad' && (
                  <div className="flex items-center gap-1 pb-2">
                    <span className="text-[10px] text-[#94a3b8] mr-1">Export Part:</span>
                    {[
                      { id: 'full', label: 'Full' },
                      { id: 'box_only', label: 'Box' },
                      { id: 'text_only', label: 'Inlay' },
                      { id: 'hinge', label: 'Hinge Test' },
                      { id: 'latch', label: 'Latch Test' }
                    ].map((m) => (
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
                Save Filename: <span className="text-white">{activeTab === 'ammo' ? `ammomatrix_${ammoCaliber}_${clampedAmmoCols}x${clampedAmmoRows}_${scadExportMode}.scad` : getCargoScadFilename(scadExportMode)}</span>
              </div>
            )}

            <div className="p-4 overflow-y-auto flex-1 bg-[#0b0f19] m-4 rounded-lg border border-[#1e293b]">
              <pre className="text-xs font-mono text-[#e2e8f0] whitespace-pre-wrap leading-relaxed">
                {adminUnlocked && currentProductMeta.hasOpenScadGenerator && modalTab === 'scad'
                  ? generateScadCode(scadExportMode)
                  : generateSpecSheet()}
              </pre>
            </div>

            <div className="px-5 py-3.5 bg-[#0f172a] border-t border-[#1e293b] flex flex-wrap items-center justify-between gap-2">
              {adminUnlocked && currentProductMeta.hasOpenScadGenerator && modalTab === 'scad' ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generateScadCode(scadExportMode));
                      setScadCopied(true);
                      setTimeout(() => setScadCopied(false), 2000);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    {scadCopied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {scadCopied ? 'Copied .SCAD!' : 'Copy .SCAD Code'}
                  </button>
                  <button
                    onClick={() => downloadScadFile(scadExportMode)}
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
                <a
                  href={currentProductMeta.etsyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleCheckoutActionClick}
                  className="px-5 py-2 rounded-lg bg-[#f43f5e] hover:bg-[#fb7185] text-white font-bold text-xs flex items-center gap-1.5"
                >
                  {codeCopied
                    ? `Code Copied! Select "${activeTab === 'storage' ? sizePreset : cargoPreset}" on Etsy`
                    : `Copy Code & Finish on Etsy (${activeTab === 'storage' ? sizePreset : cargoPreset})`}{' '}
                  <ExternalLink size={14} />
                </a>
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
                {prod.id === 'storage' ? <Sliders size={13} /> : prod.id === 'ammo' ? <Shield size={13} className="text-amber-400" /> : <Box size={13} />} {prod.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5 custom-scrollbar">
          {activeTab === 'storage' ? (
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
                    <Tag size={13} /> Drawer Labels &amp; Dividers
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
                                  placeholder="Label..."
                                  value={labels[key] || ''}
                                  onChange={(e) => setLabels((p) => ({ ...p, [key]: e.target.value }))}
                                  className="flex-1 bg-[#0b0f19] border border-[#1e293b] rounded px-2 py-1 text-xs text-white"
                                />
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
                {/* 1. CALIBER SELECTOR */}
                <div className="bg-[#0f172a] p-3 rounded-xl border border-[#1e293b]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">1. Caliber Spec</span>
                    <span className="text-[10px] font-mono text-amber-400">{currentCalSpec?.category}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {Object.values(AMMO_CALIBERS).map((cal) => (
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
                        <div className="text-[9px] text-slate-500 mt-1">Ø{cal.holeDia}mm</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. PRESET SIZES & SLIDERS */}
                <div className="bg-[#0f172a] p-3 rounded-xl border border-[#1e293b]">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">2. Box Capacity</div>
                  <div className="grid grid-cols-3 gap-2">
                    {AMMO_ETSY_PRESETS.map((preset) => {
                      const isActive = clampedAmmoCols === preset.cols && clampedAmmoRows === preset.rows;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => handleSelectAmmoPreset(preset)}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            isActive
                              ? 'bg-amber-500 text-slate-900 border-amber-400 font-bold'
                              : 'bg-[#151e31] border-[#1e293b] text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {/* Only show the label (e.g., "Small", "Medium", "Large"), omitting the number! */}
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
                      <input type="range" min={3} max={maxSafeGrid} value={clampedAmmoCols} onChange={(e) => setAmmoCols(Number(e.target.value))} className="w-full accent-amber-500" />
                      <input type="range" min={3} max={maxSafeGrid} value={clampedAmmoRows} onChange={(e) => setAmmoRows(Number(e.target.value))} className="w-full accent-amber-500" />
                    </div>
                  )}
                </div>

                {/* 3. COLORS & LID TEXT */}
                <div className="bg-[#0f172a] p-3 rounded-xl border border-[#1e293b] space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">3. Colors & Text</div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {/* Base Shell Color */}
                    <div className="flex flex-col">
                      <label className="text-slate-500 mb-1">Base Shell</label>
                      <select value={ammoBaseColor} onChange={(e) => setAmmoBaseColor(e.target.value)} className="bg-[#151e31] border border-[#1e293b] rounded p-1.5 text-slate-200">
                        {BAMBU_PETG_COLORS.map(c => <option key={c.id} value={c.hex}>{c.name}</option>)}
                      </select>
                    </div>
                    
                    {/* Lid Color */}
                    <div className="flex flex-col">
                      <label className="text-slate-500 mb-1">Vault Lid</label>
                      <select value={ammoLidColor} onChange={(e) => setAmmoLidColor(e.target.value)} className="bg-[#151e31] border border-[#1e293b] rounded p-1.5 text-slate-200">
                        {BAMBU_PETG_COLORS.map(c => <option key={c.id} value={c.hex}>{c.name}</option>)}
                      </select>
                    </div>

                    {/* Tray Color */}
                    <div className="flex flex-col">
                      <label className="text-slate-500 mb-1">Ammo Tray</label>
                      <select value={ammoTrayColor} onChange={(e) => setAmmoTrayColor(e.target.value)} className="bg-[#151e31] border border-[#1e293b] rounded p-1.5 text-slate-200">
                        {BAMBU_PETG_COLORS.map(c => <option key={c.id} value={c.hex}>{c.name}</option>)}
                      </select>
                    </div>

                    {/* Accent / Latches Color */}
                    <div className="flex flex-col">
                      <label className="text-slate-500 mb-1">Latches/Accents</label>
                      <select value={ammoAccentColor} onChange={(e) => setAmmoAccentColor(e.target.value)} className="bg-[#151e31] border border-[#1e293b] rounded p-1.5 text-slate-200">
                        {BAMBU_PETG_COLORS.map(c => <option key={c.id} value={c.hex}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Custom Lid Text & Font Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 block mb-1">Custom Lid Text & Font</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={18}
                        value={ammoLidTitle.trim() === '' ? '' : ammoLidTitle} 
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          // If they delete everything, pass a single space to prevent 3D/CAD engine crashes!
                          setAmmoLidTitle(val === '' ? ' ' : val);
                        }}
                        placeholder="LID TITLE"
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
                </div>
              </div>
            ) : (
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
                  <label className="block text-xs font-semibold mb-1">Lid Inlay Text</label>
                  <input
                    type="text"
                    value={cargoText}
                    onChange={(e) => setCargoText(e.target.value)}
                    placeholder="Enter custom lid text..."
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
                        <span className="font-semibold">↕ Half-Shell Height (Z)</span>
                        <span className="text-[#fecdd3] font-bold">{cargoHeight} mm ({cargoHeight * 2} mm closed)</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="50"
                        value={cargoHeight}
                        onChange={(e) => {
                          setCargoPreset('Custom');
                          setCargoHeight(parseInt(e.target.value, 10));
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
                    <Palette size={13} /> Colors (13 Bambu PETG Swatches)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const t = cargoBoxColorId;
                      setCargoBoxColorId(cargoTextColorId);
                      setCargoTextColorId(t);
                    }}
                    className="px-2 py-1 rounded bg-[#151e31] border border-[#334155] text-[10px] font-semibold flex items-center gap-1"
                  >
                    <ArrowLeftRight size={11} className="text-[#38bdf8]" /> Swap
                  </button>
                </div>

                <div>
                  <div className="text-xs font-semibold mb-1.5">
                    1. Box Body, Hinges &amp; Latch: <span className="text-[#fecdd3]">{activeCargoBoxColor?.name}</span>
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
              </div>
            </div>
          )}
        </div>

        {/* STICKY FOOTER */}
        <div className="shrink-0 p-3 pb-4 md:p-3.5 bg-[#0f172a] border-t border-[#1e293b] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#94a3b8]">
              {activeTab === 'storage'
                ? `${tiers} Tiers • ${tiers * drawersPerTier} Drawers`
                : `${cargoWidth}×${cargoLength}×${cargoHeight}mm • ${cargoCompX * cargoCompY} Cells`}
            </span>
            {isEtsyMode ? (
              <span className="px-2.5 py-0.5 rounded bg-[#3b1526] border border-[#f43f5e]/60 text-xs font-bold text-[#fecdd3]">
                Etsy Tier: {activeTab === 'storage' ? sizePreset : cargoPreset}
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
              ? `Get Etsy Design Code (${activeTab === 'storage' ? sizePreset : cargoPreset})`
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

        <header className="relative bg-[#0f172a] border-b border-[#1e293b] px-2.5 md:px-4 py-2.5 flex flex-col gap-3 z-10 overflow-hidden">
  
          {/* TOP ROW: Logo strictly in its own space */}
          <div className="flex items-center w-full pointer-events-none shrink-0">
            <img
              src="/textlogo.png"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/favicon.png';
              }}
              alt="FieldMatrix Logo"
              className="h-8 w-auto max-w-[220px] object-contain drop-shadow"
            />
          </div>

          {/* BOTTOM ROW: Controls pushed down safely in a scrollable bar */}
          <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap pb-1 w-full scrollbar-thin scrollbar-thumb-[#1e293b]">
            
            <span className="text-xs font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5 whitespace-nowrap shrink-0">
              <Sparkles size={14} /> 3D Preview
            </span>

            {activeTab !== 'ammo' && (
              activeTab === 'storage' ? (
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
                    Fold Lid ({foldAngle}°):
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    value={foldAngle}
                    onChange={(e) => setFoldAngle(parseInt(e.target.value, 10))}
                    className="w-24 box-studio-slider"
                  />
                </div>
              )
            )}

            {/* Flexible spacer to push the right-side buttons nicely */}
            <div className="flex-1 min-w-[20px]"></div>

            {activeTab === 'storage' && (
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

        <div ref={mountRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing touch-none" />
      </main>
    </div>
  );
}
