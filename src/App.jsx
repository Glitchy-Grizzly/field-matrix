import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyB8ZEOzGOGeWRUYyWbZrkM_5Bl2OR37tyc",
  authDomain: "fieldmatrix-3d.firebaseapp.com",
  projectId: "fieldmatrix-3d",
  storageBucket: "fieldmatrix-3d.firebasestorage.app",
  messagingSenderId: "319878094871",
  appId: "1:319878094871:web:1eeeb9304d718e13887c52",
  measurementId: "G-PZPVDS18S2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize App Check with Fraud Defense (reCAPTCHA Enterprise)
try {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider('6Lf9XvctAAAAAJGGYSp43IqkYUCieUidOg-cxWwk'),
    isTokenAutoRefreshEnabled: true
  });
} catch (err) {
  console.error("App Check initialization error:", err);
}

const RECAPTCHA_V3_SITE_KEY = "6Lf9XvctAAAAAJGGYSp43IqkYUCieUidOg-cxWwk";

export default function App() {
  // --- STATE MANAGEMENT ---
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  
  // Configurator dimensions / state
  const [matrixConfig, setMatrixConfig] = useState({
    width: 48,
    depth: 24,
    height: 30,
    material: 'Anodized Aluminum'
  });
  
  const [configId, setConfigId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const canvasRef = useRef(null);

  // --- AUTHENTICATION ON LOAD ---
  useEffect(() => {
    signInAnonymously(auth)
      .then(() => console.log("Authenticated anonymously"))
      .catch((err) => console.error("Auth error:", err));
  }, []);

  // --- THREE.JS 3D PREVIEW SETUP ---
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Slate-900

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(60, 40, 60);

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(50, 100, 50);
    scene.add(directionalLight);

    // Dynamic 3D Box representing the Matrix Configurator
    const geometry = new THREE.BoxGeometry(matrixConfig.width, matrixConfig.height, matrixConfig.depth);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x334155, 
      roughness: 0.3, 
      metalness: 0.8 
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.y = matrixConfig.height / 2;
    scene.add(cube);

    // Grid floor
    const gridHelper = new THREE.GridHelper(200, 50, 0xf59e0b, 0x1e293b);
    scene.add(gridHelper);

    // Simple Render Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      cube.rotation.y += 0.005;
      renderer.render(scene, camera);
    };
    animate();

    // Handle Window Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [matrixConfig]);

  // --- 5-CLICK SECRET LOGO GESTURE ---
  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);
    if (newClicks >= 5) {
      setIsAdminUnlocked(true);
      setIsPopupOpen(true);
      setLogoClicks(0);
      setStatusMessage("Admin Role Unlocked!");
    }
  };

  // --- FIRESTORE SAVE / LOAD ACTIONS ---
  const handleSaveConfiguration = async () => {
    try {
      const customId = configId || `matrix-${Date.now()}`;
      await setDoc(doc(db, "configurations", customId), {
        ...matrixConfig,
        updatedAt: serverTimestamp()
      });
      setStatusMessage(`Successfully saved configuration: ${customId}`);
      setIsPopupOpen(false);
    } catch (err) {
      console.error("Save error:", err);
      setStatusMessage("Error saving configuration.");
    }
  };

  const handleLoadConfiguration = async () => {
    if (!configId) return;
    try {
      const docRef = doc(db, "configurations", configId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setMatrixConfig(docSnap.data());
        setStatusMessage(`Loaded configuration: ${configId}`);
        setIsPopupOpen(false);
      } else {
        setStatusMessage("Configuration ID not found.");
      }
    } catch (err) {
      console.error("Load error:", err);
      setStatusMessage("Error loading configuration.");
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      
      {/* 3D Canvas Viewport */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Header Bar with Logo */}
      <header className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-40 bg-slate-900/60 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={handleLogoClick}>
          {/* Logo referencing your custom favicon image */}
          <img src="/favicon.png" alt="FieldMatrix Logo" className="w-10 h-10 object-contain drop-shadow" />
          <h1 className="text-xl font-bold tracking-wider text-amber-400">FieldMatrix <span className="text-slate-300 font-light text-sm">3D Configurator</span></h1>
        </div>

        {/* PERSISTENT KEY BUTTON (Appears ONLY after admin role is unlocked) */}
        {isAdminUnlocked && (
          <button
            onClick={() => setIsPopupOpen(true)}
            className="px-4 py-2 bg-slate-800 text-amber-400 rounded-lg shadow-lg hover:bg-slate-700 transition border border-amber-500/40 flex items-center gap-2 font-medium"
            title="Open Admin Config Panel"
          >
            <span className="text-lg">🔑</span>
            <span className="hidden sm:inline">Admin Panel</span>
          </button>
        )}
      </header>

      {/* Status Toast Notification */}
      {statusMessage && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 border border-slate-700 text-amber-300 px-4 py-2 rounded-lg shadow-xl text-sm backdrop-blur">
          {statusMessage}
        </div>
      )}

      {/* POP-UP MODAL (Controlled by isPopupOpen) */}
      {isPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-md w-full relative text-slate-100">
            
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <span>⚙️</span> Matrix Configuration ID Manager
              </h3>
              <button 
                onClick={() => setIsPopupOpen(false)}
                className="text-slate-400 hover:text-slate-100 text-xl font-bold px-2"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Configuration ID</label>
                <input 
                  type="text" 
                  value={configId}
                  onChange={(e) => setConfigId(e.target.value)}
                  placeholder="Enter custom ID..."
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Width</label>
                  <input 
                    type="number" 
                    value={matrixConfig.width}
                    onChange={(e) => setMatrixConfig({...matrixConfig, width: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Depth</label>
                  <input 
                    type="number" 
                    value={matrixConfig.depth}
                    onChange={(e) => setMatrixConfig({...matrixConfig, depth: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Height</label>
                  <input 
                    type="number" 
                    value={matrixConfig.height}
                    onChange={(e) => setMatrixConfig({...matrixConfig, height: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button 
                  onClick={handleLoadConfiguration}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold rounded transition border border-slate-600 text-sm"
                >
                  Load ID
                </button>
                <button 
                  onClick={handleSaveConfiguration}
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded transition text-sm shadow"
                >
                  Save ID & Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
