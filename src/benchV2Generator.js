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
wall = 2.4; 
dimple_r_outer = 4.5; 
dimple_r_inner = 2.5; 
dimple_depth = 1.4;   

latch_w = 17;         // Exact gap for 16.0mm latch + M3x30mm self-tapping screw
ear_t_bot = 6.5;      // Bottom ear thickness (holds 5.0mm self-tapping bite)
ear_t_top = 10.5;     // Top ear thickness (4.0mm counterbore + 8.0mm seat)
latch_boss_t = 8.5;   // Outward reach of hinge ears from box wall
hole_offset_x = 4.8;  // M3 screw centerline (1.4mm open air behind latch pivot)
latch_offset = depth/2 - 30; 

bay_w = (width - (wall * (num_drawers + 1))) / num_drawers;

module bench_shell() {
    difference() {
        union() {
            // 1. Main Outer Block
            cube([width, depth, height], center=true);
            
            // 2. OPTION A: Support-Free External M3x30mm Hinge Ears
            for (side = [-1, 1]) {
                // Bottom Ear (+Y side, flat face toward latch, 45-deg ramp on +Y underside)
                hull() {
                    translate([side * (width/2 + latch_boss_t/2), -latch_offset + latch_w/2 + ear_t_bot/2, -height/2 + 12])
                        cube([latch_boss_t, ear_t_bot, 22], center=true);
                    translate([side * (width/2 + 0.1), -latch_offset + latch_w/2 + ear_t_bot + latch_boss_t, -height/2 + 12])
                        cube([0.2, 0.2, 22], center=true);
                }
                // Top Ear (-Y side, flat top face for screw head, 45-deg ramp on +Y underside)
                hull() {
                    translate([side * (width/2 + latch_boss_t/2), -latch_offset - latch_w/2 - ear_t_top + 2.75, -height/2 + 8])
                        cube([latch_boss_t, 5.5, 14], center=true);
                    translate([side * (width/2 + 0.1), -latch_offset - latch_w/2, -height/2 + 8])
                        cube([0.2, 0.2, 14], center=true);
                    translate([side * (width/2 + 0.1), -latch_offset - latch_w/2 - ear_t_top, -height/2 + 8])
                        cube([0.2, 0.2, 14], center=true);
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
        
        // 5. Clean M3x30mm Clearance Bore, Counterbore & Self-Tapping Blind Socket
        for (side = [-1, 1]) {
            // 5a. Top Ear Clearance Bore (3.6mm dia so self-tapping threads slide freely)
            translate([side * (width/2 + hole_offset_x), -latch_offset - latch_w/2 - ear_t_top/2, -height/2 + 8])
                rotate([90, 0, 0])
                cylinder(h = ear_t_top + 4, r = 1.8, center=true, $fn=32);

            // 5b. Top Ear Screw Head Counterbore (4.0mm deep, stops 8.0mm above latch gap)
            translate([side * (width/2 + hole_offset_x), -latch_offset - latch_w/2 - ear_t_top + 0.5, -height/2 + 8])
                rotate([90, 0, 0])
                cylinder(h = 5.0, r = 3.0, center=true, $fn=32);

            // 5c. Bottom Ear Blind Self-Tapping Socket (2.7mm pilot, 5.5mm deep)
            translate([side * (width/2 + hole_offset_x), -latch_offset + latch_w/2 + 2.75, -height/2 + 8])
                rotate([90, 0, 0])
                cylinder(h = 5.5, r = 1.35, center=true, $fn=32);
        }
    }
    
            // 6. Standalone Support-Free Top Catch Hook + Flat-Rib Parking Detent
    for (side = [-1, 1]) {
        // Catch Hook (45-deg self-supporting ramp on +Y underside)
        hull() {
            translate([side * (width/2 + 3.25), -latch_offset, height/2 - 3.0])
                cube([6.5, latch_w, 2.2], center=true);
            translate([side * (width/2 + 0.1), -latch_offset + latch_w/2 + 6.5, height/2 - 3.0])
                cube([0.2, 0.2, 2.2], center=true);
            translate([side * (width/2 + 0.1), -latch_offset, height/2 - 5.5])
                cube([0.2, latch_w, 1.5], center=true);
        }
        // Crisp Parking Detent on the flat face of the Bottom Ear (12mm above pivot)
        translate([side * (width/2 + hole_offset_x + 1.2), -latch_offset + latch_w/2 + 0.4, -height/2 + 20])
          rotate([45, 0, 0])
          cube([1.6, 1.2, 1.2], center=true);
    }

    // 7. Bottom Stacking Pegs
    for (x = [-width/2 + 15, width/2 - 15]) {
        for (y = [-depth/2 + 15, depth/2 - 15]) {
            translate([x, y, -height/2 - (dimple_depth - 0.2)])
                cylinder(h=dimple_depth - 0.2 + 0.05, r1=dimple_r_inner - 0.2, r2=dimple_r_outer - 0.2, $fn=64); 
        }
    }

    // 8. Internal V-Rails + Stops (clipped to outer shell so 3.6mm snap bumps never poke through 2.4mm walls)
 intersection() {
     cube([width, depth, height], center=true);
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

             // Rear snap-lock detent pocket (3.6mm) for a crisp drawer click
             translate([rail_x, depth/2 - 15, 0])
             hull() {
                 rotate([0, 45, 0]) cube([2.6, 6.0, 2.6], center=true);
                 rotate([0, 45, 0]) cube([3.6, 2.0, 3.6], center=true);
             }
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
wall = 2.4;
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
                
            // Narrowed lead-in channel (2.2mm) for a crisp rear snap-lock click
          translate([side * (drawer_w/2), drawer_d/2 - 9, drawer_h/2])
              rotate([0, 45, 0])
              cube([2.2, 20, 2.2], center=true);

          // Rear snap-lock detent pocket (3.6mm)
          translate([side * (drawer_w/2), drawer_d/2 - 11.8, drawer_h/2])
          hull() {
              rotate([0, 45, 0]) cube([3.1, 6.5, 3.1], center=true);
              rotate([0, 45, 0]) cube([3.6, 2.5, 3.6], center=true);
          }

          // Rear-corner air-vent channel so trapped air vents when closing
          translate([side * (drawer_w/2 - 1.2), drawer_d/2 - 1.5, drawer_h/2])
              cube([2.4, 3.2, drawer_h - 4], center=true);
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
    
    // 3. Flush-Bottom Front Faceplate & 45-Deg Self-Supporting U-Track Handle
    face_h = drawer_h + 0.4; // Fits cleanly inside the bay opening AND sits flush at Z = 0!
    translate([0, -drawer_d/2 - 1.2, face_h/2]) {
        // Main Front Faceplate (Bottom sits at Z = 0 on the print bed!)
        cube([face_w, 2.4, face_h], center=true);
        
        // U-Channel Label Slot & Handle (With 45-deg bottom bevel starting at Z = 0!)
        // Bottom of U-track cavity sits at Z = 5.0mm; 45-deg bevel tapers from Z = 0 to Z = 5.0mm
        translate([0, -1.2, -face_h/2]) {
            track_z = max(13.0, face_h - track_h - 2.0); // Moves label slot up cleanly above the handle

            // A. U-Channel Label Slot (45-deg self-supporting bottom bevel)
            difference() {
                hull() {
                    translate([0, -track_depth/2, track_z + track_h/2])
                        cube([track_w, track_depth, track_h], center=true);
                    translate([0, -0.4, track_z - track_depth])
                        cube([track_w, 0.8, 0.8], center=true);
                }
                // Inner Slide-In Label Slot Cutout
                translate([0, -track_depth/2, track_z + (track_h / 2) + 1.4])
                    cube([track_w - 4.0, track_depth - 2.4, track_h], center=true);
                // Front Viewing Window Cutout
                translate([0, -track_depth + 0.8, track_z + (track_h / 2) + 1.4])
                    cube([track_w - 8.0, track_depth, track_h], center=true);
            }

            // B. Dedicated 45-Degree Self-Supporting Finger Pull Bar (ADDED outside difference!)
            // Ramps out 11mm at 45 degrees from Z = 0, with a 3mm upward finger catch lip
            hull() {
                translate([0, -0.5, 0.5])
                    cube([track_w, 1.0, 1.0], center=true);
                translate([0, -5.5, 9.5])
                    cube([track_w, 11.0, 2.4], center=true);
            }
            // Upward finger catch lip at the front edge
            translate([0, -9.8, 12.0])
                cube([track_w, 2.4, 3.0], center=true);
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
wall = 2.4; 
dimple_r_outer = 4.5;
dimple_r_inner = 2.5; 
dimple_depth = 1.4; 

latch_w = 17;         // Exact gap for 16.0mm latch + M3x30mm self-tapping screw
ear_t_bot = 6.5;      // Bottom ear thickness (holds 5.0mm self-tapping bite)
ear_t_top = 10.5;     // Top ear thickness (4.0mm counterbore + 8.0mm seat)
latch_boss_t = 8.5;   // Outward reach of hinge ears from box wall
latch_cut_d = 6.0;    // Depth of the cutout for the latch
hole_offset_x = 4.8;  // M3 screw centerline (1.4mm open air behind latch pivot)
latch_offset = depth/2 - 30; 

module bench_lid() {
    difference() {
        union() {
            cube([width, depth, lid_h], center=true);

            // OPTION A: Support-Free External M3x30mm Hinge Ears
            for (side = [-1, 1]) {
                // Bottom Ear (+Y side)
                hull() {
                    translate([side * (width/2 + latch_boss_t/2), -latch_offset + latch_w/2 + ear_t_bot/2, 0])
                        cube([latch_boss_t, ear_t_bot, lid_h], center=true);
                    translate([side * (width/2 + 0.1), -latch_offset + latch_w/2 + ear_t_bot + latch_boss_t, 0])
                        cube([0.2, 0.2, lid_h], center=true);
                }
                // Top Ear (-Y side)
                hull() {
                    translate([side * (width/2 + latch_boss_t/2), -latch_offset - latch_w/2 - ear_t_top + 2.75, -lid_h/2 + 8])
                        cube([latch_boss_t, 5.5, 14], center=true);
                    translate([side * (width/2 + 0.1), -latch_offset - latch_w/2, -lid_h/2 + 8])
                        cube([0.2, 0.2, 14], center=true);
                    translate([side * (width/2 + 0.1), -latch_offset - latch_w/2 - ear_t_top, -lid_h/2 + 8])
                        cube([0.2, 0.2, 14], center=true);
                }
            }
        }

        // Clean M3x30mm Clearance Bore, Counterbore & Self-Tapping Blind Socket
        for (side = [-1, 1]) {
            translate([side * (width/2 + hole_offset_x), -latch_offset - latch_w/2 - ear_t_top/2, -lid_h/2 + 8])
                rotate([90, 0, 0])
                cylinder(h = ear_t_top + 4, r = 1.8, center=true, $fn=32);

            translate([side * (width/2 + hole_offset_x), -latch_offset - latch_w/2 - ear_t_top + 0.5, -lid_h/2 + 8])
                rotate([90, 0, 0])
                cylinder(h = 5.0, r = 3.0, center=true, $fn=32);

            translate([side * (width/2 + hole_offset_x), -latch_offset + latch_w/2 + 2.75, -lid_h/2 + 8])
                rotate([90, 0, 0])
                cylinder(h = 5.5, r = 1.35, center=true, $fn=32);
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
  latchW = 17.2,
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
        union() {
            linear_extrude(height = latch_w, center = true) {
                union() {
                    hull() {
                        circle(r = 3.4); 
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
                        translate([3.6, -pivot_to_hook - 4.5]) circle(r = 2.0);
                    }
                }
            }
            // Tapered collar that tucks into the 45-deg ear to hide the screw
            translate([0, 0, latch_w / 2])
                cylinder(h = 1.4, r1 = 2.6, r2 = 2.0, $fn = 32);
        }    
        
        cylinder(h = latch_w + 4, r = 1.8, center = true);
        
        translate([-2.2, -pivot_to_hook + 2.2, 0])
            rotate([0, 0, -38])
            cube([4.5, 4.5, latch_w + 2], center = true);
            
        for (gy = [-5, -8.5, -12, -15.5]) {
            translate([4.6, gy, 0])
                cylinder(h = latch_w + 2, r = 0.8, center = true);
        }
        
        // Deeper V-notch aligned directly with the flat-rib parking detent (X = +0.2, 12mm from pivot)
        for (side = [-1, 1]) {
            translate([1.2, -12.0, side * (latch_w / 2)])
                rotate([45, 0, 0])
                cube([2.4, 2.0, 2.0], center = true);
        }
    }
}

// Left-side latch
translate([0, 0, latch_w / 2])
    bench_latch();

// Right-side latch (mirrored in X so collar stays on top for support-free printing)
translate([22, 0, latch_w / 2])
    mirror([1, 0, 0])
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
  const wall = 2.4;
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
/**
 * 6. GENERATE FULL MULTI-COLOR PRODUCTION ASSEMBLY (.scad)
 * Lays out all configured shells, custom-divided drawers, lid, handle,
 * cam-latches, and embossed labels with user-selected hex colors preserved.
 */
export function generateBenchFullAssemblySCAD({
  width = 200,
  depth = 150,
  height = 50,
  tiers = 2,
  numDrawers = 2,
  lidStyle = 2,
  drawerConfigs = [], // Array of { rows, cols } for every drawer across all tiers
  labelsList = [],
  shellColorHex = "#222222",
  drawerColorHex = "#9E8569",
  latchColorHex = "#F36B21",
} = {}) {
  const totalDrawers = tiers * numDrawers;
  const totalLatches = (tiers + (lidStyle > 0 ? 1 : 0)) * 2;

  // Format per-drawer [rows, cols] array for OpenSCAD
  const paddedConfigs = [];
  for (let i = 0; i < Math.max(1, totalDrawers); i++) {
    const cfg = drawerConfigs[i] || { rows: 3, cols: 1 };
    paddedConfigs.push(`[${cfg.rows || 3}, ${cfg.cols || 1}]`);
  }
  const scadDrawerGridArray = `[${paddedConfigs.join(", ")}]`;

  // Format non-empty labels for OpenSCAD
  const validLabels = (labelsList || [])
    .map((s) => String(s || "").trim())
    .filter(Boolean);
  const scadLabelsArray =
    validLabels.length > 0
      ? `[${validLabels.map((l) => `"${l.replace(/"/g, '\\"')}"`).join(", ")}]`
      : `[]`;

  return `// ============================================================================
// THE BENCH MATRIX V2 - COMPLETE MULTI-COLOR PRODUCTION ASSEMBLY
// Shells & Lid Color : ${shellColorHex}
// Drawers Color      : ${drawerColorHex}
// Latches & Accents  : ${latchColorHex}
// ============================================================================

/* [Assembly Configuration] */
layout_mode = "print_plate"; // "print_plate" (Flat for 3MF Slicing) or "stacked" (3D Preview)
width = ${width};
depth = ${depth};
height = ${height};
tiers = ${tiers};
num_drawers = ${numDrawers};
lid_style = ${lidStyle}; // 0 = No Lid, 1 = Worktop, 2 = Organizer, 3 = Carry Handle
lid_h = 18;

shell_color  = "${shellColorHex}";
drawer_color = "${drawerColorHex}";
latch_color  = "${latchColorHex}";

drawer_grids = ${scadDrawerGridArray};
labels_list  = ${scadLabelsArray};

/* [Hidden] */
$fn = 48;
wall = 2.4;
dimple_r_outer = 4.5;
dimple_r_inner = 2.5;
dimple_depth = 1.4;

latch_w = 17;         // Exact gap for 16.0mm latch + M3x30mm self-tapping screw
ear_t_bot = 6.5;      // Bottom ear thickness (holds 5.0mm self-tapping bite)
ear_t_top = 10.5;     // Top ear thickness (4.0mm counterbore + 8.0mm seat)
latch_boss_t = 8.5;   // Outward reach of hinge ears from box wall
hole_offset_x = 4.8;  // M3 screw centerline (1.4mm open air behind latch pivot)
latch_offset = depth/2 - 30;

bay_w = (width - (wall * (num_drawers + 1))) / num_drawers;
face_w = bay_w - 0.4;
drawer_w = bay_w - 0.8;
drawer_d = depth - (wall * 2) - 0.4;
drawer_h = height - (wall * 2) - 0.8;
d_wall = 3.6;
inner_wall = 1.6;
track_w = min(80, face_w - 12);
track_h = 16;
track_depth = 5;
plate_w = track_w - 4.6;

// --- 1. SHELL MODULE ---
module bench_shell() {
    difference() {
        union() {
            cube([width, depth, height], center=true);
            // 2. OPTION A: Support-Free External M3x30mm Hinge Ears
            for (side = [-1, 1]) {
                hull() {
                    translate([side * (width/2 + latch_boss_t/2), -latch_offset + latch_w/2 + ear_t_bot/2, -height/2 + 12])
                        cube([latch_boss_t, ear_t_bot, 22], center=true);
                    translate([side * (width/2 + 0.1), -latch_offset + latch_w/2 + ear_t_bot + latch_boss_t, -height/2 + 12])
                        cube([0.2, 0.2, 22], center=true);
                }
                hull() {
                    translate([side * (width/2 + latch_boss_t/2), -latch_offset - latch_w/2 - ear_t_top + 2.75, -height/2 + 8])
                        cube([latch_boss_t, 5.5, 14], center=true);
                    translate([side * (width/2 + 0.1), -latch_offset - latch_w/2, -height/2 + 8])
                        cube([0.2, 0.2, 14], center=true);
                    translate([side * (width/2 + 0.1), -latch_offset - latch_w/2 - ear_t_top, -height/2 + 8])
                        cube([0.2, 0.2, 14], center=true);
                }
            }
        }
        for (i = [0 : num_drawers - 1]) {
            bay_center_x = -width/2 + wall + (bay_w/2) + i * (bay_w + wall);
            translate([bay_center_x, -wall/2, 0])
                cube([bay_w, depth, height - (wall*2)], center=true);
        }
        for (x = [-width/2 + 15, width/2 - 15]) {
            for (y = [-depth/2 + 15, depth/2 - 15]) {
                translate([x, y, height/2 - dimple_depth + 0.01])
                    cylinder(h=dimple_depth, r1=dimple_r_inner, r2=dimple_r_outer);
            }
        }
            // 5. Clean M3x30mm Clearance Bore, Counterbore & Self-Tapping Blind Socket
            for (side = [-1, 1]) {
                // 5a. Top Ear Clearance Bore (3.6mm dia so self-tapping threads slide freely)
                translate([side * (width/2 + hole_offset_x), -latch_offset - latch_w/2 - ear_t_top/2, -height/2 + 8])
                    rotate([90, 0, 0])
                    cylinder(h = ear_t_top + 4, r = 1.8, center=true, $fn=32);

                // 5b. Top Ear Screw Head Counterbore (4.0mm deep, stops 8.0mm above latch gap)
                translate([side * (width/2 + hole_offset_x), -latch_offset - latch_w/2 - ear_t_top + 0.5, -height/2 + 8])
                    rotate([90, 0, 0])
                    cylinder(h = 5.0, r = 3.0, center=true, $fn=32);

                // 5c. Bottom Ear Blind Self-Tapping Socket (2.7mm pilot, 5.5mm deep)
                translate([side * (width/2 + hole_offset_x), -latch_offset + latch_w/2 + 2.75, -height/2 + 8])
                    rotate([90, 0, 0])
                    cylinder(h = 5.5, r = 1.35, center=true, $fn=32);
            
            }
        }
            // 6. Standalone Support-Free Top Catch Hook + Flat-Rib Parking Detent
            for (side = [-1, 1]) {
                // Catch Hook (45-deg self-supporting ramp on +Y underside)
                hull() {
                    translate([side * (width/2 + 3.25), -latch_offset, height/2 - 3.0])
                        cube([6.5, latch_w, 2.2], center=true);
                    translate([side * (width/2 + 0.1), -latch_offset + latch_w/2 + 6.5, height/2 - 3.0])
                        cube([0.2, 0.2, 2.2], center=true);
                    translate([side * (width/2 + 0.1), -latch_offset, height/2 - 5.5])
                        cube([0.2, latch_w, 1.5], center=true);
                }
                // Crisp Parking Detent on the flat face of the Bottom Ear (12mm above pivot)
                translate([side * (width/2 + hole_offset_x + 1.2), -latch_offset + latch_w/2 + 0.4, -height/2 + 20])
                    rotate([45, 0, 0])
                    cube([1.6, 1.2, 1.2], center=true);
            }
    for (x = [-width/2 + 15, width/2 - 15]) {
        for (y = [-depth/2 + 15, depth/2 - 15]) {
            translate([x, y, -height/2 - (dimple_depth - 0.2)])
                cylinder(h=dimple_depth - 0.2 + 0.05, r1=dimple_r_inner - 0.2, r2=dimple_r_outer - 0.2);
        }
    }
    intersection() {
        cube([width, depth, height], center=true);
        for (i = [0 : num_drawers - 1]) {
            bay_center_x = -width/2 + wall + (bay_w/2) + i * (bay_w + wall);
            for (side = [-1, 1]) {
                rail_x = bay_center_x + side * (bay_w/2);
                translate([rail_x, -wall/2, 0]) rotate([0, 45, 0]) cube([2.6, depth - wall*2, 2.6], center=true);
                translate([rail_x, -depth/2 + 14, 0]) hull() {
                    rotate([0, 45, 0]) cube([2.6, 5.0, 2.6], center=true);
                    rotate([0, 45, 0]) cube([3.2, 1.5, 3.2], center=true);
                }
                // Rear snap-lock detent pocket (3.6mm) for a crisp drawer click
                translate([rail_x, depth/2 - 15, 0]) hull() {
                    rotate([0, 45, 0]) cube([2.6, 6.0, 2.6], center=true);
                    rotate([0, 45, 0]) cube([3.6, 2.0, 3.6], center=true);
                }
            }
        }
    }
}

// --- 2. DRAWER MODULE ---
module drawer(div_rows = 3, div_cols = 1) {
    difference() {
        translate([0, 0, drawer_h/2]) cube([drawer_w, drawer_d, drawer_h], center=true);
        translate([0, 0, drawer_h/2 + 2.4]) cube([drawer_w - (d_wall*2), drawer_d - 4.8, drawer_h], center=true);
        for (side = [-1, 1]) {
            translate([side * (drawer_w/2), -9, drawer_h/2]) rotate([0, 45, 0]) cube([3.1, drawer_d - 18, 3.1], center=true);
            // Narrowed lead-in channel (2.2mm) for a crisp rear snap-lock click
          translate([side * (drawer_w/2), drawer_d/2 - 9, drawer_h/2])
              rotate([0, 45, 0])
              cube([2.2, 20, 2.2], center=true);

          // Rear snap-lock detent pocket (3.6mm)
          translate([side * (drawer_w/2), drawer_d/2 - 11.8, drawer_h/2])
          hull() {
              rotate([0, 45, 0]) cube([3.1, 6.5, 3.1], center=true);
              rotate([0, 45, 0]) cube([3.6, 2.5, 3.6], center=true);
          }

          // Rear-corner air-vent channel so trapped air vents when closing
          translate([side * (drawer_w/2 - 1.2), drawer_d/2 - 1.5, drawer_h/2])
              cube([2.4, 3.2, drawer_h - 4], center=true);
            }
        }

    inner_w = drawer_w - (d_wall * 2);
    inner_d = drawer_d - 4.8;
    div_h = drawer_h - 2.4 - 2.0;
    if (div_cols > 1) {
        for (c = [1 : div_cols - 1]) {
            div_x = -inner_w/2 + c * (inner_w / div_cols);
            translate([div_x, 0, 2.4 + div_h/2]) cube([inner_wall, inner_d, div_h], center=true);
        }
    }
    if (div_rows > 1) {
        for (r = [1 : div_rows - 1]) {
            div_y = -inner_d/2 + r * (inner_d / div_rows);
            translate([0, div_y, 2.4 + div_h/2]) cube([inner_w, inner_wall, div_h], center=true);
        }
    }
    // 3. Flush-Bottom Front Faceplate & 45-Deg Self-Supporting U-Track Handle
    face_h = drawer_h + 0.4; // Fits cleanly inside the bay opening AND sits flush at Z = 0!
    translate([0, -drawer_d/2 - 1.2, face_h/2]) {
        // Main Front Faceplate (Bottom sits at Z = 0 on the print bed!)
        cube([face_w, 2.4, face_h], center=true);
        
        // U-Channel Label Slot & Handle (With 45-deg bottom bevel starting at Z = 0!)
        // Bottom of U-track cavity sits at Z = 5.0mm; 45-deg bevel tapers from Z = 0 to Z = 5.0mm
        translate([0, -1.2, -face_h/2]) {
            track_z = max(13.0, face_h - track_h - 2.0); // Moves label slot up cleanly above the handle

            // A. U-Channel Label Slot (45-deg self-supporting bottom bevel)
            difference() {
                hull() {
                    translate([0, -track_depth/2, track_z + track_h/2])
                        cube([track_w, track_depth, track_h], center=true);
                    translate([0, -0.4, track_z - track_depth])
                        cube([track_w, 0.8, 0.8], center=true);
                }
                // Inner Slide-In Label Slot Cutout
                translate([0, -track_depth/2, track_z + (track_h / 2) + 1.4])
                    cube([track_w - 4.0, track_depth - 2.4, track_h], center=true);
                // Front Viewing Window Cutout
                translate([0, -track_depth + 0.8, track_z + (track_h / 2) + 1.4])
                    cube([track_w - 8.0, track_depth, track_h], center=true);
            }

            // B. Dedicated 45-Degree Self-Supporting Finger Pull Bar (ADDED outside difference!)
            // Ramps out 11mm at 45 degrees from Z = 0, with a 3mm upward finger catch lip
            hull() {
                translate([0, -0.5, 0.5])
                    cube([track_w, 1.0, 1.0], center=true);
                translate([0, -5.5, 9.5])
                    cube([track_w, 11.0, 2.4], center=true);
            }
            // Upward finger catch lip at the front edge
            translate([0, -9.8, 12.0])
                cube([track_w, 2.4, 3.0], center=true);
        }
    }
}

// --- 3. TOP LID & HANDLE MODULES ---
module bench_lid() {
    difference() {
        union() {
            cube([width, depth, lid_h], center=true);

            // OPTION A: Support-Free External M3x30mm Hinge Ears
            for (side = [-1, 1]) {
                // Bottom Ear (+Y side)
                hull() {
                    translate([side * (width/2 + latch_boss_t/2), -latch_offset + latch_w/2 + ear_t_bot/2, 0])
                        cube([latch_boss_t, ear_t_bot, lid_h], center=true);
                    translate([side * (width/2 + 0.1), -latch_offset + latch_w/2 + ear_t_bot + latch_boss_t, 0])
                        cube([0.2, 0.2, lid_h], center=true);
                }
                // Top Ear (-Y side)
                hull() {
                    translate([side * (width/2 + latch_boss_t/2), -latch_offset - latch_w/2 - ear_t_top + 2.75, -lid_h/2 + 8])
                        cube([latch_boss_t, 5.5, 14], center=true);
                    translate([side * (width/2 + 0.1), -latch_offset - latch_w/2, -lid_h/2 + 8])
                        cube([0.2, 0.2, 14], center=true);
                    translate([side * (width/2 + 0.1), -latch_offset - latch_w/2 - ear_t_top, -lid_h/2 + 8])
                        cube([0.2, 0.2, 14], center=true);
                }
            }
        }

        // Clean M3x30mm Clearance Bore, Counterbore & Self-Tapping Blind Socket
        for (side = [-1, 1]) {
            translate([side * (width/2 + hole_offset_x), -latch_offset - latch_w/2 - ear_t_top/2, -lid_h/2 + 8])
                rotate([90, 0, 0])
                cylinder(h = ear_t_top + 4, r = 1.8, center=true, $fn=32);

            translate([side * (width/2 + hole_offset_x), -latch_offset - latch_w/2 - ear_t_top + 0.5, -lid_h/2 + 8])
                rotate([90, 0, 0])
                cylinder(h = 5.0, r = 3.0, center=true, $fn=32);

            translate([side * (width/2 + hole_offset_x), -latch_offset + latch_w/2 + 2.75, -lid_h/2 + 8])
                rotate([90, 0, 0])
                cylinder(h = 5.5, r = 1.35, center=true, $fn=32);
        }
        if (lid_style == 1) {
            for (x = [-width/2 + 15, width/2 - 15]) {
                for (y = [-depth/2 + 15, depth/2 - 15]) {
                    translate([x, y, lid_h/2 - dimple_depth + 0.01])
                        cylinder(h=dimple_depth, r1=dimple_r_inner, r2=dimple_r_outer);
                }
            }
        }
        if (lid_style == 2) {
            tray_d = 10;
            translate([0, -depth/4 - 2, lid_h/2]) hull() {
                cube([width - 20, depth/2 - 12, 0.1], center=true);
                translate([0, 0, -tray_d]) cube([width - 20 - (tray_d*2), depth/2 - 12 - (tray_d*2), 0.1], center=true);
            }
            bin_w = (width - 28) / 3;
            for (b = [-1, 0, 1]) {
                translate([b * (bin_w + 4), depth/4 + 2, lid_h/2]) hull() {
                    cube([bin_w, depth/2 - 12, 0.1], center=true);
                    translate([0, 0, -tray_d]) cube([bin_w - (tray_d*2), depth/2 - 12 - (tray_d*2), 0.1], center=true);
                }
            }
        }
        if (lid_style == 3) {
            pocket_d = 5.0;
            translate([0, 0, lid_h/2]) hull() {
                cube([130, 44, 0.1], center=true);
                translate([0, 0, -pocket_d]) cube([120, 34, 0.1], center=true);
            }
        }
    }
    if (lid_style == 3) {
        pocket_d = 5.0;
        for (side = [-1, 1]) {
            difference() {
                translate([side * 44, 0, lid_h/2 - pocket_d]) hull() {
                    cube([16, 32, 0.1], center=true);
                    translate([0, 0, 14]) cube([16, 18, 4], center=true);
                }
                translate([side * 44, 0, lid_h/2 + 6]) rotate([0, 90, 0]) cylinder(h = 24, r = 1.45, center=true);
            }
        }
    }
    for (x = [-width/2 + 15, width/2 - 15]) {
        for (y = [-depth/2 + 15, depth/2 - 15]) {
            translate([x, y, -lid_h/2 - (dimple_depth - 0.2)])
                cylinder(h=dimple_depth - 0.2 + 0.05, r1=dimple_r_inner - 0.2, r2=dimple_r_outer - 0.2);
        }
    }
}

module carry_handle() {
    difference() {
        hull() {
            for (side = [-1, 1]) {
                translate([side * 52, 26, 0]) cylinder(h = 14, r = 8, center=true);
                translate([side * 52, 0, 0]) cylinder(h = 14, r = 8, center=true);
            }
        }
        hull() {
            for (side = [-1, 1]) {
                translate([side * 38.5, 14, 0]) cylinder(h = 20, r = 4, center=true);
                translate([side * 38.5, -10, 0]) cylinder(h = 20, r = 4, center=true);
            }
        }
        for (side = [-1, 1]) {
            translate([side * 44, -2, 0]) cube([17, 22, 20], center=true);
            translate([side * 50, 0, 0]) rotate([0, 90, 0]) cylinder(h = 30, r = 1.65, center=true);
        }
        for (fg = [-27, -9, 9, 27]) {
            translate([fg, 10.5, 0]) cylinder(h = 20, r = 9.5, center=true);
        }
    }
}

// --- 4. CAM-LATCH MODULE ---
module bench_latch(lw = 17.2, p2h = 13.6) {
    difference() {
        union() {
            linear_extrude(height = lw, center = true) {
                union() {
                    hull() { circle(r = 3.4); translate([1.2, -5.0]) circle(r = 3.2); }
                    hull() { translate([1.2, -5.0]) circle(r = 3.2); translate([1.2, -p2h - 1.5]) circle(r = 3.0); }
                    polygon(points = [
                        [2.0, -p2h + 3.0], [-3.6, -p2h + 0.2], [-3.6, -p2h - 1.8],
                        [1.5, -p2h - 3.5], [4.2, -p2h + 1.0]
                    ]);
                    hull() { translate([1.2, -p2h - 1.5]) circle(r = 3.0); translate([3.6, -p2h - 4.5]) circle(r = 2.0); }
                }
            }
            // Tapered collar that tucks into the 45-deg ear to hide the screw
            translate([0, 0, lw / 2])
                cylinder(h = 1.4, r1 = 2.6, r2 = 2.0, $fn = 32);
        }
        cylinder(h = lw + 8, r = 1.8, center = true);
        translate([-2.2, -p2h + 2.2, 0]) rotate([0, 0, -38]) cube([4.5, 4.5, lw + 2], center = true);
        for (gy = [-5, -8.5, -12, -15.5]) {
            translate([4.6, gy, 0]) cylinder(h = lw + 2, r = 0.8, center = true);
        }
        // Deeper V-notch aligned directly with the flat-rib parking detent (X = +0.2, 12mm from pivot)
        for (side = [-1, 1]) {
                translate([1.2, -12.0, side * (lw / 2)])
                    rotate([45, 0, 0])
                    cube([2.4, 2.0, 2.0], center = true);
        }
    }
}

// --- 5. MASTER PRODUCTION LAYOUT ---
if (layout_mode == "print_plate") {
    // Column 1: Stacked Tier Shells (Printed on Back Wall for Zero Supports)
    if (tiers > 0) {
        for (t = [0 : tiers - 1]) {
            translate([0, t * (height + 24), depth/2])
                rotate([-90, 0, 0])
                color(shell_color) bench_shell();

            // Column 2: Individual Drawers for Each Bay in This Tier
            for (b = [0 : num_drawers - 1]) {
                d_idx = t * num_drawers + b;
                d_rows = drawer_grids[d_idx][0];
                d_cols = drawer_grids[d_idx][1];
                translate([width/2 + 35 + b * (drawer_w + 18) + drawer_w/2, t * (drawer_d + 24), 0])
                    color(drawer_color) drawer(d_rows, d_cols);
            }
        }
    }

    // Top Lid + Optional Carry Handle (Placed below Shells in Column 1)
    if (lid_style > 0) {
        translate([0, -height - 30, depth/2])
            rotate([-90, 0, 0])
            color(shell_color) bench_lid();

        if (lid_style == 3) {
            translate([0, -height - 95, 7])
                color(latch_color) carry_handle();
        }
    }

    // Column 3: All Required Cam-Latches Laid Flat on Their Side
    for (l = [0 : ${totalLatches} - 1]) {
        translate([-width/2 - 45, l * 32, 17.2 / 2])
            color(latch_color)
            if (l % 2 == 0) {
                bench_latch();
            } else {
                mirror([1, 0, 0]) bench_latch();
            }
    }

    // Column 4: All Custom Slide-In Embossed Labels (2-Color: Shell Base + Drawer Text)
    if (len(labels_list) > 0) {
        for (i = [0 : len(labels_list) - 1]) {
            translate([-width/2 - 120, i * 20, 0]) {
                color(shell_color)
                    translate([0, 0, 1.0])
                    cube([plate_w, 13.0, 2.0], center=true);
                color(drawer_color)
                    translate([0, 0, 2.0])
                    linear_extrude(height = 0.8)
                    text(labels_list[i], size = 6.5, font = "Liberation Sans:style=Bold", halign = "center", valign = "center");
            }
        }
    }
} else {
    // 3D Stacked Assembly Preview Mode inside OpenSCAD
    if (tiers > 0) {
        for (t = [0 : tiers - 1]) {
            translate([0, 0, t * height + height/2]) {
                color(shell_color) bench_shell();
                for (b = [0 : num_drawers - 1]) {
                    d_idx = t * num_drawers + b;
                    bay_cx = -width/2 + wall + (bay_w/2) + b * (bay_w + wall);
                    translate([bay_cx, 0, -drawer_h/2])
                        color(drawer_color) drawer(drawer_grids[d_idx][0], drawer_grids[d_idx][1]);
                }
            }
        }
    }
    if (lid_style > 0) {
        translate([0, 0, tiers * height + lid_h/2])
            color(shell_color) bench_lid();
    }
}
`;
}