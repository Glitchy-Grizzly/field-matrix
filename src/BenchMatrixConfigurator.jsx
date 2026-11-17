import React, { useState, useMemo } from "react";
import {
  generateBenchShellSCAD,
  generateBenchDrawerSCAD,
  generateBenchLidSCAD,
  generateBenchLatchSCAD,
  generateBenchLabelSCAD,
} from "./benchV2Generator";

const TIER_PRESETS = [
  { name: "Trace (35mm)", height: 35 },
  { name: "Trail (50mm)", height: 50 },
  { name: "Pursuit (70mm)", height: 70 },
  { name: "Frontier (100mm)", height: 100 },
];

export default function BenchMatrixConfigurator() {
  const [activePart, setActivePart] = useState("shell"); // 'shell' | 'drawer' | 'lid' | 'latch' | 'label'
  const [width, setWidth] = useState(200);
  const [depth, setDepth] = useState(150);
  const [height, setHeight] = useState(50);
  const [numDrawers, setNumDrawers] = useState(2);
  const [divCols, setDivCols] = useState(1);
  const [divRows, setDivRows] = useState(3);
  const [lidStyle, setLidStyle] = useState(3);
  const [showHandle, setShowHandle] = useState(true);
  const [labelText, setLabelText] = useState("M3 HARDWARE");

  const scadCode = useMemo(() => {
    switch (activePart) {
      case "shell":
        return generateBenchShellSCAD({ width, depth, height, numDrawers });
      case "drawer":
        return generateBenchDrawerSCAD({
          width,
          depth,
          height,
          numDrawers,
          divCols,
          divRows,
        });
      case "lid":
        return generateBenchLidSCAD({ width, depth, lidStyle, showHandle });
      case "latch":
        return generateBenchLatchSCAD();
      case "label":
        return generateBenchLabelSCAD({ labelText, width, numDrawers });
      default:
        return "";
    }
  }, [
    activePart,
    width,
    depth,
    height,
    numDrawers,
    divCols,
    divRows,
    lidStyle,
    showHandle,
    labelText,
  ]);

  const handleDownload = () => {
    const filenameMap = {
      shell: `bench_v2_shell_${width}x${depth}x${height}_${numDrawers}bay.scad`,
      drawer: `bench_v2_drawer_${height}h_${numDrawers}bay_${divCols}x${divRows}grid.scad`,
      lid: `bench_v2_lid_style${lidStyle}.scad`,
      latch: `bench_v2_cam_latch.scad`,
      label: `bench_v2_label_${labelText.toLowerCase().replace(/\s+/g, "_")}.scad`,
    };

    const blob = new Blob([scadCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filenameMap[activePart] || "bench_v2_part.scad";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", gap: "24px", padding: "24px", background: "#111827", color: "#f9fafb", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      {/* Left Sidebar Controls */}
      <div style={{ width: "360px", background: "#1f2937", padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "18px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0", color: "#f97316" }}>Bench Matrix V2</h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af" }}>Support-Free Parametric Workbench Generator</p>
        </div>

        {/* Part Selector Tabs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
          {[
            { id: "shell", label: "Shell" },
            { id: "drawer", label: "Drawer" },
            { id: "lid", label: "Lid" },
            { id: "latch", label: "Latch" },
            { id: "label", label: "Label" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActivePart(tab.id)}
              style={{
                padding: "8px 4px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "12px",
                background: activePart === tab.id ? "#f97316" : "#374151",
                color: "#fff",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Footprint Controls (Shell, Drawer, Lid) */}
        {["shell", "drawer", "lid", "label"].includes(activePart) && (
          <div style={{ display: "flex", gap: "12px" }}>
            <label style={{ flex: 1, fontSize: "13px" }}>
              Width (mm)
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                style={{ width: "100%", marginTop: "4px", padding: "8px", borderRadius: "6px", border: "1px solid #4b5563", background: "#111827", color: "#fff" }}
              />
            </label>
            <label style={{ flex: 1, fontSize: "13px" }}>
              Depth (mm)
              <input
                type="number"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                style={{ width: "100%", marginTop: "4px", padding: "8px", borderRadius: "6px", border: "1px solid #4b5563", background: "#111827", color: "#fff" }}
              />
            </label>
          </div>
        )}

        {/* Tier Height & Columns (Shell & Drawer) */}
        {["shell", "drawer", "label"].includes(activePart) && (
          <>
            <div>
              <div style={{ fontSize: "13px", marginBottom: "6px" }}>Tier Height Preset</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {TIER_PRESETS.map((preset) => (
                  <button
                    key={preset.height}
                    onClick={() => setHeight(preset.height)}
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      border: height === preset.height ? "2px solid #f97316" : "1px solid #4b5563",
                      background: "#111827",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "13px", marginBottom: "6px" }}>Drawers Across Tier (Columns)</div>
              <div style={{ display: "flex", gap: "8px" }}>
                {[1, 2, 3].map((cols) => (
                  <button
                    key={cols}
                    onClick={() => setNumDrawers(cols)}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: "6px",
                      border: numDrawers === cols ? "2px solid #f97316" : "1px solid #4b5563",
                      background: "#111827",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    {cols} {cols === 1 ? "Full" : cols === 2 ? "Split" : "Triple"}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Internal Divider Grid (Drawer Only) */}
        {activePart === "drawer" && (
          <div style={{ display: "flex", gap: "12px" }}>
            <label style={{ flex: 1, fontSize: "13px" }}>
              Internal Cols ({divCols})
              <input
                type="range"
                min="1"
                max="4"
                value={divCols}
                onChange={(e) => setDivCols(Number(e.target.value))}
                style={{ width: "100%", marginTop: "6px" }}
              />
            </label>
            <label style={{ flex: 1, fontSize: "13px" }}>
              Internal Rows ({divRows})
              <input
                type="range"
                min="1"
                max="6"
                value={divRows}
                onChange={(e) => setDivRows(Number(e.target.value))}
                style={{ width: "100%", marginTop: "6px" }}
              />
            </label>
          </div>
        )}

        {/* Lid Options */}
        {activePart === "lid" && (
          <div>
            <div style={{ fontSize: "13px", marginBottom: "6px" }}>Interchangeable Lid Style</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { id: 1, name: "1. Stackable Worktop Lid" },
                { id: 2, name: "2. 4-Bin Parts Organizer Tray" },
                { id: 3, name: "3. Tactical Folding Carry Handle" },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setLidStyle(st.id)}
                  style={{
                    padding: "10px",
                    textAlign: "left",
                    borderRadius: "6px",
                    border: lidStyle === st.id ? "2px solid #f97316" : "1px solid #4b5563",
                    background: "#111827",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {st.name}
                </button>
              ))}
            </div>
            {lidStyle === 3 && (
              <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", fontSize: "13px" }}>
                <input
                  type="checkbox"
                  checked={showHandle}
                  onChange={(e) => setShowHandle(e.target.checked)}
                />
                Include Printable Carry Handle on Build Plate
              </label>
            )}
          </div>
        )}

        {/* Label Text */}
        {activePart === "label" && (
          <label style={{ fontSize: "13px" }}>
            Embossed Label Text
            <input
              type="text"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              style={{ width: "100%", marginTop: "6px", padding: "8px", borderRadius: "6px", border: "1px solid #4b5563", background: "#111827", color: "#fff" }}
            />
          </label>
        )}

        {/* Download Button */}
        <button
          onClick={handleDownload}
          style={{
            marginTop: "auto",
            padding: "14px",
            borderRadius: "8px",
            border: "none",
            background: "#f97316",
            color: "#fff",
            fontWeight: 700,
            fontSize: "15px",
            cursor: "pointer",
          }}
        >
          Download {activePart.toUpperCase()} (.scad)
        </button>
      </div>

      {/* Right Code Preview Panel */}
      <div style={{ flex: 1, background: "#1f2937", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontWeight: 600, fontSize: "14px", color: "#e5e7eb" }}>
            Generated OpenSCAD Script ({activePart.toUpperCase()})
          </span>
          <button
            onClick={() => navigator.clipboard.writeText(scadCode)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #4b5563", background: "#374151", color: "#fff", cursor: "pointer", fontSize: "12px" }}
          >
            Copy SCAD Code
          </button>
        </div>
        <pre style={{ flex: 1, margin: 0, padding: "16px", background: "#0f172a", color: "#38bdf8", borderRadius: "8px", overflow: "auto", fontSize: "12px", lineHeight: 1.5 }}>
          {scadCode}
        </pre>
      </div>
    </div>
  );
}