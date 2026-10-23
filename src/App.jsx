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
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyB1aOZeIwyhVEb4D2sRimetbjDJhbeZRqI",
  authDomain: "print-in-place-boxes.firebaseapp.com",
  projectId: "print-in-place-boxes",
  storageBucket: "print-in-place-boxes.firebasestorage.app",
  messagingSenderId: "282832338212",
  appId: "1:282832338212:web:817f6b6906ca93aafa87b1"
};

const ETSY_BENCH_URL = "https://www.etsy.com/shop/GlitchyGrizzly";
const ETSY_CARGO_URL = "https://www.etsy.com/shop/GlitchyGrizzly";
const FIRESTORE_COLLECTION = "custom_boxes";

let db = null;
let auth = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  signInAnonymously(auth).catch((err) => {
    console.warn("Anonymous auth optional/skipped:", err.message);
  });
} catch (err) {
  console.warn("Firebase init error:", err);
}

// ==========================================
// BAMBU LAB PLA COLOR PALETTE (20 COLORS)
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
  const [codeCopied, setCodeCopied] = useState(false);
  const [designCode, setDesignCode] = useState('');
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

  const ADMIN_SECRET_PIN = '1024';

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

  // Bench Matrix State
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

  // Cargo Matrix State
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
    } else {
      const basePrice = 14;
      const vol = (cargoWidth * cargoLength * (cargoHeight * 2)) / 30000;
      const compExtra = (cargoCompX * cargoCompY - 1) * 0.75;
      const textExtra = cargoText.trim() !== '' ? 2.5 : 0;
      return basePrice + vol * 2.2 + compExtra + textExtra;
    }
  };

  const generateSpecSheet = () => {
    let spec = `====================================================\n`;
    spec += `   FIELDMATRIX 3D - PRINT & SHIP SPECIFICATION\n`;
    spec += `====================================================\n`;
    spec += `Design Code  : ${designCode || 'UNSAVED'}\n`;
    spec += `Product Line : ${
      activeTab === 'storage' ? 'The Bench Matrix (Modular Drawer Storage)' : 'The Cargo Matrix (Print-in-Place Clamshell)'
    }\n`;
    spec += `Est. Price   : $${calculatePrice().toFixed(2)}\n\n`;

    if (activeTab === 'storage') {
      spec += `[ 1. GEOMETRY & CONFIGURATION ]\n`;
      spec += `- Preset Size        : ${sizePreset}\n`;
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

    return `// Print-in-Place Hinged Box (Bambu P1S V12 - Responsive & Multi-Color)
// Design Code: ${designCode || 'CUSTOM'}
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

// CORRECTED: mirror([0, 1, 0]) flips Y-axis so when the lid folds 180° over the X-axis hinge,
// the text is right-side up AND reads left-to-right from the front latch!
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
                            [-armW/2, 0,       height + 3.65],
                            [ armW/2, 0,       height + 3.65],
                            [-armW/2, -0.80,   height + 4.45],
                            [ armW/2, -0.80,   height + 4.45],
                            [-armW/2, 0,       height + 5.80],
                            [ armW/2, 0,       height + 5.80]
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

  const downloadScadFile = (mode = scadExportMode) => {
    const safeText = (cargoText || '').replace(/[^a-zA-Z0-9\s_-]/g, '').trim() || 'BOX';
    const typeMap = {
      full: 'FULL-3MF-V12',
      box_only: 'BOX-ONLY-V12',
      text_only: 'TEXT-ONLY-V12',
      hinge: 'HINGE-TEST-V12',
      latch: 'LATCH-TEST-V12'
    };
    const codeSuffix = designCode || Math.random().toString(36).substring(2, 6).toUpperCase();
    const filename = `${safeText}_${cargoWidth}x${cargoLength}x${cargoHeight}_${typeMap[mode]}_${codeSuffix}.scad`;

    const blob = new Blob([generateScadCode(mode)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildOrderPayload = (codeToSave) => ({
    designCode: codeToSave,
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
  });

  const saveDesignToFirestore = async (codeToSave) => {
    if (!db) return;
    try {
      if (auth && !auth.currentUser) {
        await signInAnonymously(auth).catch(() => {});
      }
      const payload = buildOrderPayload(codeToSave);
      await setDoc(doc(db, FIRESTORE_COLLECTION, codeToSave), payload);
    } catch (e) {
      console.error('Could not save to Firestore collection custom_boxes:', e);
      setStatusBanner({
        type: 'error',
        text: `Firestore save error: ${e.message}`
      });
    }
  };

  const handleOpenSpecModal = async () => {
    const prefix = activeTab === 'storage' ? 'BENCH-' : 'CARGO-';
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCode = `${prefix}${randomChars}`;
    setDesignCode(newCode);
    setCodeCopied(false);
    setModalTab('spec');
    setShowModal(true);

    try {
      navigator.clipboard.writeText(newCode);
      setCodeCopied(true);
    } catch (err) {
      // Ignore clipboard permission error until explicit button click
    }

    await saveDesignToFirestore(newCode);
  };

  const handleEtsyOrderClick = () => {
    if (designCode) {
      navigator.clipboard.writeText(designCode);
      setCodeCopied(true);
      saveDesignToFirestore(designCode);
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

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const domElem = renderer.domElement;
    const onPointerDown = (e) => {
      controlsState.current.isDragging = true;
      controlsState.current.isPanning = e.button === 2 || e.shiftKey;
      controlsState.current.prevX = e.clientX;
      controlsState.current.prevY = e.clientY;
      downX = e.clientX;
      downY = e.clientY;
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
    const onPointerUp = (e) => {
      controlsState.current.isDragging = false;
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
    } else {
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

          // Base front catch wedge
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
          // Lid outer flexing snap-latch arm + finger pull tab + inward hook tooth
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
      // When lidHalf folds 180° around the X-axis hinge, rotation.x = PI/2 with rotation.z = 0
      // ensures the text faces upward and reads right-side-up from the front latch!
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
    foldAngle
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
          cursor: pointer;
        }
      `}</style>

      {/* ADMIN ORDER RECALL MODAL */}
      {adminMode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#38bdf8]/40 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2 text-[#38bdf8] font-bold text-sm">
                <Lock size={16} />
                <span>{adminUnlocked ? 'Admin Order Recall' : 'Admin Security Gate'}</span>
              </div>
              <button onClick={() => setAdminMode(false)} className="text-[#94a3b8] hover:text-white text-sm font-bold">
                ✕
              </button>
            </div>

            {!adminUnlocked ? (
              <form onSubmit={handleVerifyPin} className="space-y-3">
                <p className="text-xs text-[#94a3b8]">
                  Enter your 4-digit Admin PIN to unlock customer order lookup and V12 OpenSCAD exports:
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
              <div className="space-y-3">
                <p className="text-xs text-[#94a3b8]">
                  Enter a customer Design Code (e.g. <span className="text-white font-mono">BENCH-7F9K2A</span> or <span className="text-white font-mono">CARGO-3X8M1P</span>) or click below to view V12 OpenSCAD for the current Cargo design:
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
                    FieldMatrix 3D • Design Code: <span className="text-white">{designCode}</span>
                  </span>
                  {adminUnlocked && (
                    <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-[10px] text-emerald-300">
                      ADMIN UNLOCKED
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-[#94a3b8]">
                  Copy your Design Code or Spec Sheet and include it in your Etsy personalization box.
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#94a3b8] hover:text-white text-sm font-bold px-2">
                ✕
              </button>
            </div>

            {adminUnlocked && activeTab === 'cargo' && (
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

            <div className="p-4 overflow-y-auto flex-1 bg-[#0b0f19] m-4 rounded-lg border border-[#1e293b]">
              <pre className="text-xs font-mono text-[#e2e8f0] whitespace-pre-wrap leading-relaxed">
                {adminUnlocked && activeTab === 'cargo' && modalTab === 'scad'
                  ? generateScadCode(scadExportMode)
                  : generateSpecSheet()}
              </pre>
            </div>

            <div className="px-5 py-3.5 bg-[#0f172a] border-t border-[#1e293b] flex flex-wrap items-center justify-between gap-2">
              {adminUnlocked && activeTab === 'cargo' && modalTab === 'scad' ? (
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

              <a
                href={activeTab === 'storage' ? ETSY_BENCH_URL : ETSY_CARGO_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleEtsyOrderClick}
                className="px-5 py-2 rounded-lg bg-[#f43f5e] hover:bg-[#fb7185] text-white font-bold text-xs flex items-center gap-1.5"
              >
                {codeCopied ? 'Code Copied! Order on Etsy' : 'Copy Code & Order on Etsy'} <ExternalLink size={14} />
              </a>
            </div>
          </div>
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
                  <Box size={13} /> Dimensions &amp; Compartments
                </div>

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
                    onChange={(e) => setCargoWidth(parseInt(e.target.value, 10))}
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
                    onChange={(e) => setCargoLength(parseInt(e.target.value, 10))}
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
                    onChange={(e) => setCargoHeight(parseInt(e.target.value, 10))}
                    className="w-full box-studio-slider"
                  />
                </div>

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

              {/* CARGO MATRIX COLORS (20 SWATCHES) */}
              <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-3.5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#38bdf8] flex items-center gap-1.5">
                    <Palette size={13} /> Colors (20 Bambu PLA Swatches)
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
                    1. Box Body, Hinges &amp; Latch: <span className="text-[#fecdd3]">{activeCargoBoxColor.name}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {BAMBU_PLA_COLORS.map((col) => (
                      <button
                        key={`cb_${col.id}`}
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
                  <div className="text-xs font-semibold mb-1.5">
                    2. Lid Text &amp; Frame Inlay: <span className="text-[#38bdf8]">{activeCargoTextColor.name}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {BAMBU_PLA_COLORS.map((col) => (
                      <button
                        key={`ct_${col.id}`}
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
            </div>
          )}
        </div>

        {/* STICKY FOOTER */}
        <div className="p-3.5 bg-[#0f172a] border-t border-[#1e293b] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#94a3b8]">
              {activeTab === 'storage'
                ? `${tiers} Tiers • ${tiers * drawersPerTier} Drawers`
                : `${cargoWidth}×${cargoLength}×${cargoHeight}mm • ${cargoCompX * cargoCompY} Cells`}
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
      <main className="flex-1 h-[46vh] md:h-full flex flex-col relative bg-[#0d121d] overflow-hidden">
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

        <header className="bg-[#0f172a] border-b border-[#1e293b] px-4 py-2 flex flex-wrap items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5">
              <Sparkles size={14} /> 3D Preview
            </span>

            {activeTab === 'storage' ? (
              <div className="flex items-center gap-2 bg-[#151e31] px-2.5 py-1 rounded-lg border border-[#1e293b]">
                <span className="text-[11px] font-semibold">Swing Drawers:</span>
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
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {activeTab === 'storage' && (
              <>
                <button
                  onClick={() => setExplodedView(!explodedView)}
                  className={`px-2 py-1 rounded text-xs border ${
                    explodedView ? 'bg-[#3b1526] border-[#f43f5e] text-[#fecdd3]' : 'bg-[#151e31] border-[#1e293b] text-[#94a3b8]'
                  }`}
                >
                  Exploded
                </button>
                <button
                  onClick={() => setXrayMode(!xrayMode)}
                  className={`px-2 py-1 rounded text-xs border ${
                    xrayMode ? 'bg-[#3b1526] border-[#f43f5e] text-[#fecdd3]' : 'bg-[#151e31] border-[#1e293b] text-[#94a3b8]'
                  }`}
                >
                  X-Ray
                </button>
              </>
            )}
            <button
              onClick={() => setShowDimensions(!showDimensions)}
              className={`px-2 py-1 rounded text-xs border flex items-center gap-1 ${
                showDimensions ? 'bg-[#38bdf8]/15 border-[#38bdf8] text-[#38bdf8]' : 'bg-[#151e31] border-[#1e293b] text-[#94a3b8]'
              }`}
            >
              <Eye size={12} /> Dimensions
            </button>
            <button
              onClick={fitCameraToModel}
              className="px-2 py-1 rounded text-xs bg-[#151e31] border border-[#1e293b] text-[#e2e8f0] flex items-center gap-1"
            >
              <Maximize2 size={12} /> Fit
            </button>
            <button
              onClick={() => {
                setSwingOpenAmount(0);
                setOpenDrawersMap({});
                setFoldAngle(35);
                fitCameraToModel();
              }}
              className="px-2 py-1 rounded text-xs bg-[#151e31] border border-[#1e293b] text-[#94a3b8] flex items-center gap-1"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        </header>

        <div ref={mountRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />
      </main>
    </div>
  );
}
