import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  Package,
  Award,
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
  Key,
  Box,
  ExternalLink
} from 'lucide-react';

// ==========================================
// CONFIGURATION & ETSY LINKS
// ==========================================
const ETSY_BENCH_URL = "https://www.etsy.com/shop/GlitchyGrizzly";
const ETSY_CARGO_URL = "https://www.etsy.com/shop/GlitchyGrizzly";

const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForTemplate12345",
  authDomain: "glitchygrizzly-matrix.firebaseapp.com",
  projectId: "glitchygrizzly-matrix",
  storageBucket: "glitchygrizzly-matrix.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

let db = null;
let auth = null;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  signInAnonymously(auth).catch(() => {});
} catch (e) {
  console.warn("Firebase offline mode (localStorage fallback active).");
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

// ==========================================
// POPUP EXPLANATION COMPONENT
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
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            setOpen((prev) => !prev);
          }
        }}
        aria-label={`Info about ${title}`}
        className={`w-4 h-4 rounded-full inline-flex items-center justify-center cursor-pointer transition-colors focus:outline-none ${
          open
            ? 'bg-[#38bdf8] text-[#0b0f19] shadow-sm'
            : 'bg-[#1e293b] text-[#94a3b8] hover:bg-[#334155] hover:text-white'
        }`}
      >
        <HelpCircle size={11} />
      </span>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 bottom-full mb-2 w-64 p-3 rounded-lg bg-[#0f172a] border border-[#38bdf8]/50 shadow-2xl z-50 text-left pointer-events-auto animate-in fade-in duration-150"
        >
          <div className="text-[11px] font-bold text-[#38bdf8] mb-1">
            <span>{title}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#cbd5e1] font-normal">
            {text}
          </p>
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

  // Slide-in plate background strictly matches Outer Casing & Pivot Rod hex
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
  ctx.font = 'bold 30px monospace';
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

  if (isBLNotch) {
    addArc(-w, -d, nR, Math.PI / 2, 0);
  } else {
    addArc(-w + r, -d + r, r, Math.PI, (3 * Math.PI) / 2);
  }

  if (isBRNotch) {
    addArc(w, -d, nR, Math.PI, Math.PI / 2);
  } else {
    addArc(w - r, -d + r, r, (3 * Math.PI) / 2, 2 * Math.PI);
  }

  if (isTRNotch) {
    addArc(w, d, nR, (3 * Math.PI) / 2, Math.PI);
  } else {
    addArc(w - r, d - r, r, 0, Math.PI / 2);
  }

  if (isTLNotch) {
    addArc(-w, d, nR, 0, -Math.PI / 2);
  } else {
    addArc(-w + r, d - r, r, Math.PI / 2, Math.PI);
  }

  return pts;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('storage');
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [designCode, setDesignCode] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [recallCode, setRecallCode] = useState('');

  const [openSections, setOpenSections] = useState({
    config: true,
    labels: true,
    dividers: true,
    colors: true,
    cargoDims: true,
    cargoGrid: true,
    cargoColors: true,
    cargoText: true
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

  // Labels State
  const [enableLabelSlot, setEnableLabelSlot] = useState(true);
  const [labelWidth, setLabelWidth] = useState(30);
  const [labelHeight, setLabelHeight] = useState(11);
  const [labelFont, setLabelFont] = useState('Clash Grotesk');
  const [labels, setLabels] = useState({
    tier_1_box_4: 'M3 Bolts',
    tier_1_box_3: 'Hex Nuts',
    tier_0_box_4: 'Nozzles'
  });

  const [drawerDividers, setDrawerDividers] = useState({});
  const [batchH, setBatchH] = useState(1);
  const [batchV, setBatchV] = useState(1);

  // Dual Colors (Casing vs Drawers)
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
  const [cargoCompY, setCargoCompY] = useState(1);
  const [cargoBoxColor, setCargoBoxColor] = useState('#F5547C');
  const [cargoTextColor, setCargoTextColor] = useState('#1A1A1A');
  const [cargoText, setCargoText] = useState('FIELD KIT');
  const [cargoFont, setCargoFont] = useState('Impact');
  const [foldAngle, setFoldAngle] = useState(0);

  // Dynamic Label Slot Caps for Bench Matrix
  const maxLabelHeight = useMemo(() => {
    // Exact requested ratio mapping: 10mm->6mm, 20mm->14mm, 25mm->19mm, 30mm->24mm
    const raw = 6 + (height - 10) * (18 / 20);
    return Math.max(6, Math.min(24, Math.round(raw * 10) / 10));
  }, [height]);

  const maxLabelWidth = useMemo(() => {
    // Max 60mm. Shrinks by 2mm for every 1mm width is reduced below 60mm
    if (width >= 60) return 60;
    const diff = 60 - width;
    return Math.max(10, Math.round(60 - diff * 2));
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

  const handleDrawersPerTierChange = (val) => {
    const parsed = parseInt(val, 10);
    if (lockToP1S && parsed > maxAllowedDrawersForCurrentHeight) {
      setDrawersPerTier(maxAllowedDrawersForCurrentHeight);
    } else {
      setDrawersPerTier(parsed);
    }
  };

  const handleHeightChange = (val) => {
    const parsed = parseFloat(val);
    if (lockToP1S && parsed > maxAllowedHeightForCurrentDrawers) {
      setHeight(maxAllowedHeightForCurrentDrawers);
    } else {
      setHeight(parsed);
    }
  };

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
      const vol = (cargoWidth * cargoLength * (cargoHeight * 2)) / 1000;
      let base = 22;
      if (vol > 900) base = 38;
      else if (vol > 450) base = 30;
      return base;
    }
  };

  const generateSpecSheet = () => {
    let spec = `====================================================\n`;
    spec = `   FIELDMATRIX 3D - ORDER SPECIFICATION SHEET\n`;
    spec += `====================================================\n`;
    spec += `Product Line : ${activeTab === 'storage' ? 'The Bench Matrix (Custom Drawer Storage)' : 'The Cargo Matrix (Tailored Storage Cases)'}\n`;
    spec += `Est. Price   : $${calculatePrice().toFixed(2)}\n`;
    spec += `Design Code  : ${designCode || 'PENDING'}\n\n`;

    if (activeTab === 'storage') {
      spec += `[ GEOMETRY & CONFIGURATION ]\n`;
      spec += `- Tiers              : ${tiers}\n`;
      spec += `- Drawers per Tier   : ${drawersPerTier} (${tiers * drawersPerTier} Total Drawers)\n`;
      spec += `- Single Tier Height : ${singleTierHeightMm} mm\n`;
      spec += `- Outer Width        : ${width} mm\n`;
      spec += `- Outer Depth        : ${depth} mm\n`;
      spec += `- Drawer Height      : ${height} mm\n\n`;
      spec += `[ COLORS & MATERIALS ]\n`;
      spec += `- Outer Casing & Rod : ${activeCasingColor.name} (${activeCasingColor.hex})\n`;
      spec += `- Drawers & Dividers : ${activeDrawerColor.name} (${activeDrawerColor.hex})\n`;
    } else {
      spec += `[ CARGO CASE CONFIGURATION ]\n`;
      spec += `- Width (Hinge Axis) : ${cargoWidth} mm\n`;
      spec += `- Length (Each Half) : ${cargoLength} mm\n`;
      spec += `- Height (Each Half) : ${cargoHeight} mm\n`;
      spec += `- Interior Grid      : ${cargoCompX} Columns × ${cargoCompY} Rows\n`;
      spec += `- Box Filament       : ${cargoBoxColor}\n`;
      spec += `- Text Inlay Color   : ${cargoTextColor}\n`;
      spec += `- Custom Lid Text    : "${cargoText}"\n`;
    }
    return spec;
  };

  const handleGenerateOrder = async () => {
    const code = (activeTab === 'storage' ? 'BENCH-' : 'CARGO-') + Math.random().toString(36).substring(2, 8).toUpperCase();
    setDesignCode(code);

    const payload = {
      product: activeTab,
      price: calculatePrice(),
      createdAt: new Date().toISOString(),
      ...(activeTab === 'storage' ? {
        tiers, drawersPerTier, opening, handlePos, width, depth, height,
        casingColor: activeCasingColor.hex, drawerColor: activeDrawerColor.hex,
        labels, drawerDividers
      } : {
        cargoWidth, cargoLength, cargoHeight, cargoCompX, cargoCompY,
        cargoBoxColor, cargoTextColor, cargoText, cargoFont
      })
    };

    if (db && auth && auth.currentUser) {
      try {
        await setDoc(doc(db, "artifacts", "fieldmatrix", "public", "data", "custom_orders", code), payload);
      } catch (e) {
        console.error("Firestore sync note:", e);
      }
    }

    setShowModal(true);
  };

  const handleAdminRecall = async () => {
    if (!recallCode.trim()) return;
    if (db) {
      try {
        const snap = await getDoc(doc(db, "artifacts", "fieldmatrix", "public", "data", "custom_orders", recallCode.trim().toUpperCase()));
        if (snap.exists()) {
          const data = snap.data();
          if (data.product === 'storage') {
            setActiveTab('storage');
            setTiers(data.tiers);
            setDrawersPerTier(data.drawersPerTier);
            setOpening(data.opening);
            setHandlePos(data.handlePos);
            setWidth(data.width);
            setDepth(data.depth);
            setHeight(data.height);
            if (data.labels) setLabels(data.labels);
            if (data.drawerDividers) setDrawerDividers(data.drawerDividers);
          } else {
            setActiveTab('cargo');
            setCargoWidth(data.cargoWidth);
            setCargoLength(data.cargoLength);
            setCargoHeight(data.cargoHeight);
            setCargoCompX(data.cargoCompX);
            setCargoCompY(data.cargoCompY);
            setCargoBoxColor(data.cargoBoxColor);
            setCargoTextColor(data.cargoTextColor);
            setCargoText(data.cargoText);
          }
          alert(`Successfully loaded order ${recallCode.trim().toUpperCase()}!`);
          setAdminMode(false);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    alert("Order code not found in database.");
  };

  // THREE.JS VIEWPORT REF
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const modelGroupRef = useRef(null);
  const drawerPivotsRef = useRef([]);
  const controlsState = useRef({
    isDragging: false,
    isPanning: false,
    prevX: 0,
    prevY: 0,
    theta: 0.62,
    phi: 1.12,
    radius: 380,
    targetY: 75
  });

  const hasAnyOpenDrawer = useMemo(() => {
    return swingOpenAmount > 0.05 || Object.values(openDrawersMap).some(Boolean);
  }, [swingOpenAmount, openDrawersMap]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b0f19');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 1, 15000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xf1f5f9, 0.82);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.15);
    dirLight1.position.set(260, 480, 340);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.38);
    dirLight2.position.set(-280, 200, -220);
    scene.add(dirLight2);

    const gridHelper = new THREE.GridHelper(600, 30, 0x0ea5e9, 0x1e293b);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

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
        controlsState.current.targetY = Math.max(-200, Math.min(2000, controlsState.current.targetY + dy * 0.75));
      } else {
        controlsState.current.theta -= dx * 0.0085;
        controlsState.current.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.02, controlsState.current.phi - dy * 0.0085));
      }
    };

    const onPointerUp = (e) => {
      controlsState.current.isDragging = false;
      const moveDist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (moveDist < 5 && activeTab === 'storage') {
        const rect = renderer.domElement.getBoundingClientRect();
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
      controlsState.current.radius = Math.max(110, Math.min(4000, controlsState.current.radius + e.deltaY * 0.45));
    };

    const domElem = renderer.domElement;
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
        if (!item || !item.pivotGroup) return;
        const targetAngle = item.targetAngle || 0;
        item.pivotGroup.rotation.y += (targetAngle - item.pivotGroup.rotation.y) * 0.16;
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElem.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [activeTab]);

  // RENDER 3D SCENE
  useEffect(() => {
    const group = modelGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    drawerPivotsRef.current = [];

    if (activeTab === 'storage') {
      const casingMat = new THREE.MeshStandardMaterial({
        color: activeCasingColor.hex,
        roughness: activeCasingColor.roughness ?? 0.55,
        metalness: activeCasingColor.metalness ?? 0.08,
        transparent: xrayMode,
        opacity: xrayMode ? 0.32 : 1.0
      });

      const drawerMat = new THREE.MeshStandardMaterial({
        color: activeDrawerColor.hex,
        roughness: activeDrawerColor.roughness ?? 0.5,
        metalness: activeDrawerColor.metalness ?? 0.06,
        transparent: xrayMode,
        opacity: xrayMode ? 0.45 : 1.0
      });

      const overLimitDrawerMat = new THREE.MeshStandardMaterial({
        color: '#c93b3b',
        roughness: 0.4,
        metalness: 0.1,
        transparent: true,
        opacity: 0.88
      });

      const wallThick = 2.6;
      const tierUnitPitch = height + TIER_CLEARANCE_PER_DRAWER_MM;
      const singleTierH = drawersPerTier * tierUnitPitch + TIER_FRAME_BASE_TOP_MM;
      const explodeDrawerGap = explodedView ? Math.max(16, height * 0.95) : 0;
      const explodeTierGap = explodedView ? drawersPerTier * explodeDrawerGap + 32 : 0;

      const pivotIsLeft = opening === 'Left';
      const closedSideSign = pivotIsLeft ? -1 : 1;
      const openSideName = pivotIsLeft ? 'right' : 'left';

      for (let t = 0; t < tiers; t++) {
        const tierGroup = new THREE.Group();
        const tierBaseY = t * (singleTierH + explodeTierGap);
        tierGroup.position.y = tierBaseY;

        const visualTierH = singleTierH + (drawersPerTier - 1) * explodeDrawerGap;

        const bottomPlateGeo = new THREE.BoxGeometry(width, wallThick, depth);
        const bottomPlate = new THREE.Mesh(bottomPlateGeo, casingMat);
        bottomPlate.position.set(0, wallThick / 2, 0);
        bottomPlate.castShadow = true;
        bottomPlate.receiveShadow = true;
        tierGroup.add(bottomPlate);

        const topPlate = new THREE.Mesh(bottomPlateGeo, casingMat);
        topPlate.position.set(0, visualTierH - wallThick / 2 + (explodedView ? explodeDrawerGap * 0.65 : 0), 0);
        topPlate.castShadow = true;
        topPlate.receiveShadow = true;
        tierGroup.add(topPlate);

        const backWallGeo = new THREE.BoxGeometry(width, visualTierH, wallThick);
        const backWall = new THREE.Mesh(backWallGeo, casingMat);
        backWall.position.set(0, visualTierH / 2, -depth / 2 + wallThick / 2);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        tierGroup.add(backWall);

        const sideWallGeo = new THREE.BoxGeometry(wallThick, visualTierH, depth);
        const sideWall = new THREE.Mesh(sideWallGeo, casingMat);
        sideWall.position.set(closedSideSign * (width / 2 - wallThick / 2), visualTierH / 2, 0);
        sideWall.castShadow = true;
        sideWall.receiveShadow = true;
        tierGroup.add(sideWall);

        const rodRadius = 4.6;
        const pivotWorldX = closedSideSign * (width / 2 - 7.5);
        const pivotWorldZ = depth / 2 - 7.5;

        const rodGeo = new THREE.CylinderGeometry(rodRadius, rodRadius, visualTierH, 24);
        const rodMesh = new THREE.Mesh(rodGeo, casingMat);
        rodMesh.position.set(pivotWorldX, visualTierH / 2, pivotWorldZ);
        tierGroup.add(rodMesh);

        if (t === tiers - 1 || explodedView) {
          const capGeo = new THREE.CylinderGeometry(rodRadius * 1.65, rodRadius * 1.65, 5.5, 28);
          const capMesh = new THREE.Mesh(capGeo, casingMat);
          capMesh.position.set(pivotWorldX, visualTierH + 2.75 + (explodedView ? explodeDrawerGap * 0.65 : 0), pivotWorldZ);
          capMesh.castShadow = true;
          tierGroup.add(capMesh);
        }

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
        const floorGeo = new THREE.ExtrudeGeometry(floorShape, { depth: drawerFloorThick, bevelEnabled: false, curveSegments: 18 });
        floorGeo.rotateX(-Math.PI / 2);

        const wallShape = new THREE.Shape(outerPts);
        const holePath = new THREE.Path(innerPts.slice().reverse());
        wallShape.holes.push(holePath);

        const wallHeight = Math.max(2, dH - drawerFloorThick);
        const perimeterWallGeo = new THREE.ExtrudeGeometry(wallShape, { depth: wallHeight, bevelEnabled: false, curveSegments: 18 });
        perimeterWallGeo.rotateX(-Math.PI / 2);

        for (let b = 0; b < drawersPerTier; b++) {
          const drawerKey = `tier_${t}_box_${b}`;
          const drawerY = wallThick + b * (tierUnitPitch + explodeDrawerGap) + 0.5;
          const drawerTopInTier = (b + 1) * tierUnitPitch + TIER_FRAME_BASE_TOP_MM;
          const isThisDrawerOverLimit = drawerTopInTier > P1S_MAX_HEIGHT_MM;
          const activeMatForDrawer = isThisDrawerOverLimit ? overLimitDrawerMat : drawerMat;

          const pivotGroup = new THREE.Group();
          pivotGroup.position.set(pivotWorldX, drawerY, pivotWorldZ);

          const drawerCenterX = -closedSideSign * (wallThick / 2);
          const drawerCenterZ = wallThick / 2;
          const drawerLocal = new THREE.Group();
          drawerLocal.position.set(drawerCenterX - pivotWorldX, 0, drawerCenterZ - pivotWorldZ);
          drawerLocal.userData = { drawerKey };

          const floorMesh = new THREE.Mesh(floorGeo, activeMatForDrawer);
          floorMesh.castShadow = true;
          floorMesh.receiveShadow = true;
          floorMesh.userData = { drawerKey };
          drawerLocal.add(floorMesh);

          const wallMesh = new THREE.Mesh(perimeterWallGeo, activeMatForDrawer);
          wallMesh.position.y = drawerFloorThick;
          wallMesh.castShadow = true;
          wallMesh.receiveShadow = true;
          wallMesh.userData = { drawerKey };
          drawerLocal.add(wallMesh);

          const sleeveGeo = new THREE.CylinderGeometry(rodRadius + 2.2, rodRadius + 2.2, dH, 20);
          const sleeveMesh = new THREE.Mesh(sleeveGeo, activeMatForDrawer);
          sleeveMesh.position.set(pivotWorldX - drawerCenterX, dH / 2, pivotWorldZ - drawerCenterZ);
          sleeveMesh.userData = { drawerKey };
          drawerLocal.add(sleeveMesh);

          const divConfig = drawerDividers[drawerKey] || { h: 1, v: 1 };
          const hSec = divConfig.h || 1;
          const vSec = divConfig.v || 1;
          const divWallThick = 1.4;
          const divHeight = Math.max(2, dH - drawerFloorThick - 1.2);
          const innerSpanW = dW - drawerWallThick * 2 - 2;
          const innerSpanD = dD - drawerWallThick * 2 - 2;

          if (hSec > 1) {
            for (let i = 1; i < hSec; i++) {
              const zPos = -innerSpanD / 2 + (innerSpanD / hSec) * i;
              const hDivGeo = new THREE.BoxGeometry(innerSpanW, divHeight, divWallThick);
              const hDivMesh = new THREE.Mesh(hDivGeo, activeMatForDrawer);
              hDivMesh.position.set(0, drawerFloorThick + divHeight / 2, zPos);
              hDivMesh.userData = { drawerKey };
              drawerLocal.add(hDivMesh);
            }
          }

          if (vSec > 1) {
            for (let j = 1; j < vSec; j++) {
              const xPos = -innerSpanW / 2 + (innerSpanW / vSec) * j;
              const vDivGeo = new THREE.BoxGeometry(divWallThick, divHeight, innerSpanD);
              const vDivMesh = new THREE.Mesh(vDivGeo, activeMatForDrawer);
              vDivMesh.position.set(xPos, drawerFloorThick + divHeight / 2, 0);
              vDivMesh.userData = { drawerKey };
              drawerLocal.add(vDivMesh);
            }
          }

          if (enableLabelSlot) {
            const effLW = Math.min(labelWidth, maxLabelWidth, dW - 14);
            const effLH = Math.min(labelHeight, maxLabelHeight, dH - 2.5);
            const railThick = 1.6;
            const slotDepth = 1.8;

            const bottomRailGeo = new THREE.BoxGeometry(effLW + railThick * 2, railThick, slotDepth);
            const bottomRailMesh = new THREE.Mesh(bottomRailGeo, activeMatForDrawer);
            bottomRailMesh.position.set(0, dH / 2 - effLH / 2 - railThick / 2, dD / 2 + slotDepth / 2);
            bottomRailMesh.userData = { drawerKey };
            drawerLocal.add(bottomRailMesh);

            const sideRailGeo = new THREE.BoxGeometry(railThick, effLH + railThick, slotDepth);
            const leftRailMesh = new THREE.Mesh(sideRailGeo, activeMatForDrawer);
            leftRailMesh.position.set(-effLW / 2 - railThick / 2, dH / 2 - railThick / 2, dD / 2 + slotDepth / 2);
            leftRailMesh.userData = { drawerKey };
            drawerLocal.add(leftRailMesh);

            const rightRailMesh = new THREE.Mesh(sideRailGeo, activeMatForDrawer);
            rightRailMesh.position.set(effLW / 2 + railThick / 2, dH / 2 - railThick / 2, dD / 2 + slotDepth / 2);
            rightRailMesh.userData = { drawerKey };
            drawerLocal.add(rightRailMesh);

            const labelText = labels[drawerKey] || '';
            const labelTex = createLabelTexture(labelText, activeCasingColor.hex, activeDrawerColor.hex, labelFont);
            const plateThick = 1.1;
            const labelPlateGeo = new THREE.BoxGeometry(effLW - 0.4, effLH, plateThick);
            const casingPlateMat = new THREE.MeshStandardMaterial({
              color: activeCasingColor.hex,
              roughness: activeCasingColor.roughness ?? 0.55,
              metalness: activeCasingColor.metalness ?? 0.08
            });
            const plateMaterials = [
              casingPlateMat, casingPlateMat, casingPlateMat, casingPlateMat,
              new THREE.MeshBasicMaterial({ map: labelTex }),
              casingPlateMat
            ];
            const labelPlateMesh = new THREE.Mesh(labelPlateGeo, plateMaterials);
            labelPlateMesh.position.set(0, dH / 2, dD / 2 + plateThick / 2 + 0.15);
            labelPlateMesh.userData = { drawerKey };
            drawerLocal.add(labelPlateMesh);
          }

          pivotGroup.add(drawerLocal);
          tierGroup.add(pivotGroup);

          drawerPivotsRef.current.push({
            drawerKey,
            tierIndex: t,
            boxIndex: b,
            pivotGroup,
            targetAngle: 0
          });
        }

        group.add(tierGroup);
      }
    } else {
      // CARGO MATRIX 3D VIEWPORT
      const boxMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(cargoBoxColor), roughness: 0.38, metalness: 0.08 });
      const pinMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.5 });
      const wall = 2.0;

      const halfGroup = new THREE.Group();
      const floor = new THREE.Mesh(new THREE.BoxGeometry(cargoWidth, cargoLength, wall), boxMat);
      floor.position.set(0, 0, wall / 2);
      halfGroup.add(floor);

      const left = new THREE.Mesh(new THREE.BoxGeometry(wall, cargoLength, cargoHeight), boxMat);
      left.position.set(-cargoWidth / 2 + wall / 2, 0, cargoHeight / 2);
      halfGroup.add(left);

      const right = new THREE.Mesh(new THREE.BoxGeometry(wall, cargoLength, cargoHeight), boxMat);
      right.position.set(cargoWidth / 2 - wall / 2, 0, cargoHeight / 2);
      halfGroup.add(right);

      const front = new THREE.Mesh(new THREE.BoxGeometry(cargoWidth - wall * 2, wall, cargoHeight), boxMat);
      front.position.set(0, -cargoLength / 2 + wall / 2, cargoHeight / 2);
      halfGroup.add(front);

      const back = new THREE.Mesh(new THREE.BoxGeometry(cargoWidth - wall * 2, wall, cargoHeight), boxMat);
      back.position.set(0, cargoLength / 2 - wall / 2, cargoHeight / 2);
      halfGroup.add(back);

      const baseBottom = halfGroup.clone();
      baseBottom.position.set(0, -cargoLength / 2 - 0.45, 0);
      group.add(baseBottom);

      const pinMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.33, 1.33, cargoWidth - 0.35, 20), pinMat);
      pinMesh.rotation.z = Math.PI / 2;
      pinMesh.position.set(0, 0, cargoHeight);
      group.add(pinMesh);

      const lidPivot = new THREE.Group();
      lidPivot.position.set(0, 0, cargoHeight);
      lidPivot.rotation.x = THREE.MathUtils.degToRad(foldAngle);

      const lidTop = halfGroup.clone();
      lidTop.position.set(0, cargoLength / 2 + 0.45, -cargoHeight);
      lidPivot.add(lidTop);
      group.add(lidPivot);
    }
  }, [
    activeTab, tiers, drawersPerTier, opening, handlePos, width, depth, height,
    enableLabelSlot, labelWidth, labelHeight, maxLabelWidth, maxLabelHeight, labelFont,
    labels, drawerDividers, activeCasingColor, activeDrawerColor, explodedView, xrayMode,
    cargoWidth, cargoLength, cargoHeight, cargoCompX, cargoCompY, cargoBoxColor, cargoTextColor, cargoText, foldAngle
  ]);

  // SWING ANIMATION EFFECT
  const prevDrawerAnglesRef = useRef({});
  useEffect(() => {
    const pivotSign = opening === 'Left' ? 1 : -1;
    const maxSwingRad = THREE.MathUtils.degToRad(68);

    drawerPivotsRef.current.forEach((item) => {
      const { drawerKey, boxIndex, pivotGroup } = item;
      const isIndividuallyOpen = !!openDrawersMap[drawerKey];
      const explodedFanRatio = explodedView
        ? 0.35 + ((drawersPerTier - 1 - boxIndex) / Math.max(1, drawersPerTier)) * 0.45
        : 0;
      const effectiveRatio = Math.max(swingOpenAmount, isIndividuallyOpen ? 0.78 : 0, explodedFanRatio);
      const targetAngle = pivotSign * effectiveRatio * maxSwingRad;

      if (pivotGroup.rotation.y === 0 && prevDrawerAnglesRef.current[drawerKey] !== undefined) {
        pivotGroup.rotation.y = prevDrawerAnglesRef.current[drawerKey];
      }

      item.targetAngle = targetAngle;
      prevDrawerAnglesRef.current[drawerKey] = targetAngle;
    });
  }, [swingOpenAmount, openDrawersMap, explodedView, opening, drawersPerTier]);

  return (
    <div className="flex flex-row h-screen w-screen overflow-hidden bg-[#0b0f19] text-[#e2e8f0] font-sans select-none">
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
          transition: transform 0.12s ease;
        }
        .box-studio-slider::-webkit-slider-thumb:hover {
          transform: scale(1.12);
        }
      `}</style>

      {/* LEFT SIDEBAR CONTROLS */}
      <aside className="w-[400px] shrink-0 h-full bg-[#111827] border-r border-[#1e293b] flex flex-col z-20 shadow-2xl">
        <div className="px-4 py-3.5 border-b border-[#1e293b] bg-[#0f172a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#38bdf8]/15 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8]">
                <Package size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black tracking-wider text-sm text-white uppercase">
                    FieldMatrix 3D
                  </span>
                </div>
                <p className="text-[11px] text-[#38bdf8] font-medium">
                  Glitchy Grizzly • <span className="text-[#94a3b8]">You configure your Matrix. We print &amp; ship.</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setAdminMode(true)}
              title="Admin Recall Order"
              className="p-1.5 rounded-lg bg-[#151e31] hover:bg-[#1e293b] text-[#94a3b8] hover:text-[#38bdf8] border border-[#1e293b] transition-colors"
            >
              <Key size={15} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 bg-[#090d16] p-1 rounded-lg border border-[#1e293b] mt-3">
            <button
              onClick={() => setActiveTab('storage')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'storage'
                  ? 'bg-[#1e293b] text-[#38bdf8] shadow-sm border border-[#38bdf8]/40'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Sliders size={13} /> The Bench Matrix
            </button>
            <button
              onClick={() => setActiveTab('cargo')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'cargo'
                  ? 'bg-[#1e293b] text-[#38bdf8] shadow-sm border border-[#38bdf8]/40'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Box size={13} /> The Cargo Matrix
            </button>
          </div>
        </div>

        {/* SCROLLABLE SIDEBAR */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
          {activeTab === 'storage' ? (
            <>
              <div className="space-y-2.5">
                <div className="grid grid-cols-3 gap-2">
                  {['Small', 'Medium', 'Large'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => applyPreset(preset)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                        sizePreset === preset
                          ? 'bg-[#3b1526] border-[#f43f5e]/60 text-[#fecdd3]'
                          : 'bg-[#0f172a] border-[#1e293b] text-[#94a3b8] hover:border-[#334155] hover:text-white'
                      }`}
                    >
                      <span>{preset}</span>
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
                    <Sliders size={13} className="text-[#38bdf8]" /> Configuration
                  </span>
                  {openSections.config ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {openSections.config && (
                  <div className="p-3.5 space-y-4">
                    <div className="flex items-center justify-between bg-[#151e31] px-2.5 py-2 rounded-lg border border-[#1e293b]">
                      <div className="flex items-center text-xs text-[#cbd5e1]">
                        {lockToP1S ? <Lock size={13} className="text-[#f43f5e] mr-1.5" /> : <Unlock size={13} className="text-[#64748b] mr-1.5" />}
                        <span>Lock to 250 mm Max Rod Height</span>
                        <InfoPopover
                          title="250 mm Solid Rod Limit"
                          text="Each tier uses a single continuous vertical pivot rod. Because the rod is printed as one solid piece, a single tier cannot exceed 250 mm in height."
                          formula="Tier H = Drawers × (Height + 2.15) + 1.5 ≤ 250 mm"
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
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-[#e2e8f0] font-semibold flex items-center">
                          Number of tiers
                          <InfoPopover title="Number of Tiers" text="Stacks multiple independent tier units vertically." />
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#3b1526] border border-[#f43f5e]/50 text-[#fecdd3] text-[11px] font-bold">
                          {tiers}
                        </span>
                      </div>
                      <input
                        type="range" min="1" max="5" value={tiers}
                        onChange={(e) => setTiers(parseInt(e.target.value, 10))}
                        className="w-full box-studio-slider"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-[#e2e8f0] font-semibold flex items-center">
                          Drawers per tier
                          <InfoPopover title="Drawers per Tier" text="Controls how many swing-out drawers sit inside each vertical tier." />
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${isOverP1SLimit ? 'bg-red-950 border-red-500 text-red-300' : 'bg-[#3b1526] border-[#f43f5e]/50 text-[#fecdd3]'}`}>
                          {drawersPerTier}
                        </span>
                      </div>
                      <input
                        type="range" min="1" max="10" value={drawersPerTier}
                        onChange={(e) => handleDrawersPerTierChange(e.target.value)}
                        className="w-full box-studio-slider"
                      />
                      {isOverP1SLimit && (
                        <div className="mt-1.5 flex items-center justify-between text-[11px] text-red-300 bg-red-950/50 border border-red-800/60 rounded px-2 py-1">
                          <span>⚠ Past limit — ends at {maxAllowedDrawersForCurrentHeight} drawers.</span>
                          <button onClick={() => setDrawersPerTier(maxAllowedDrawersForCurrentHeight)} className="underline font-bold ml-2">Set to {maxAllowedDrawersForCurrentHeight}</button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#e2e8f0] font-semibold flex items-center">
                        Opening <InfoPopover title="Opening Pivot Side" text="Selects which front corner holds the vertical pivot rod." />
                      </span>
                      <div className="grid grid-cols-2 gap-1 bg-[#090d16] p-0.5 rounded-md border border-[#1e293b]">
                        {['Right', 'Left'].map((dir) => (
                          <button
                            key={dir} onClick={() => setOpening(dir)}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${opening === dir ? 'bg-[#3b1526] text-[#fecdd3] border border-[#f43f5e]/50' : 'text-[#94a3b8] hover:text-white'}`}
                          >
                            {dir}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#e2e8f0] font-semibold flex items-center">
                        Handle <InfoPopover title="Handle Notch" text="Places the inward-curved finger-pull corner scoop on Front or Back." />
                      </span>
                      <div className="grid grid-cols-2 gap-1 bg-[#090d16] p-0.5 rounded-md border border-[#1e293b]">
                        {['Front', 'Back'].map((pos) => (
                          <button
                            key={pos} onClick={() => setHandlePos(pos)}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${handlePos === pos ? 'bg-[#3b1526] text-[#fecdd3] border border-[#f43f5e]/50' : 'text-[#94a3b8] hover:text-white'}`}
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-[#e2e8f0] font-semibold flex items-center">↔ Width (mm)</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#3b1526] border border-[#f43f5e]/50 text-[#fecdd3] text-[11px] font-bold">{width} mm</span>
                      </div>
                      <input type="range" min="50" max="200" value={width} onChange={(e) => setWidth(parseInt(e.target.value, 10))} className="w-full box-studio-slider" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-[#e2e8f0] font-semibold flex items-center">↗ Depth (mm)</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#3b1526] border border-[#f43f5e]/50 text-[#fecdd3] text-[11px] font-bold">{depth} mm</span>
                      </div>
                      <input type="range" min="58" max="120" value={depth} onChange={(e) => setDepth(parseInt(e.target.value, 10))} className="w-full box-studio-slider" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-[#e2e8f0] font-semibold flex items-center">↕ Height (mm)</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${isOverP1SLimit ? 'bg-red-950 border-red-500 text-red-300' : 'bg-[#3b1526] border-[#f43f5e]/50 text-[#fecdd3]'}`}>{height.toFixed(1)} mm</span>
                      </div>
                      <input type="range" min="10" max="30" step="0.1" value={height} onChange={(e) => handleHeightChange(e.target.value)} className="w-full box-studio-slider" />
                      {isOverP1SLimit && (
                        <div className="mt-1.5 flex items-center justify-between text-[11px] text-red-300 bg-red-950/50 border border-red-800/60 rounded px-2 py-1">
                          <span>⚠ Past limit — ends at {maxAllowedHeightForCurrentDrawers.toFixed(1)} mm.</span>
                          <button onClick={() => setHeight(maxAllowedHeightForCurrentDrawers)} className="underline font-bold ml-2">Set to {maxAllowedHeightForCurrentDrawers.toFixed(1)}</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* COLORS */}
              <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl">
                <button
                  onClick={() => toggleSection('colors')}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase text-[#38bdf8] border-b border-[#1e293b]"
                >
                  <span className="flex items-center gap-1.5"><Palette size={13} className="text-[#38bdf8]" /> Colors (Dual-Color)</span>
                  {openSections.colors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {openSections.colors && (
                  <div className="p-3.5 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => { const temp = casingColorId; setCasingColorId(drawerColorId); setDrawerColorId(temp); }}
                        className="flex-1 py-1.5 px-2 rounded bg-[#151e31] hover:bg-[#1e293b] border border-[#334155] text-[11px] font-semibold text-[#e2e8f0] flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeftRight size={12} className="text-[#38bdf8]" /> Swap Casing &amp; Drawers
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-[#cbd5e1] font-semibold">1. Outer Casing &amp; Pivot Rod</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#3b1526] border border-[#f43f5e]/50 text-[#fecdd3] text-[10px] font-bold">{activeCasingColor.name}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {BAMBU_PLA_COLORS.map((col) => (
                          <button
                            key={`case_${col.id}`} onClick={() => setCasingColorId(col.id)} title={col.name}
                            className={`p-1 rounded-md border flex flex-col items-center gap-1 transition-all ${casingColorId === col.id ? 'border-[#f43f5e] bg-[#3b1526]/60 scale-[1.03]' : 'border-[#1e293b] bg-[#151e31]'}`}
                          >
                            <span className="w-full h-4 rounded-sm border border-black/30" style={{ backgroundColor: col.hex }} />
                            <span className="text-[9px] text-[#cbd5e1] truncate w-full text-center leading-tight">{col.name.replace('Matte ', '')}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-[#cbd5e1] font-semibold">2. Swing Drawers &amp; Dividers</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#3b1526] border border-[#f43f5e]/50 text-[#fecdd3] text-[10px] font-bold">{activeDrawerColor.name}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5">
                        {BAMBU_PLA_COLORS.map((col) => (
                          <button
                            key={`drawer_${col.id}`} onClick={() => setDrawerColorId(col.id)} title={col.name}
                            className={`p-1 rounded-md border flex flex-col items-center gap-1 transition-all ${drawerColorId === col.id ? 'border-[#f43f5e] bg-[#3b1526]/60 scale-[1.03]' : 'border-[#1e293b] bg-[#151e31]'}`}
                          >
                            <span className="w-full h-4 rounded-sm border border-black/30" style={{ backgroundColor: col.hex }} />
                            <span className="text-[9px] text-[#cbd5e1] truncate w-full text-center leading-tight">{col.name.replace('Matte ', '')}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* LABELS */}
              <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl">
                <button
                  onClick={() => toggleSection('labels')}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase text-[#38bdf8] border-b border-[#1e293b]"
                >
                  <span className="flex items-center gap-1.5"><Tag size={13} className="text-[#38bdf8]" /> Labels</span>
                  {openSections.labels ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {openSections.labels && (
                  <div className="p-3.5 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#e2e8f0]">Enable label slot</span>
                      <button
                        type="button" onClick={() => setEnableLabelSlot(!enableLabelSlot)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${enableLabelSlot ? 'bg-[#f43f5e]' : 'bg-[#334155]'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enableLabelSlot ? 'translate-x-5' : ''}`} />
                      </button>
                    </div>

                    {enableLabelSlot && (
                      <>
                        <div>
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="text-[#e2e8f0] font-semibold">↔ Label width ({Math.min(labelWidth, maxLabelWidth)} / {maxLabelWidth} mm)</span>
                          </div>
                          <input type="range" min="10" max={maxLabelWidth} value={Math.min(labelWidth, maxLabelWidth)} onChange={(e) => setLabelWidth(parseFloat(e.target.value))} className="w-full box-studio-slider" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center text-xs mb-1.5">
                            <span className="text-[#e2e8f0] font-semibold">↕ Label height ({Math.min(labelHeight, maxLabelHeight)} / {maxLabelHeight} mm)</span>
                          </div>
                          <input type="range" min="6" max={maxLabelHeight} step="0.5" value={Math.min(labelHeight, maxLabelHeight)} onChange={(e) => setLabelHeight(parseFloat(e.target.value))} className="w-full box-studio-slider" />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* DIVIDERS */}
              <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl">
                <button
                  onClick={() => toggleSection('dividers')}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-[11px] font-bold tracking-widest uppercase text-[#38bdf8] border-b border-[#1e293b]"
                >
                  <span className="flex items-center gap-1.5"><Grid size={13} className="text-[#38bdf8]" /> Drawer Sections &amp; Labels</span>
                  {openSections.dividers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {openSections.dividers && (
                  <div className="p-3.5 space-y-4 max-h-[320px] overflow-y-auto pr-1">
                    {Array.from({ length: tiers }).map((_, tr) => {
                      const t = tiers - 1 - tr;
                      return (
                        <div key={t} className="space-y-2">
                          <div className="text-[11px] font-bold text-[#38bdf8]">Tier {t + 1}</div>
                          {Array.from({ length: drawersPerTier }).map((_, br) => {
                            const b = drawersPerTier - 1 - br;
                            const key = `tier_${t}_box_${b}`;
                            const div = drawerDividers[key] || { h: 1, v: 1 };
                            return (
                              <div key={b} className="p-2 rounded-lg bg-[#151e31] border border-[#1e293b] space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold text-[#94a3b8] w-5">{b + 1}.</span>
                                  <input
                                    type="text" placeholder="Label text..." value={labels[key] || ''}
                                    onChange={(e) => setLabels(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="flex-1 bg-[#0b0f19] border border-[#1e293b] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#38bdf8]"
                                  />
                                </div>
                                <div className="flex items-center justify-between pl-6 text-[10px]">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[#64748b]">H:</span>
                                    {[1, 2, 3, 4].map((n) => (
                                      <button
                                        key={`h_${n}`} onClick={() => setDrawerDividers(prev => ({ ...prev, [key]: { ...(prev[key] || { h: 1, v: 1 }), h: n } }))}
                                        className={`w-5 h-5 rounded font-bold ${div.h === n ? 'bg-[#f43f5e] text-white' : 'bg-[#0b0f19] text-[#64748b]'}`}
                                      >{n}</button>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[#64748b]">V:</span>
                                    {[1, 2, 3, 4].map((n) => (
                                      <button
                                        key={`v_${n}`} onClick={() => setDrawerDividers(prev => ({ ...prev, [key]: { ...(prev[key] || { h: 1, v: 1 }), v: n } }))}
                                        className={`w-5 h-5 rounded font-bold ${div.v === n ? 'bg-[#f43f5e] text-white' : 'bg-[#0b0f19] text-[#64748b]'}`}
                                      >{n}</button>
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
                )}
              </div>
            </>
          ) : (
            // CARGO MATRIX SIDEBAR CONTROLS
            <div className="space-y-4">
              <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-3.5 space-y-3">
                <div className="text-xs font-bold uppercase tracking-widest text-[#38bdf8]">Case Dimensions (mm)</div>
                <div>
                  <label className="text-xs text-[#94a3b8] flex justify-between mb-1">Width (Hinge Axis) <span className="text-[#fda4af] font-bold">{cargoWidth} mm</span></label>
                  <input type="range" min="40" max="200" value={cargoWidth} onChange={(e) => setCargoWidth(parseInt(e.target.value))} className="w-full box-studio-slider" />
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] flex justify-between mb-1">Length (Each Half) <span className="text-[#fda4af] font-bold">{cargoLength} mm</span></label>
                  <input type="range" min="40" max="105" value={cargoLength} onChange={(e) => setCargoLength(parseInt(e.target.value))} className="w-full box-studio-slider" />
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] flex justify-between mb-1">Height (Each Half) <span className="text-[#fda4af] font-bold">{cargoHeight} mm</span></label>
                  <input type="range" min="12" max="60" value={cargoHeight} onChange={(e) => setCargoHeight(parseInt(e.target.value))} className="w-full box-studio-slider" />
                </div>
              </div>

              <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-3.5 space-y-3">
                <div className="text-xs font-bold uppercase tracking-widest text-[#38bdf8]">Interior Grid (Base)</div>
                <div>
                  <label className="text-xs text-[#94a3b8] flex justify-between mb-1">Columns (X) <span className="text-[#fda4af] font-bold">{cargoCompX}</span></label>
                  <input type="range" min="1" max="5" value={cargoCompX} onChange={(e) => setCargoCompX(parseInt(e.target.value))} className="w-full box-studio-slider" />
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] flex justify-between mb-1">Rows (Y) <span className="text-[#fda4af] font-bold">{cargoCompY}</span></label>
                  <input type="range" min="1" max="5" value={cargoCompY} onChange={(e) => setCargoCompY(parseInt(e.target.value))} className="w-full box-studio-slider" />
                </div>
              </div>

              <div className="bg-[#0f172a]/90 border border-[#1e293b] rounded-xl p-3.5 space-y-3">
                <div className="text-xs font-bold uppercase tracking-widest text-[#38bdf8]">Colors &amp; Lid Text</div>
                <div>
                  <label className="text-xs text-[#94a3b8] mb-1 block">Box Color</label>
                  <select value={cargoBoxColor} onChange={(e) => setCargoBoxColor(e.target.value)} className="w-full bg-[#0b0f19] border border-[#1e293b] rounded p-2 text-xs text-white">
                    <option value="#C12E1F">Red</option>
                    <option value="#FF6A13">Orange</option>
                    <option value="#1A1A1A">Black</option>
                    <option value="#F8FAFC">White</option>
                    <option value="#F4EE2A">Yellow</option>
                    <option value="#0A2989">Blue</option>
                    <option value="#3F8E43">Green</option>
                    <option value="#F5547C">Hot Pink</option>
                    <option value="#E4BD68">Gold</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#94a3b8] mb-1 block">Custom Lid Text</label>
                  <input type="text" value={cargoText} onChange={(e) => setCargoText(e.target.value)} className="w-full bg-[#0b0f19] border border-[#1e293b] rounded p-2 text-xs text-white" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-3.5 bg-[#0f172a] border-t border-[#1e293b] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#94a3b8]">Est. Total Price</span>
            <span className="text-lg font-black text-[#38bdf8]">${calculatePrice().toFixed(2)}</span>
          </div>

          <button
            onClick={handleGenerateOrder}
            className="w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider bg-[#f43f5e] hover:bg-[#fb7185] text-white flex items-center justify-center gap-2 shadow-lg"
          >
            <FileText size={15} /> Generate Print Spec Sheet
          </button>
        </div>
      </aside>

      {/* RIGHT 3D VIEWPORT */}
      <main className="flex-1 h-full flex flex-col relative bg-[#0d121d] overflow-hidden">
        <header className="h-13 shrink-0 bg-[#0f172a] border-b border-[#1e293b] px-4 py-2 flex items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5">
              <Sparkles size={14} /> Interactive 3D Preview
            </span>
            {activeTab === 'storage' && (
              <div className="flex items-center gap-2.5 bg-[#151e31] px-3 py-1 rounded-lg border border-[#1e293b]">
                <span className="text-[11px] font-semibold text-[#e2e8f0]">Swing Drawers:</span>
                <input
                  type="range" min="0" max="1" step="0.02" value={swingOpenAmount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setSwingOpenAmount(val);
                    if (val <= 0.02) setOpenDrawersMap({});
                  }}
                  className="w-24 box-studio-slider"
                />
                <button
                  onClick={() => {
                    if (hasAnyOpenDrawer) { setSwingOpenAmount(0); setOpenDrawersMap({}); }
                    else { setSwingOpenAmount(0.85); }
                  }}
                  className="px-2 py-0.5 rounded-full bg-[#3b1526] border border-[#f43f5e]/50 text-[10px] font-bold text-[#fecdd3]"
                >
                  {hasAnyOpenDrawer ? 'Close All' : 'Swing Open All'}
                </button>
              </div>
            )}
            {activeTab === 'cargo' && (
              <div className="flex items-center gap-2.5 bg-[#151e31] px-3 py-1 rounded-lg border border-[#1e293b]">
                <span className="text-[11px] font-semibold text-[#e2e8f0]">Fold Lid:</span>
                <input
                  type="range" min="0" max="180" value={foldAngle}
                  onChange={(e) => setFoldAngle(parseFloat(e.target.value))}
                  className="w-24 box-studio-slider"
                />
                <span className="text-[11px] text-[#fda4af] font-mono">{foldAngle}°</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'storage' && (
              <>
                <button onClick={() => setExplodedView(!explodedView)} className={`px-2.5 py-1 rounded text-xs font-medium border ${explodedView ? 'bg-[#3b1526] border-[#f43f5e] text-[#fecdd3]' : 'bg-[#151e31] border-[#1e293b] text-[#94a3b8]'}`}>Exploded</button>
                <button onClick={() => setXrayMode(!xrayMode)} className={`px-2.5 py-1 rounded text-xs font-medium border ${xrayMode ? 'bg-[#3b1526] border-[#f43f5e] text-[#fecdd3]' : 'bg-[#151e31] border-[#1e293b] text-[#94a3b8]'}`}>X-Ray</button>
              </>
            )}
          </div>
        </header>

        <div ref={mountRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing" />
      </main>

      {/* SPEC SHEET & ETSY REDIRECT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
            <div className="px-5 py-4 bg-[#0f172a] border-b border-[#1e293b] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#38bdf8] uppercase tracking-wider">
                  FieldMatrix 3D • Order Specification Sheet
                </h3>
                <p className="text-[11px] text-[#94a3b8]">
                  Design code generated: <strong className="text-white">{designCode}</strong>
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#94a3b8] hover:text-white text-sm font-bold px-2 py-1">✕</button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-[#0b0f19] m-4 rounded-lg border border-[#1e293b]">
              <pre className="text-xs font-mono text-[#e2e8f0] whitespace-pre-wrap leading-relaxed">
                {generateSpecSheet()}
              </pre>
            </div>

            <div className="px-5 py-3.5 bg-[#0f172a] border-t border-[#1e293b] flex items-center justify-between">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(designCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-4 py-2 rounded-lg bg-[#151e31] hover:bg-[#1e293b] border border-[#334155] text-xs font-bold text-white flex items-center gap-1.5"
              >
                {copied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />} Copy Design Code
              </button>
              <a
                href={activeTab === 'storage' ? ETSY_BENCH_URL : ETSY_CARGO_URL}
                target="_blank" rel="noopener noreferrer"
                className="px-5 py-2 rounded-lg bg-[#f43f5e] hover:bg-[#fb7185] text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#f43f5e]/20"
              >
                Order on Etsy <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN RECALL MODAL */}
      {adminMode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1e293b] rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-[#38bdf8] uppercase tracking-wider">Admin Order Recall</h3>
            <div>
              <label className="text-xs text-[#94a3b8] block mb-1">Enter Customer Design Code (e.g. BENCH-XYZ123)</label>
              <input
                type="text" value={recallCode} onChange={(e) => setRecallCode(e.target.value)} placeholder="BENCH-XXXXXX"
                className="w-full bg-[#0b0f19] border border-[#1e293b] rounded px-3 py-2 text-xs font-mono text-white uppercase"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setAdminMode(false)} className="flex-1 py-2 rounded bg-[#151e31] text-xs font-semibold text-[#94a3b8]">Cancel</button>
              <button onClick={handleAdminRecall} className="flex-1 py-2 rounded bg-[#f43f5e] text-xs font-bold text-white">Recall Design</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
