// ==========================================================
// THE BENCH MATRIX V2 - PRODUCTION OPENSCAD GENERATOR ENGINE
// ==========================================================

/**
 * 1. GENERATE SHELL (.scad)
 * Includes symmetrical 8.5mm latch bosses, M3 screw-head counterbores,
 * blind self-threading bottom sockets, full-span catch hooks, and parking detents.
 */
export function generateBenchShellSCAD({
  width = 200,
  depth = 150,
  height = 50,
  numDrawers = 2,
} = {}) {
  return `// ==========================================
// THE BENCH MATRIX V2 - SHELL (${width}x${depth}x${height}mm | ${numDrawers}-Bay)
// ==========================================

/* [Box Dimensions] */
width = ${width};  
depth = ${depth};  
height = ${height};  // 35 (Trace), 50 (Trail), 70 (Pursuit), 100 (Frontier)
num_drawers = ${numDrawers}; 

/* [Hidden] */
wall = 3.2; 
dimple_r_outer = 4.5; 
dimple_r_inner = 2.5; 
dimple_depth = 2.0;   

latch_w = 22; 
rib_flat_w = 7;       
latch_boss_t = 8.5;   
latch_cut_d = 6.0;    
hole_offset_x = 4.8;  
latch_offset = depth/2 - 30; 

bay_w = (width - (wall * (num_drawers + 1))) / num_drawers;

module bench_shell() {
    difference() {
        union() {
            // 1. Main Outer Block
            cube([width, depth, height], center=true);
            
            // 2. 100% SYMMETRICAL Support-Free External Latch Bosses
            for (side = [-1, 1]) {
                hull() {
                    translate([side * (width/2), -latch_offset, 0])
                        cube([0.2, latch_w + (rib_flat_w * 2) + (latch_boss_t * 2), height], center=true);
                    translate([side * (width/2 + latch_boss_t/2), -latch_offset, 0])
                        cube([latch_boss_t, latch_w + (rib_flat_w * 2), height], center=true);
                }
            }
        }
        
        // 3. Hollow Out Each Individual Drawer Bay
        for (i = [0 : num_drawers - 1]) {
            bay_center_x = -width/2 + wall + (bay_w/2) + i * (bay_w + wall);
            translate([bay_center_x, -wall/2, 0])
                cube([bay_w, depth, height - (wall*2)], center=true);
        }
        
        // 4. Sealed Top Stacking Dimples
        for (x = [-width/2 + 15, width/2 - 15]) {
            for (y = [-depth/2 + 15, depth/2 - 15]) {
                translate([x, y, height/2 - dimple_depth + 0.01])
                    cylinder(h=dimple_depth, r1=dimple_r_inner, r2=dimple_r_outer, $fn=64);
            }
        }
        
        // 5. Clean 22mm Channel + Counterbored Top Entry Hole + Hidden Bottom Blind Hole
        for (side = [-1, 1]) {
            translate([side * (width/2 + latch_boss_t - latch_cut_d/2 + 2.0), -latch_offset, 0])
                cube([latch_cut_d + 4.0, latch_w, height + 1], center=true);
                
            // 5a. TOP RIB M3 SHAFT HOLE (-Y side)
            translate([side * (width/2 + hole_offset_x), -latch_offset - (latch_w/2) - 10, -height/2 + 8])
                rotate([90, 0, 0])
                cylinder(h = 22, r = 1.65, center=true, $fn=32);
                
            // 5b. TOP RIB SCREW HEAD COUNTERBORE (-Y side)
            translate([side * (width/2 + hole_offset_x), -latch_offset - (latch_w/2) - 14, -height/2 + 8])
                rotate([90, 0, 0])
                cylinder(h = 20, r = 2.9, center=true, $fn=32);
                
            // 5c. BOTTOM RIB BLIND HOLE (+Y side)
            translate([side * (width/2 + hole_offset_x), -latch_offset + (latch_w/2) + 2.5, -height/2 + 8])
                rotate([90, 0, 0])
                cylinder(h = 6, r = 1.45, center=true, $fn=32);
        }
    }
    
    // 6. Full-Span Top Cam-Latch Catch Hooks + Anchored Parking Detent Ridges
    for (side = [-1, 1]) {
        translate([side * (width/2 + latch_boss_t - 2.0), -latch_offset, height/2 - 3])
        hull() {
            cube([4.0, latch_w + 4, 2], center=true);
            translate([-side * 2.0, 0, -2.5])
                cube([0.1, latch_w + 4, 2], center=true);
        }
        
        for (end = [-1, 1]) {
            translate([side * (width/2 + 3.2), -latch_offset + end * (latch_w/2), -height/2 + 20])
                rotate([0, 0, 45])
                cube([1.6, 1.6, 4.0], center=true);
        }
    }

    // 7. Bottom Stacking Pegs
    for (x = [-width/2 + 15, width/2 - 15]) {
        for (y = [-depth/2 + 15, depth/2 - 15]) {
            translate([x, y, -height/2 - (dimple_depth - 0.2)])
                cylinder(h=dimple_depth - 0.2 + 0.05, r1=dimple_r_inner - 0.2, r2=dimple_r_outer - 0.2, $fn=64); 
        }
    }

    // 8. Internal V-Rails + Stops
    for (i = [0 : num_drawers - 1]) {
        bay_center_x = -width/2 + wall + (bay_w/2) + i * (bay_w + wall);
        
        for (side = [-1, 1]) {
            rail_x = bay_center_x + side * (bay_w/2);
            
            translate([rail_x, -wall/2, 0])
                rotate([0, 45, 0])
                cube([2.6, depth - wall*2, 2.6], center=true);
                
            translate([rail_x, -depth/2 + 14, 0])
            hull() {
                rotate([0, 45, 0]) cube([2.6, 5.0, 2.6], center=true);
                rotate([0, 45, 0]) cube([3.2, 1.5, 3.2], center=true);
            }
                
            translate([rail_x, depth/2 - 15, 0])
            hull() {
                rotate([0, 45, 0]) cube([2.6, 6.0, 2.6], center=true);
                rotate([0, 45, 0]) cube([3.1, 2.0, 3.1], center=true);
            }
        }
    }
}

rotate([-90, 0, 0]) 
    bench_shell();
`;
}

/**
 * 2. GENERATE DRAWER (.scad)
 * Includes Method 2 horizontal hard-pull stop, rear snap-lock pocket,
 * permanent internal divider grid, and flush faceplate with slide-in U-track.
 */
export function generateBenchDrawerSCAD({
  width = 200,
  depth = 150,
  height = 50,
  numDrawers = 2,
  divCols = 1,
  divRows = 3,
} = {}) {
  return `// ==========================================
// THE BENCH MATRIX V2 - DRAWER (1/${numDrawers} Width | ${divCols}x${divRows} Grid)
// ==========================================

/* [Drawer Customization] */
shell_w = ${width};  
shell_d = ${depth};  
shell_h = ${height};  
num_drawers = ${numDrawers}; 
div_cols = ${divCols};    
div_rows = ${divRows};    

/* [Hidden] */
wall = 3.2;
bay_w = (shell_w - (wall * (num_drawers + 1))) / num_drawers;
face_w = bay_w - 0.4; // Framed cleanly inside each individual bay! 

drawer_w = bay_w - 0.8;
drawer_d = shell_d - (wall * 2) - 0.4;
drawer_h = shell_h - (wall * 2) - 0.8;
d_wall = 3.6; 
inner_wall = 1.6; 

track_w = min(80, face_w - 12);
track_h = 16;
track_depth = 5;

module drawer() {
    difference() {
        translate([0, 0, drawer_h/2])
            cube([drawer_w, drawer_d, drawer_h], center=true);
        
        translate([0, 0, drawer_h/2 + 2.4])
            cube([drawer_w - (d_wall*2), drawer_d - 4.8, drawer_h], center=true);
            
        for (side = [-1, 1]) {
            translate([side * (drawer_w/2), -9, drawer_h/2])
                rotate([0, 45, 0])
                cube([3.1, drawer_d - 18, 3.1], center=true); 
                
            translate([side * (drawer_w/2), drawer_d/2 - 9, drawer_h/2])
                rotate([0, 45, 0])
                cube([2.7, 20, 2.7], center=true);
                
            translate([side * (drawer_w/2), drawer_d/2 - 11.8, drawer_h/2])
            hull() {
                rotate([0, 45, 0]) cube([3.1, 6.5, 3.1], center=true);
                rotate([0, 45, 0]) cube([3.5, 2.5, 3.5], center=true);
            }
        }
    }
    
    inner_w = drawer_w - (d_wall * 2);
    inner_d = drawer_d - 4.8;
    div_h = drawer_h - 2.4 - 2.0; 
    
    if (div_cols > 1) {
        for (c = [1 : div_cols - 1]) {
            div_x = -inner_w/2 + c * (inner_w / div_cols);
            translate([div_x, 0, 2.4 + div_h/2])
                cube([inner_wall, inner_d, div_h], center=true);
        }
    }
    
    if (div_rows > 1) {
        for (r = [1 : div_rows - 1]) {
            div_y = -inner_d/2 + r * (inner_d / div_rows);
            translate([0, div_y, 2.4 + div_h/2])
                cube([inner_w, inner_wall, div_h], center=true);
        }
    }
    
    face_z_shift = (shell_h - drawer_h) / 2;
    translate([0, -drawer_d/2 - 1.2, drawer_h/2 + face_z_shift]) {
        cube([face_w, 2.4, shell_h - 0.4], center=true);
        
        translate([0, -1.2 - track_depth/2, -shell_h/4]) {
            difference() {
                cube([track_w, track_depth, track_h], center=true);
                translate([0, 0, 1.2]) 
                    cube([track_w - 4, track_depth - 2.4, track_h], center=true);
                translate([0, -1.5, 1.2])
                    cube([track_w - 8, track_depth, track_h], center=true);
            }
        }
    }
}

drawer();
`;
}

/**
 * 3. GENERATE INTERCHANGEABLE TOP LID (.scad)
 * Supports Style 1 (Stackable Worktop), Style 2 (4-Bin Organizer), Style 3 (Folding Carry Handle).
 */
export function generateBenchLidSCAD({
  width = 200,
  depth = 150,
  lidH = 18,
  lidStyle = 3,
  showHandle = true,
} = {}) {
  return `// ==========================================
// THE BENCH MATRIX V2 - TOP LID (Style ${lidStyle})
// ==========================================

/* [Lid Options] */
width = ${width};  
depth = ${depth};  
lid_h = ${lidH};   
lid_style = ${lidStyle}; // 1 = Worktop, 2 = Organizer, 3 = Carry Handle
show_handle = ${showHandle ? "true" : "false"}; 

/* [Hidden] */
wall = 3.2; 
dimple_r_outer = 4.5;
dimple_r_inner = 2.5; 
dimple_depth = 2.0; 

latch_w = 22; 
rib_flat_w = 7;       
latch_boss_t = 8.5;   
latch_cut_d = 6.0;
hole_offset_x = 4.8;  
latch_offset = depth/2 - 30; 

module bench_lid() {
    difference() {
        union() {
            cube([width, depth, lid_h], center=true);
            
            for (side = [-1, 1]) {
                hull() {
                    translate([side * (width/2), -latch_offset, 0])
                        cube([0.2, latch_w + (rib_flat_w * 2) + (latch_boss_t * 2), lid_h], center=true);
                    translate([side * (width/2 + latch_boss_t/2), -latch_offset, 0])
                        cube([latch_boss_t, latch_w + (rib_flat_w * 2), lid_h], center=true);
                }
            }
        }
        
        for (side = [-1, 1]) {
            translate([side * (width/2 + latch_boss_t - latch_cut_d/2 + 2.0), -latch_offset, 0])
                cube([latch_cut_d + 4.0, latch_w, lid_h + 1], center=true);
                
            translate([side * (width/2 + hole_offset_x), -latch_offset - (latch_w/2) - 10, 0])
                rotate([90, 0, 0])
                cylinder(h = 22, r = 1.65, center=true, $fn=32);
                
            translate([side * (width/2 + hole_offset_x), -latch_offset - (latch_w/2) - 14, 0])
                rotate([90, 0, 0])
                cylinder(h = 20, r = 2.9, center=true, $fn=32);
                
            translate([side * (width/2 + hole_offset_x), -latch_offset + (latch_w/2) + 2.5, 0])
                rotate([90, 0, 0])
                cylinder(h = 6, r = 1.45, center=true, $fn=32);
        }
        
        if (lid_style == 1) {
            for (x = [-width/2 + 15, width/2 - 15]) {
                for (y = [-depth/2 + 15, depth/2 - 15]) {
                    translate([x, y, lid_h/2 - dimple_depth + 0.01])
                        cylinder(h=dimple_depth, r1=dimple_r_inner, r2=dimple_r_outer, $fn=64);
                }
            }
        }
        
        if (lid_style == 2) {
            tray_d = 10;
            translate([0, -depth/4 - 2, lid_h/2])
            hull() {
                cube([width - 20, depth/2 - 12, 0.1], center=true);
                translate([0, 0, -tray_d])
                    cube([width - 20 - (tray_d*2), depth/2 - 12 - (tray_d*2), 0.1], center=true);
            }
                
            bin_w = (width - 28) / 3;
            for (b = [-1, 0, 1]) {
                translate([b * (bin_w + 4), depth/4 + 2, lid_h/2])
                hull() {
                    cube([bin_w, depth/2 - 12, 0.1], center=true);
                    translate([0, 0, -tray_d])
                        cube([bin_w - (tray_d*2), depth/2 - 12 - (tray_d*2), 0.1], center=true);
                }
            }
        }
        
        if (lid_style == 3) {
            pocket_d = 5.0;
            translate([0, 0, lid_h/2])
            hull() {
                cube([130, 44, 0.1], center=true);
                translate([0, 0, -pocket_d])
                    cube([120, 34, 0.1], center=true);
            }
        }
    }
    
    if (lid_style == 3) {
        pocket_d = 5.0;
        for (side = [-1, 1]) {
            difference() {
                translate([side * 44, 0, lid_h/2 - pocket_d])
                hull() {
                    cube([16, 32, 0.1], center=true); 
                    translate([0, 0, 14])
                        cube([16, 18, 4], center=true); 
                }
                
                translate([side * 44, 0, lid_h/2 + 6])
                    rotate([0, 90, 0])
                    cylinder(h = 24, r = 1.45, center=true, $fn=32);
            }
        }
    }
    
    for (x = [-width/2 + 15, width/2 - 15]) {
        for (y = [-depth/2 + 15, depth/2 - 15]) {
            translate([x, y, -lid_h/2 - (dimple_depth - 0.2)])
                cylinder(h=dimple_depth - 0.2 + 0.05, r1=dimple_r_inner - 0.2, r2=dimple_r_outer - 0.2, $fn=64); 
        }
    }
}

module carry_handle() {
    difference() {
        union() {
            hull() {
                for (side = [-1, 1]) {
                    translate([side * 52, 26, 0])
                        cylinder(h = 14, r = 8, center=true, $fn=64);
                    translate([side * 52, 0, 0])
                        cylinder(h = 14, r = 8, center=true, $fn=64);
                }
            }
        }
        
        hull() {
            for (side = [-1, 1]) {
                translate([side * 38.5, 14, 0])
                    cylinder(h = 20, r = 4, center=true, $fn=32);
                translate([side * 38.5, -10, 0])
                    cylinder(h = 20, r = 4, center=true, $fn=32);
            }
        }
        
        for (side = [-1, 1]) {
            translate([side * 44, -2, 0])
                cube([17, 22, 20], center=true);
                
            translate([side * 50, 0, 0])
                rotate([0, 90, 0])
                cylinder(h = 30, r = 1.65, center=true, $fn=32);
        }
        
        for (fg = [-27, -9, 9, 27]) {
            translate([fg, 10.5, 0])
                cylinder(h = 20, r = 9.5, center=true, $fn=64);
        }
    }
}

rotate([-90, 0, 0])
    bench_lid();

if (lid_style == 3 && show_handle) {
    translate([0, -65, 7])
        carry_handle();
}
`;
}

/**
 * 4. GENERATE CAM-LATCH (.scad)
 * Prints flat on its side for continuous perimeter loop strength,
 * includes stow-up parking notches and thumb-pull lever.
 */
export function generateBenchLatchSCAD({
  latchW = 21.4,
  pivotToHook = 13.6,
} = {}) {
  return `// ==========================================
// THE BENCH MATRIX V2 - HEAVY-DUTY CAM LATCH
// ==========================================

/* [Latch Dimensions] */
latch_w = ${latchW};      // Fits inside 22.0mm channel with 0.3mm clearance per side
pivot_to_hook = ${pivotToHook}; // Tensioned span from M3 pin to Catch Hook

/* [Hidden] */
$fn = 64;

module bench_latch() {
    difference() {
        linear_extrude(height = latch_w, center = true) {
            union() {
                hull() {
                    circle(r = 4.2); 
                    translate([1.2, -5.0]) circle(r = 3.2);
                }
                
                hull() {
                    translate([1.2, -5.0]) circle(r = 3.2);
                    translate([1.2, -pivot_to_hook - 1.5]) circle(r = 3.0);
                }
                
                polygon(points = [
                    [2.0, -pivot_to_hook + 3.0],
                    [-3.6, -pivot_to_hook + 0.2], 
                    [-3.6, -pivot_to_hook - 1.8], 
                    [1.5, -pivot_to_hook - 3.5],  
                    [4.2, -pivot_to_hook + 1.0]
                ]);
                
                hull() {
                    translate([1.2, -pivot_to_hook - 1.5]) circle(r = 3.0);
                    translate([3.8, -pivot_to_hook - 8.5]) circle(r = 2.2);
                }
            }
        }
        
        cylinder(h = latch_w + 4, r = 1.65, center = true);
        
        translate([-2.2, -pivot_to_hook + 2.2, 0])
            rotate([0, 0, -38])
            cube([4.5, 4.5, latch_w + 2], center = true);
            
        for (gy = [-5, -8.5, -12, -15.5]) {
            translate([4.6, gy, 0])
                cylinder(h = latch_w + 2, r = 0.8, center = true);
        }
        
        for (side = [-1, 1]) {
            translate([0, -12.0, side * (latch_w / 2)])
                rotate([0, 0, 45])
                cube([2.2, 2.2, 3.0], center = true);
        }
    }
}

translate([0, 0, latch_w / 2])
    bench_latch();
`;
}

/**
 * 5. GENERATE SLIDE-IN EMBOSSED LABEL PLATES (.scad)
 * Automatically lays out all custom user labels flat on the build plate
 * with base = Shell color and embossed text = Drawer color.
 */
export function generateBenchLabelSCAD({
  labelsList = ["FASTENERS"],
  width = 200,
  numDrawers = 2,
  fontSize = 6.5,
  shellColorHex = "#222222",
  drawerColorHex = "#F6C129",
} = {}) {
  const wall = 3.2;
  const bayW = (width - wall * (numDrawers + 1)) / numDrawers;
  const faceW = bayW - 0.4;
  const trackW = Math.min(80, faceW - 12);
  const plateW = Number((trackW - 4.6).toFixed(1));

  const validLabels = (labelsList || [])
    .map((s) => String(s || "").trim())
    .filter(Boolean);
  const finalLabels = validLabels.length > 0 ? validLabels : ["SAMPLE LABEL"];
  const scadArrayStr = `[${finalLabels.map((l) => `"${l.replace(/"/g, '\\"')}"`).join(", ")}]`;

  return `// ==========================================
// THE BENCH MATRIX V2 - SLIDE-IN EMBOSSED LABELS (${finalLabels.length} PLATES)
// Base Color (Shell) : ${shellColorHex}
// Text Color (Drawer): ${drawerColorHex}
// ==========================================

plate_w = ${plateW};
plate_h = 13.0;
plate_t = 2.0; // Base thickness (Shell color)
text_h  = 0.8; // Embossed text height (Drawer color)

labels = ${scadArrayStr};

for (i = [0 : len(labels) - 1]) {
    col = i % 2;
    row = floor(i / 2);
    
    translate([col * (plate_w + 8), -row * (plate_h + 6), 0]) {
        // 1. Flat Removable Backer Plate (Shell Color)
        color("${shellColorHex}")
        translate([0, 0, plate_t/2])
            cube([plate_w, plate_h, plate_t], center=true);
            
        // 2. Embossed Text (Drawer Color)
        color("${drawerColorHex}")
        translate([0, 0, plate_t])
            linear_extrude(height = text_h)
            text(labels[i], size = ${fontSize}, font = "Liberation Sans:style=Bold", halign = "center", valign = "center");
    }
}
`;
}