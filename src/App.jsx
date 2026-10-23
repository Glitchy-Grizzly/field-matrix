import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import {
  Package,
  Box,
  Copy,
  CheckCircle,
  RotateCcw,
  Maximize2,
  Eye,
  AlertTriangle,
  Sliders,
  Tag,
  Palette,
  Grid,
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
  Code
} from 'lucide-react';

// ==========================================
// FIREBASE & ETSY CONFIGURATION
// Paste your existing Firebase keys here
// ==========================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const ETSY_BENCH_URL = "https://www.etsy.com/shop/GlitchyGrizzly";
const ETSY_CARGO_URL = "https://www.etsy.com/shop/GlitchyGrizzly";

let db = null;
let auth = null;
try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    signInAnonymously(auth).catch(() => {});
  }
} catch (err) {
  console.warn("Firebase init skipped:", err);
}

// ==========================================
// BAMBU LAB PLA COLOR PALETTE (20 COLORS)
// Shared by both The Bench Matrix & The Cargo Matrix
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

const P1S_MAX_HEIGHT_MM = 250.0;
const TIER_CLEARANCE_PER_DRAWER_MM = 2.15;
const TIER_FRAME_BASE_TOP_MM = 1.5;

// ==========================================
// INTERACTIVE POPUP EXPLANATION COMPONENT
// ==========================================
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

// ==========================================
// 3D HELPER: DYNAMIC CANVAS TEXTURE FOR DRAWER LABELS
// ==========================================
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

// ==========================================
// 3D HELPER: TRANSPARENT CANVAS TEXTURE FOR CARGO LID INLAY
// Transparent background ensures the 3D lid MeshStandardMaterial
// shows through with identical lighting & color as the rest of the box
// ==========================================
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
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [designCode, setDesignCode] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState(false);
  const [recallCode, setRecallCode] = useState('');
  const [statusBanner, setStatusBanner] = useState(null);
  const [modalTab, setModalTab] = useState('spec'); // 'spec' | 'scad'
  const [scadCopied, setScadCopied] = useState(false);
  const logoClickRef = useRef({ count: 0, timer: null });

  const ADMIN_SECRET_PIN = '1024';

  const triggerHiddenAdmin = useCallback(() => {
    setAdminMode(true);
    setAdminUnlocked(false);
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
  // THE BENCH MATRIX STATE
  // ==========================================
  const [sizePreset, setSizePreset] = useState('Medium');
  const [tiers, setTiers] = useState(2);
  const [drawersPerTier, setDrawersPerTier] = useState(5);
  const [opening, setOpening] = useState('Left');
  const [handlePos, setHandlePos] = useState('Front');
  const [width, setWidth] = useState(140);
  const [depth, setDepth] = useState(120);
  const [height, setHeight] = useState(15.4);
  const [lockToP1S, setLockToP1S] = useState(false);

  const [enableLabelSlot, setEnableLabelSlot] = useState(true);
  const [labelWidth, setLabelWidth] = useState(30);
  const [labelHeight, setLabelHeight] = useState(11);
  const [labelFont, setLabelFont] = useState('Inter');
  const [labels, setLabels] = useState({
    tier_1_box_4: 'M3 Bolts',
    tier_1_box_3: 'Hex Nuts',
    tier_0_box_4: 'Nozzles'
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
  // THE CARGO MATRIX STATE
  // ==========================================
  const [cargoWidth, setCargoWidth] = useState(120);
  const [cargoLength, setCargoLength] = useState(90);
  const [cargoHeight, setCargoHeight] = useState(20);
  const [cargoCompX, setCargoCompX] = useState(2);
  const [cargoCompY, setCargoCompY] = useState(2);
  const [cargoBoxColorId, setCargoBoxColorId] = useState('hot-pink');
  const [cargoTextColorId, setCargoTextColorId] = useState('matte-charcoal');
  const [cargoText, setCargoText] = useState('FIELD KIT');
  const [cargoFont, setCargoFont] = useState('Impact');
  const [cargoBorder, setCargoBorder] = useState(true);
  const [foldAngle, setFoldAngle] = useState(35);

  const activeCargoBoxColor = useMemo(
    () => BAMBU_PLA_COLORS.find((c) => c.id === cargoBoxColorId) || BAMBU_PLA_COLORS[17],
    [cargoBoxColorId]
  );
  const activeCargoTextColor = useMemo(
    () => BAMBU_PLA_COLORS.find((c) => c.id === cargoTextColorId) || BAMBU_PLA_COLORS[0],
    [cargoTextColorId]
  );

  // Dynamic Label Caps for Bench Matrix
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

  const applyPreset = (preset) => {
    setSizePreset(preset);
    if (preset === 'Small') {
      setTiers(1);
      setDrawersPerTier(4);
      setWidth(100);
      setDepth(90);
      setHeight(14);
    } else if (preset === 'Medium') {
      setTiers(2);
      setDrawersPerTier(5);
      setWidth(140);
      setDepth(120);
      setHeight(15.4);
    } else if (preset === 'Large') {
      setTiers(3);
      setDrawersPerTier(6);
      setWidth(180);
      setDepth(120);
      setHeight(18);
    }
  };

  const getDividerForDrawer = useCallback(
    (t, b) => drawerDividers[`tier_${t}_box_${b}`] || { h: 1, v: 1 },
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

  const activeCasingColor = useMemo(
    () => BAMBU_PLA_COLORS.find((c) => c.id === casingColorId) || BAMBU_PLA_COLORS[16],
    [casingColorId]
  );
  const activeDrawerColor = useMemo(
    () => BAMBU_PLA_COLORS.find((c) => c.id === drawerColorId) || BAMBU_PLA_COLORS[9],
    [drawerColorId]
  );

  const calculatePrice = () => {
    if (activeTab === 'storage') {
      const basePrice = 16;
      const volumeFactor = ((width * depth * height) / 25000) * 1.35;
      const totalDrawers = tiers * drawersPerTier;
      const drawersCost = totalDrawers * (1.75 + volumeFactor * 0.45);
      const tierFrameCost = tiers * 4.5;
      return basePrice + tierFrameCost + drawersCost;
    } else {
      const vol = (cargoWidth * cargoLength * cargoHeight * 2) / 10000;
      return 14 + vol * 0.85 + (cargoCompX * cargoCompY) * 0.5;
    }
  };

  const generateSpecSheet = (codeToDisplay = designCode) => {
    let spec = `====================================================\n`;
    spec += `   FIELDMATRIX 3D - PRINT & SHIP SPECIFICATION\n`;
    spec += `====================================================\n`;
    spec += `Design Code  : ${codeToDisplay || 'PENDING'}\n`;
    spec += `Product Line : ${
      activeTab === 'storage' ? 'The Bench Matrix' : 'The Cargo Matrix'
    }\n`;
    spec += `Est. Price   : $${calculatePrice().toFixed(2)}\n\n`;

    if (activeTab === 'storage') {
      spec += `[ 1. GEOMETRY & CONFIGURATION ]\n`;
      spec += `- Number of Tiers    : ${tiers}\n`;
      spec += `- Drawers per Tier   : ${drawersPerTier} (${tiers * drawersPerTier} Total Drawers)\n`;
      spec += `- Single Tier Height : ${singleTierHeightMm} mm (Max 250.0 mm)\n`;
      spec += `- Opening Pivot Side : ${opening} Hinge Rod\n`;
      spec += `- Finger Pull Handle : ${handlePos} Curved Corner Notch\n`;
      spec += `- Outer Width        : ${width} mm\n`;
      spec += `- Outer Depth        : ${depth} mm\n`;
      spec += `- Drawer Height      : ${height} mm\n\n`;
      spec += `[ 2. COLORS (DUAL-COLOR BAMBU LAB PLA) ]\n`;
      spec += `- Outer Casing & Rod : ${activeCasingColor.name} (${activeCasingColor.hex})\n`;
      spec += `- Drawers & Dividers : ${activeDrawerColor.name} (${activeDrawerColor.hex})\n\n`;
      spec += `[ 3. LABEL SLOT SETTINGS ]\n`;
      spec += `- Enable Label Slot  : ${enableLabelSlot ? 'YES' : 'NO'}\n`;
      if (enableLabelSlot) {
        spec += `- Label Width × H    : ${labelWidth} mm × ${labelHeight} mm (Font: ${labelFont})\n`;
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
      spec += `[ CARGO CASE CONFIGURATION ]\n`;
      spec += `- Width (Hinge Axis) : ${cargoWidth} mm\n`;
      spec += `- Length (Each Half) : ${cargoLength} mm\n`;
      spec += `- Height (Each Half) : ${cargoHeight} mm\n`;
      spec += `- Interior Grid      : ${cargoCompX} Columns × ${cargoCompY} Rows\n`;
      spec += `- Box Filament       : ${activeCargoBoxColor.name} (${activeCargoBoxColor.hex})\n`;
      spec += `- Text Inlay Color   : ${activeCargoTextColor.name} (${activeCargoTextColor.hex})\n`;
      spec += `- Custom Lid Text    : "${cargoText}" (Font: ${cargoFont})\n`;
      spec += `- Lid Border Inlay   : ${cargoBorder ? 'YES (Flush Inlay Frame)' : 'NO'}\n`;
    }
    return spec;
  };

  // ==========================================
  // PARAMETRIC OPENSCAD GENERATOR FOR CARGO MATRIX
  // Generates print-in-place clamshell STL geometry
  // with Flush Multi-Color Inlay for BOTH Lid Text & Lid Border Frame
  // ==========================================
  const generateScadCode = () => {
    const cleanText = (cargoText || '').replace(/"/g, '\\"');
    return `// ==========================================
// FIELDMATRIX 3D - THE CARGO MATRIX OPENSCAD FILE
// Design Code: ${designCode || 'CUSTOM'}
// Box Color: ${activeCargoBoxColor.name} (${activeCargoBoxColor.hex})
// Inlay Color (Text & Border): ${activeCargoTextColor.name} (${activeCargoTextColor.hex})
// ==========================================

$fn = 64;

// Export Mode: "both" (preview), "box" (body STL), or "inlay" (text + border inlay STL)
render_part = "both";

// Primary Dimensions (mm)
box_width = ${cargoWidth};       // Width along hinge axis
half_length = ${cargoLength};    // Front-to-back length of each half
half_height = ${cargoHeight};    // Height of each half shell
comp_cols = ${cargoCompX};       // Interior X columns
comp_rows = ${cargoCompY};       // Interior Y rows

// Structural Parameters
wall_thick = 2.2;
floor_thick = 2.0;
div_thick = 1.6;
corner_r = 3.0;
hinge_gap = 1.6;
hinge_r = 3.8;
pin_r = 2.0;
pin_clearance = 0.35;
inlay_depth = 0.8;

// Lid Text & Border Inlay Parameters
lid_text = "${cleanText}";
lid_font = "${cargoFont}";
enable_lid_border = ${cargoBorder ? 'true' : 'false'};
border_inset = 5.0;
border_line_width = 2.0;

module rounded_outer_box(w, l, h, r) {
  hull() {
    for (x = [-w/2 + r, w/2 - r])
      for (y = [-l/2 + r, l/2 - r])
        translate([x, y, 0])
          cylinder(r = r, h = h);
  }
}

// 2D Profile for both the Lid Text and Lid Rectangular Border Inlay
module lid_inlay_2d_profile() {
  inner_w = box_width - wall_thick * 2;
  inner_l = half_length - wall_thick * 2;

  if (len(lid_text) > 0) {
    mirror([1, 0, 0])
      text(
        lid_text,
        size = min(inner_w / max(6, len(lid_text)) * 1.35, inner_l * 0.28),
        font = lid_font,
        halign = "center",
        valign = "center"
      );
  }

  if (enable_lid_border) {
    bw = box_width - border_inset * 2;
    bl = half_length - border_inset * 2;
    difference() {
      square([bw, bl], center = true);
      square([bw - border_line_width * 2, bl - border_line_width * 2], center = true);
    }
  }
}

// 3D Flush Inlay Solid (sits on the exterior bottom face Z = 0 of the lid half)
module lid_inlay_solid() {
  color("${activeCargoTextColor.hex}")
    translate([0, -half_length/2 - hinge_gap/2, 0])
      linear_extrude(height = inlay_depth)
        lid_inlay_2d_profile();
}

module half_shell(is_base = true) {
  inner_w = box_width - wall_thick * 2;
  inner_l = half_length - wall_thick * 2;
  div_h = half_height - floor_thick - 1.0;

  difference() {
    rounded_outer_box(box_width, half_length, half_height, corner_r);
    translate([0, 0, floor_thick])
      rounded_outer_box(inner_w, inner_l, half_height, max(1.0, corner_r - wall_thick));

    // Cut matching 0.8mm recess into Lid Exterior (Z = 0 face) for flush multi-color inlay
    if (!is_base) {
      translate([0, 0, -0.01])
        linear_extrude(height = inlay_depth + 0.01)
          lid_inlay_2d_profile();
    }
  }

  // Interior Grid Dividers for Base Half
  if (is_base) {
    if (comp_cols > 1) {
      for (i = [1 : comp_cols - 1]) {
        x_pos = -inner_w/2 + (inner_w / comp_cols) * i;
        translate([x_pos - div_thick/2, -inner_l/2, floor_thick])
          cube([div_thick, inner_l, div_h]);
      }
    }
    if (comp_rows > 1) {
      for (j = [1 : comp_rows - 1]) {
        y_pos = -inner_l/2 + (inner_l / comp_rows) * j;
        translate([-inner_w/2, y_pos - div_thick/2, floor_thick])
          cube([inner_w, div_thick, div_h]);
      }
    }
  }
}

module print_in_place_hinge() {
  knuckle_count = 5;
  total_hinge_span = box_width - 16;
  knuckle_w = total_hinge_span / knuckle_count;

  // Continuous Print-in-Place Hinge Pin
  translate([-total_hinge_span/2 - 2, 0, half_height])
    rotate([0, 90, 0])
      cylinder(r = pin_r, h = total_hinge_span + 4);

  for (k = [0 : knuckle_count - 1]) {
    kx = -total_hinge_span/2 + k * knuckle_w;
    difference() {
      hull() {
        translate([kx + 0.4, 0, half_height])
          rotate([0, 90, 0])
            cylinder(r = hinge_r, h = knuckle_w - 0.8);
        if (k % 2 == 0) {
          translate([kx + 0.4, hinge_gap/2, half_height - hinge_r * 1.5])
            cube([knuckle_w - 0.8, 2.2, hinge_r * 1.5]);
        } else {
          translate([kx + 0.4, -hinge_gap/2 - 2.2, half_height - hinge_r * 1.5])
            cube([knuckle_w - 0.8, 2.2, hinge_r * 1.5]);
        }
      }
      if (k % 2 == 1) {
        translate([kx, 0, half_height])
          rotate([0, 90, 0])
            cylinder(r = pin_r + pin_clearance, h = knuckle_w + 1);
      }
    }
  }
}

module front_latch_wedge() {
  latch_w = min(34, box_width * 0.35);
  translate([-latch_w/2, half_length + hinge_gap/2 - 0.2, half_height * 0.28])
    cube([latch_w, 2.2, half_height * 0.55]);
}

module cargo_box_body() {
  color("${activeCargoBoxColor.hex}")
  union() {
    translate([0, half_length/2 + hinge_gap/2, 0])
      half_shell(true);

    translate([0, -half_length/2 - hinge_gap/2, 0])
      half_shell(false);

    print_in_place_hinge();
    front_latch_wedge();
  }
}

// Render output based on render_part selection
if (render_part == "box") {
  cargo_box_body();
} else if (render_part == "inlay") {
  lid_inlay_solid();
} else {
  cargo_box_body();
  lid_inlay_solid();
}
`;
  };

  const downloadScadFile = () => {
    const blob = new Blob([generateScadCode()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${designCode || 'CARGO-MATRIX'}.scad`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenSpecModal = async () => {
    const prefix = activeTab === 'storage' ? 'BENCH-' : 'CARGO-';
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCode = `${prefix}${randomChars}`;
    setDesignCode(newCode);
    setModalTab('spec');
    setShowModal(true);

    const payload = {
      designCode: newCode,
      productLine: activeTab,
      createdAt: serverTimestamp(),
      ...(activeTab === 'storage'
        ? {
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
            labelFont,
            labels,
            drawerDividers,
            casingColorId,
            drawerColorId
          }
        : {
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
          })
    };

    if (db && auth && auth.currentUser) {
      try {
        await setDoc(doc(db, 'custom_orders', newCode), payload);
      } catch (e) {
        console.warn('Could not save to Firestore:', e);
      }
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
      const cleanCode = recallCode.trim().toUpperCase();
      const snap = await getDoc(doc(db, 'custom_orders', cleanCode));
      if (snap.exists()) {
        const data = snap.data();
        setDesignCode(cleanCode);
        if (data.productLine === 'storage') {
          setActiveTab('storage');
          setTiers(data.tiers ?? 2);
          setDrawersPerTier(data.drawersPerTier ?? 5);
          setOpening(data.opening ?? 'Left');
          setHandlePos(data.handlePos ?? 'Front');
          setWidth(data.width ?? 140);
          setDepth(data.depth ?? 120);
          setHeight(data.height ?? 15.4);
          setEnableLabelSlot(data.enableLabelSlot ?? true);
          setLabelWidth(data.labelWidth ?? 30);
          setLabelHeight(data.labelHeight ?? 11);
          setLabelFont(data.labelFont ?? 'Inter');
          setLabels(data.labels || {});
          setDrawerDividers(data.drawerDividers || {});
          setCasingColorId(data.casingColorId || 'cocoa-brown');
          setDrawerColorId(data.drawerColorId || 'matte-latte-brown');
        } else {
          setActiveTab('cargo');
          setCargoWidth(data.cargoWidth ?? 120);
          setCargoLength(data.cargoLength ?? 90);
          setCargoHeight(data.cargoHeight ?? 20);
          setCargoCompX(data.cargoCompX ?? 2);
          setCargoCompY(data.cargoCompY ?? 2);
          if (data.cargoBoxColorId) setCargoBoxColorId(data.cargoBoxColorId);
          if (data.cargoTextColorId) setCargoTextColorId(data.cargoTextColorId);
          if (data.cargoText !== undefined) setCargoText(data.cargoText);
          if (data.cargoFont) setCargoFont(data.cargoFont);
          if (data.cargoBorder !== undefined) setCargoBorder(data.cargoBorder);
        }
        setStatusBanner({ type: 'success', text: `Loaded customer order ${cleanCode}` });
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

    const domElem = renderer.domElement;
    const onPointerDown = (e) => {
      controlsState.current.isDragging = true;
      controlsState.current.isPanning = e.button === 2 || e.shiftKey;
      controlsState.current.prevX = e.clientX;
      controlsState.current.prevY = e.clientY;
    };
    const onPointerMove = (e) => {
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
    const onPointerUp = () => {
      controlsState.current.isDragging = false;
    };
    const onWheel = (e) => {
      e.preventDefault();
      controlsState.current.radius = Math.max(100, Math.min(3500, controlsState.current.radius + e.deltaY * 0.45));
    };

    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
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

          drawerLocal.add(new THREE.Mesh(floorGeo, drawerMat));
          const wallMesh = new THREE.Mesh(perimeterWallGeo, drawerMat);
          wallMesh.position.y = drawerFloorThick;
          drawerLocal.add(wallMesh);

          const divConfig = getDividerForDrawer(t, b);
          const innerSpanW = dW - drawerWallThick * 2 - 2;
          const innerSpanD = dD - drawerWallThick * 2 - 2;
          const divHeight = Math.max(2, dH - drawerFloorThick - 1.2);

          for (let i = 1; i < (divConfig.h || 1); i++) {
            const zPos = -innerSpanD / 2 + (innerSpanD / divConfig.h) * i;
            const hDiv = new THREE.Mesh(new THREE.BoxGeometry(innerSpanW, divHeight, 1.4), drawerMat);
            hDiv.position.set(0, drawerFloorThick + divHeight / 2, zPos);
            drawerLocal.add(hDiv);
          }
          for (let j = 1; j < (divConfig.v || 1); j++) {
            const xPos = -innerSpanW / 2 + (innerSpanW / divConfig.v) * j;
            const vDiv = new THREE.Mesh(new THREE.BoxGeometry(1.4, divHeight, innerSpanD), drawerMat);
            vDiv.position.set(xPos, drawerFloorThick + divHeight / 2, 0);
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
    } else {
      // ==========================================
      // THE CARGO MATRIX (PRINT-IN-PLACE CLAMSHELL)
      // ==========================================
      const boxMat = new THREE.MeshStandardMaterial({
        color: activeCargoBoxColor.hex,
        roughness: activeCargoBoxColor.roughness ?? 0.45,
        metalness: activeCargoBoxColor.metalness ?? 0.08
      });

      const wall = 2.2;
      const floorT = 2.0;
      const hingeGap = 1.6;

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
          const divH = Math.max(2, wallH - 1.2);
          const divY = floorT + divH / 2;

          if (cargoCompX > 1) {
            for (let i = 1; i < cargoCompX; i++) {
              const xPos = -innerW / 2 + (innerW / cargoCompX) * i;
              const divX = new THREE.Mesh(new THREE.BoxGeometry(1.6, divH, innerL), boxMat);
              divX.position.set(xPos, divY, 0);
              shellGroup.add(divX);
            }
          }
          if (cargoCompY > 1) {
            for (let j = 1; j < cargoCompY; j++) {
              const zPos = -innerL / 2 + (innerL / cargoCompY) * j;
              const divZ = new THREE.Mesh(new THREE.BoxGeometry(innerW, divH, 1.6), boxMat);
              divZ.position.set(0, divY, zPos);
              shellGroup.add(divZ);
            }
          }

          const latchGeo = new THREE.BoxGeometry(Math.min(34, cargoWidth * 0.35), wallH * 0.55, 2.2);
          const latchMesh = new THREE.Mesh(latchGeo, boxMat);
          latchMesh.position.set(0, wallY, cargoLength / 2 + 1.0);
          shellGroup.add(latchMesh);
        }

        return shellGroup;
      };

      const baseHalf = createHalfShell(true);
      baseHalf.position.set(0, 0, cargoLength / 2 + hingeGap / 2);
      group.add(baseHalf);

      const knuckleCount = 5;
      const totalHingeSpan = cargoWidth - 16;
      const knuckleW = totalHingeSpan / knuckleCount;
      for (let k = 0; k < knuckleCount; k++) {
        const kx = -totalHingeSpan / 2 + knuckleW * (k + 0.5);
        const knuckleGeo = new THREE.CylinderGeometry(3.4, 3.4, knuckleW - 0.8, 20);
        knuckleGeo.rotateZ(Math.PI / 2);
        const knuckleMesh = new THREE.Mesh(knuckleGeo, boxMat);
        knuckleMesh.position.set(kx, cargoHeight, 0);
        group.add(knuckleMesh);
      }

      const lidPivot = new THREE.Group();
      lidPivot.position.set(0, cargoHeight, 0);
      lidPivot.rotation.x = THREE.MathUtils.degToRad(foldAngle);

      const lidHalf = createHalfShell(false);
      lidHalf.position.set(0, -cargoHeight, -cargoLength / 2 - hingeGap / 2);

      const lidTex = createCargoLidTexture(
        cargoText,
        activeCargoTextColor.hex,
        cargoFont,
        cargoBorder
      );
      const inlayPlaneGeo = new THREE.PlaneGeometry(cargoWidth - 2, cargoLength - 2);
      const inlayPlaneMat = new THREE.MeshStandardMaterial({
        map: lidTex,
        transparent: true,
        roughness: activeCargoTextColor.roughness ?? 0.5,
        metalness: activeCargoTextColor.metalness ?? 0.08,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        side: THREE.DoubleSide
      });
      const inlayMesh = new THREE.Mesh(inlayPlaneGeo, inlayPlaneMat);
      inlayMesh.rotation.x = Math.PI / 2;
      inlayMesh.position.set(0, -0.08, 0);
      lidHalf.add(inlayMesh);

      lidPivot.add(lidHalf);
      group.add(lidPivot);

      if (showDimensions) {
        const wSprite = createDimensionSprite(`${cargoWidth} mm W`);
        wSprite.position.set(0, 6, cargoLength + 24);
        group.add(wSprite);

        const lSprite = createDimensionSprite(`${cargoLength} mm L`);
        lSprite.position.set(cargoWidth / 2 + 36, 6, cargoLength / 2);
        group.add(lSprite);

        const hSprite = createDimensionSprite(`${cargoHeight} mm H (half)`);
        hSprite.position.set(-cargoWidth / 2 - 36, cargoHeight / 2, cargoLength / 2);
        group.add(hSprite);
      }
    }
  }, [
    activeTab, tiers, drawersPerTier, opening, handlePos, width, depth, height,
    enableLabelSlot, labelWidth, labelHeight, maxLabelWidth, maxLabelHeight, labelFont,
    labels, drawerDividers, getDividerForDrawer, activeCasingColor, activeDrawerColor,
    explodedView, xrayMode, showDimensions, singleTierHeightMm, isOverP1SLimit,
    cargoWidth, cargoLength, cargoHeight, cargoCompX, cargoCompY, activeCargoBoxColor,
    activeCargoTextColor, cargoText, cargoFont, cargoBorder, foldAngle
  ]);

  useEffect(() => {
    const pivotSign = opening === 'Left' ? -1 : 1;
    const maxSwingRad = THREE.MathUtils.degToRad(68);
    drawerPivotsRef.current.forEach((item) => {
      const isIndividuallyOpen = !!openDrawersMap[item.drawerKey];
      const effectiveRatio = Math.max(swingOpenAmount, isIndividuallyOpen ? 0.78 : 0);
      item.targetAngle = pivotSign * effectiveRatio * maxSwingRad;
    });
  }, [swingOpenAmount, openDrawersMap, opening]);

  return (
    <div className="flex flex-col-reverse md:flex-row h-screen w-screen overflow-hidden bg-[#0b0f19] text-[#e2e8f0] font-sans select-none">
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
          box-shadow: 0 0 8px rgba(244, 63, 94, 0.55);
          cursor: pointer;
        }
      `}</style>

      {/* STATUS BANNER NOTIFICATION */}
      {statusBanner && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-xs font-bold shadow-2xl border flex items-center gap-2 ${
            statusBanner.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
              : 'bg-red-950/95 border-red-500 text-red-200'
          }`}
        >
          <span>{statusBanner.text}</span>
          <button
            onClick={() => setStatusBanner(null)}
            className="ml-2 text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* LEFT SIDEBAR CONTROLS */}
      <aside className="w-full md:w-[390px] lg:w-[400px] shrink-0 h-[54vh] md:h-full bg-[#111827] border-t md:border-t-0 md:border-r border-[#1e293b] flex flex-col z-20 shadow-2xl">
        <div className="px-4 py-3 border-b border-[#1e293b] bg-[#0f172a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                onClick={handleLogoSecretClick}
                className="w-8 h-8 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8] cursor-pointer"
              >
                <Package size={18} />
              </div>
              <div>
                <span className="font-black tracking-wider text-sm text-white uppercase">
                  FieldMatrix 3D
                </span>
                <p className="text-[11px] text-[#38bdf8] font-medium">
                  Glitchy Grizzly • <span className="text-[#94a3b8]">You configure your Matrix. We print &amp; ship.</span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 bg-[#090d16] p-1 rounded-lg border border-[#1e293b] mt-2.5">
            <button
              onClick={() => setActiveTab('storage')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'storage'
                  ? 'bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/40'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Sliders size={13} /> The Bench Matrix
            </button>
            <button
              onClick={() => setActiveTab('cargo')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'cargo'
                  ? 'bg-[#1e293b] text-[#38bdf8] border border-[#38bdf8]/40'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Box size={13} /> The Cargo Matrix
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5 custom-scrollbar">
          {activeTab === 'storage' ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                {['Small', 'Medium', 'Large'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => applyPreset(preset)}
                    className={`py-1.5 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      sizePreset === preset
                        ? 'bg-[#3b1526] border-[#f43f5e]/60 text-[#fecdd3]'
                        : 'bg-[#0f172a] border-[#1e293b] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* CONFIGURATION */}
              <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl">
                <button
                  onClick={() => toggleSection('config')}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase text-[#38bdf8] border-b border-[#1e293b]"
                >
                  <span className="flex items-center gap-1.5">
                    <Sliders size={13} /> Configuration
                  </span>
                  {openSections.config ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {openSections.config && (
                  <div className="p-3.5 space-y-3.5">
                    <div className="flex items-center justify-between bg-[#151e31] px-2.5 py-2 rounded-lg border border-[#1e293b]">
                      <div className="flex items-center text-xs text-[#cbd5e1]">
                        {lockToP1S ? <Lock size={13} className="text-[#f43f5e] mr-1.5" /> : <Unlock size={13} className="text-[#64748b] mr-1.5" />}
                        <span>Lock to 250 mm Max Rod Height</span>
                        <InfoPopover
                          title="250 mm Solid Rod Limit"
                          text="Each tier uses a single continuous vertical pivot rod. Because the rod is printed as one solid piece, a single tier cannot exceed 250 mm in height."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setLockToP1S(!lockToP1S)}
                        className={`w-9 h-5 rounded-full transition-colors relative ${lockToP1S ? 'bg-[#f43f5e]' : 'bg-[#334155]'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${lockToP1S ? 'translate-x-4' : ''}`} />
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold">Number of tiers</span>
                        <span className="text-[#fecdd3] font-bold">{tiers}</span>
                      </div>
                      <input type="range" min="1" max="5" value={tiers} onChange={(e) => setTiers(parseInt(e.target.value, 10))} className="w-full box-studio-slider" />
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
                          const v = parseInt(e.target.value, 10);
                          setDrawersPerTier(lockToP1S ? Math.min(v, maxAllowedDrawersForCurrentHeight) : v);
                        }}
                        className="w-full box-studio-slider"
                      />
                    </div>

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

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold">↔ Width (mm)</span>
                        <span className="text-[#fecdd3] font-bold">{width} mm</span>
                      </div>
                      <input type="range" min="50" max="200" value={width} onChange={(e) => setWidth(parseInt(e.target.value, 10))} className="w-full box-studio-slider" />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold">↗ Depth (mm)</span>
                        <span className="text-[#fecdd3] font-bold">{depth} mm</span>
                      </div>
                      <input type="range" min="58" max="120" value={depth} onChange={(e) => setDepth(parseInt(e.target.value, 10))} className="w-full box-studio-slider" />
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
                          const v = parseFloat(e.target.value);
                          setHeight(lockToP1S ? Math.min(v, maxAllowedHeightForCurrentDrawers) : v);
                        }}
                        className="w-full box-studio-slider"
                      />
                    </div>
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
                        {n}
                      </button>
                    ))}
                    <span className="text-[10px] text-[#94a3b8] ml-2">V:</span>
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={`bv_${n}`}
                        onClick={() => applyBatchDividers(batchH, n)}
                        className={`w-5 h-5 rounded text-[10px] font-bold ${batchV === n ? 'bg-[#f43f5e] text-white' : 'bg-[#0b0f19] text-[#94a3b8]'}`}
                      >
                        {n}
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
                                      {n}
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
                                      {n}
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
          ) : (
            /* ==========================================
               THE CARGO MATRIX SIDEBAR CONTROLS
            ========================================== */
            <div className="space-y-3.5">
              <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-3.5 space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#38bdf8] flex items-center gap-1.5">
                  <Tag size={13} /> Custom Lid Text &amp; Colors
                </h3>

                <div>
                  <label className="text-[11px] text-[#94a3b8] mb-1 block">Custom Lid Inlay Text</label>
                  <input
                    type="text"
                    value={cargoText}
                    onChange={(e) => setCargoText(e.target.value)}
                    placeholder="Enter Lid Text..."
                    className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-[#38bdf8] rounded-lg px-3 py-2 text-xs text-white font-bold tracking-wider outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#94a3b8] mb-1 block">Lid Font Style</label>
                  <select
                    value={cargoFont}
                    onChange={(e) => setCargoFont(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-[#1e293b] rounded-lg p-2 text-xs text-white"
                  >
                    <option value="Impact">Impact (Heavy Stencil)</option>
                    <option value="Inter">Inter Black</option>
                    <option value="JetBrains Mono">Technical Mono</option>
                    <option value="Arial Black">Bold Industrial</option>
                  </select>
                </div>

                <div className="flex items-center justify-between bg-[#151e31] px-3 py-2 rounded-lg border border-[#1e293b]">
                  <span className="text-xs font-semibold text-[#e2e8f0]">Lid Rectangular Border Inlay</span>
                  <button
                    type="button"
                    onClick={() => setCargoBorder(!cargoBorder)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      cargoBorder ? 'bg-[#f43f5e]' : 'bg-[#334155]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        cargoBorder ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const temp = cargoBoxColorId;
                    setCargoBoxColorId(cargoTextColorId);
                    setCargoTextColorId(temp);
                  }}
                  className="w-full py-1.5 px-2 rounded bg-[#151e31] hover:bg-[#1e293b] border border-[#334155] text-[11px] font-semibold text-[#e2e8f0] flex items-center justify-center gap-1.5"
                >
                  <ArrowLeftRight size={12} className="text-[#38bdf8]" /> Swap Box &amp; Text Colors
                </button>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#cbd5e1] font-semibold">1. Box, Hinge &amp; Latch Color</span>
                    <span className="text-[#fecdd3] text-[10px] font-bold">{activeCargoBoxColor.name}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {BAMBU_PLA_COLORS.map((col) => (
                      <button
                        key={`cbox_${col.id}`}
                        onClick={() => setCargoBoxColorId(col.id)}
                        className={`p-1 rounded border flex flex-col items-center gap-1 ${
                          cargoBoxColorId === col.id ? 'border-[#f43f5e] bg-[#3b1526]/60' : 'border-[#1e293b] bg-[#151e31]'
                        }`}
                      >
                        <span className="w-full h-3.5 rounded-sm" style={{ backgroundColor: col.hex }} />
                        <span className="text-[9px] truncate w-full text-center">{col.name.replace('Matte ', '')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#cbd5e1] font-semibold">2. Lid Text &amp; Border Inlay Color</span>
                    <span className="text-[#fecdd3] text-[10px] font-bold">{activeCargoTextColor.name}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {BAMBU_PLA_COLORS.map((col) => (
                      <button
                        key={`ctxt_${col.id}`}
                        onClick={() => setCargoTextColorId(col.id)}
                        className={`p-1 rounded border flex flex-col items-center gap-1 ${
                          cargoTextColorId === col.id ? 'border-[#f43f5e] bg-[#3b1526]/60' : 'border-[#1e293b] bg-[#151e31]'
                        }`}
                      >
                        <span className="w-full h-3.5 rounded-sm" style={{ backgroundColor: col.hex }} />
                        <span className="text-[9px] truncate w-full text-center">{col.name.replace('Matte ', '')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-3.5 space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#38bdf8] flex items-center gap-1.5">
                  <Box size={13} /> Case Dimensions &amp; Grid
                </h3>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>↔ Width (Hinge Axis)</span>
                    <span className="text-[#fecdd3] font-bold">{cargoWidth} mm</span>
                  </div>
                  <input type="range" min="60" max="220" value={cargoWidth} onChange={(e) => setCargoWidth(parseInt(e.target.value, 10))} className="w-full box-studio-slider" />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>↗ Length (Each Half)</span>
                    <span className="text-[#fecdd3] font-bold">{cargoLength} mm</span>
                  </div>
                  <input type="range" min="50" max="150" value={cargoLength} onChange={(e) => setCargoLength(parseInt(e.target.value, 10))} className="w-full box-studio-slider" />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>↕ Height (Each Half)</span>
                    <span className="text-[#fecdd3] font-bold">{cargoHeight} mm</span>
                  </div>
                  <input type="range" min="12" max="50" value={cargoHeight} onChange={(e) => setCargoHeight(parseInt(e.target.value, 10))} className="w-full box-studio-slider" />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Columns (X)</span>
                      <span className="text-[#fecdd3] font-bold">{cargoCompX}</span>
                    </div>
                    <input type="range" min="1" max="6" value={cargoCompX} onChange={(e) => setCargoCompX(parseInt(e.target.value, 10))} className="w-full box-studio-slider" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Rows (Y)</span>
                      <span className="text-[#fecdd3] font-bold">{cargoCompY}</span>
                    </div>
                    <input type="range" min="1" max="6" value={cargoCompY} onChange={(e) => setCargoCompY(parseInt(e.target.value, 10))} className="w-full box-studio-slider" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* STICKY FOOTER */}
        <div className="p-3.5 bg-[#0f172a] border-t border-[#1e293b] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#94a3b8]">
              {activeTab === 'storage'
                ? `${tiers} Tiers • ${tiers * drawersPerTier} Drawers`
                : `${cargoWidth}×${cargoLength}mm • ${cargoCompX}×${cargoCompY} Grid`}
            </span>
            <span className="text-lg font-black text-[#38bdf8]">${calculatePrice().toFixed(2)}</span>
          </div>

          <button
            onClick={handleOpenSpecModal}
            className="w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-[#f43f5e] hover:bg-[#fb7185] text-white shadow-lg"
          >
            <FileText size={15} /> Generate Print Spec Sheet
          </button>
        </div>
      </aside>

      {/* RIGHT 3D VIEWPORT */}
      <main className="w-full md:flex-1 h-[46vh] md:h-full flex flex-col relative bg-[#0d121d] overflow-hidden">
        <header className="min-h-12 shrink-0 bg-[#0f172a] border-b border-[#1e293b] px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5">
              <Sparkles size={14} /> 3D Preview
            </span>
            {activeTab === 'storage' ? (
              <div className="flex items-center gap-2 bg-[#151e31] px-2.5 py-1 rounded-lg border border-[#1e293b]">
                <span className="text-[11px] font-semibold">Swing:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={swingOpenAmount}
                  onChange={(e) => setSwingOpenAmount(parseFloat(e.target.value))}
                  className="w-20 box-studio-slider"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#151e31] px-2.5 py-1 rounded-lg border border-[#1e293b]">
                <span className="text-[11px] font-semibold">Fold Lid ({foldAngle}°):</span>
                <input
                  type="range"
                  min="0"
                  max="180"
                  value={foldAngle}
                  onChange={(e) => setFoldAngle(parseInt(e.target.value, 10))}
                  className="w-24 box-studio-slider"
                />
                <button
                  onClick={() => setFoldAngle(foldAngle > 90 ? 0 : 180)}
                  className="px-2 py-0.5 rounded bg-[#3b1526] border border-[#f43f5e]/50 text-[10px] font-bold text-[#fecdd3]"
                >
                  {foldAngle > 90 ? 'Lay Flat (0°)' : 'Close Box (180°)'}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {activeTab === 'storage' && (
              <>
                <button
                  onClick={() => setExplodedView(!explodedView)}
                  className={`px-2 py-1 rounded text-[11px] font-medium border ${
                    explodedView ? 'bg-[#3b1526] border-[#f43f5e] text-[#fecdd3]' : 'bg-[#151e31] border-[#1e293b] text-[#94a3b8]'
                  }`}
                >
                  Exploded
                </button>
                <button
                  onClick={() => setXrayMode(!xrayMode)}
                  className={`px-2 py-1 rounded text-[11px] font-medium border ${
                    xrayMode ? 'bg-[#3b1526] border-[#f43f5e] text-[#fecdd3]' : 'bg-[#151e31] border-[#1e293b] text-[#94a3b8]'
                  }`}
                >
                  X-Ray
                </button>
              </>
            )}
            <button
              onClick={() => setShowDimensions(!showDimensions)}
              className={`px-2 py-1 rounded text-[11px] font-medium border flex items-center gap-1 ${
                showDimensions ? 'bg-[#38bdf8]/15 border-[#38bdf8] text-[#38bdf8]' : 'bg-[#151e31] border-[#1e293b] text-[#94a3b8]'
              }`}
            >
              <Eye size={12} /> Dimensions
            </button>
            <button
              onClick={fitCameraToModel}
              className="px-2 py-1 rounded text-[11px] font-medium bg-[#151e31] border border-[#1e293b] text-[#e2e8f0] flex items-center gap-1"
            >
              <Maximize2 size={12} /> Fit
            </button>
            <button
              onClick={fitCameraToModel}
              className="px-2 py-1 rounded text-[11px] font-medium bg-[#151e31] border border-[#1e293b] text-[#94a3b8]"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </header>

        <div ref={mountRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />
      </main>

      {/* SPEC SHEET & OPENSCAD GENERATOR MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 bg-[#0f172a] border-b border-[#1e293b] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#38bdf8] uppercase tracking-wider">
                  FieldMatrix 3D • Design Code: <span className="text-white">{designCode}</span>
                </h3>
                <p className="text-[11px] text-[#94a3b8]">
                  Copy your Design Code or Spec Sheet and include it in your Etsy personalization box.
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#94a3b8] hover:text-white text-sm font-bold px-2">
                ✕
              </button>
            </div>

            {activeTab === 'cargo' && (
              <div className="px-5 pt-3 bg-[#111827] flex gap-2 border-b border-[#1e293b]">
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
                  <Code size={13} /> OpenSCAD (.scad) STL Generator
                </button>
              </div>
            )}

            <div className="p-4 overflow-y-auto flex-1 bg-[#0b0f19] m-4 rounded-lg border border-[#1e293b]">
              <pre className="text-xs font-mono text-[#e2e8f0] whitespace-pre-wrap leading-relaxed">
                {activeTab === 'cargo' && modalTab === 'scad' ? generateScadCode() : generateSpecSheet()}
              </pre>
            </div>

            <div className="px-5 py-3.5 bg-[#0f172a] border-t border-[#1e293b] flex flex-wrap items-center justify-between gap-2">
              {activeTab === 'cargo' && modalTab === 'scad' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generateScadCode());
                      setScadCopied(true);
                      setTimeout(() => setScadCopied(false), 2000);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    {scadCopied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {scadCopied ? 'Copied .SCAD!' : 'Copy .SCAD Code'}
                  </button>
                  <button
                    onClick={downloadScadFile}
                    className="px-3.5 py-2 rounded-lg bg-[#38bdf8] text-[#0b0f19] font-bold text-xs flex items-center gap-1.5"
                  >
                    <Download size={14} /> Download .SCAD File
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateSpecSheet());
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-4 py-2 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-white font-bold text-xs flex items-center gap-1.5"
                >
                  {copied ? <CheckCircle size={15} className="text-emerald-400" /> : <Copy size={15} />}
                  {copied ? 'Copied Spec & Code!' : 'Copy Spec Sheet'}
                </button>
              )}

              <a
                href={activeTab === 'storage' ? ETSY_BENCH_URL : ETSY_CARGO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 rounded-lg bg-[#f43f5e] hover:bg-[#fb7185] text-white font-bold text-xs flex items-center gap-1.5"
              >
                Order on Etsy <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN ADMIN PIN GATE & ORDER RECALL MODAL */}
      {adminMode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#38bdf8] uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={14} /> {adminUnlocked ? 'Admin Order Recall' : 'Admin Security Gate'}
              </h3>
              <button
                onClick={() => setAdminMode(false)}
                className="text-[#94a3b8] hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {!adminUnlocked ? (
              <form onSubmit={handleVerifyPin} className="space-y-3">
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-1">
                    Enter Admin PIN to unlock Order Recall:
                  </label>
                  <input
                    type="password"
                    autoFocus
                    value={adminPinInput}
                    onChange={(e) => {
                      setAdminPinInput(e.target.value);
                      setAdminPinError(false);
                    }}
                    placeholder="••••"
                    className="w-full bg-[#0b0f19] border border-[#1e293b] focus:border-[#38bdf8] rounded px-3 py-2 text-center text-sm font-mono tracking-widest text-white outline-none"
                  />
                  {adminPinError && (
                    <p className="text-[11px] text-red-400 mt-1">Invalid security PIN.</p>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setAdminMode(false)}
                    className="flex-1 py-2 rounded bg-[#151e31] text-xs font-semibold text-[#94a3b8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded bg-[#38bdf8] text-[#0b0f19] text-xs font-bold"
                  >
                    Unlock
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#94a3b8] block mb-1">
                    Enter Customer Design Code (e.g. BENCH-XYZ123 or CARGO-XYZ123)
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={recallCode}
                    onChange={(e) => setRecallCode(e.target.value)}
                    placeholder="CARGO-XXXXXX"
                    className="w-full bg-[#0b0f19] border border-[#1e293b] rounded px-3 py-2 text-xs font-mono text-white uppercase outline-none focus:border-[#38bdf8]"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setAdminMode(false)}
                    className="flex-1 py-2 rounded bg-[#151e31] text-xs font-semibold text-[#94a3b8]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdminRecall}
                    className="flex-1 py-2 rounded bg-[#f43f5e] text-xs font-bold text-white"
                  >
                    Recall Design
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
