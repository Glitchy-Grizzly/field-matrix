// ==========================================================
// THE ORBITAL MATRIX V2.2 - PRODUCTION OPENSCAD GENERATOR
// Preserves tested V2.2 cam-slot, C-clip, 4-petal snap cap,
// and 10x3mm silicone pad dimples; adds 180mm scaling,
// 3-zone PETG colors, internal tray dividers, and lid inlay.
// ==========================================================

export function generateOrbitalSCAD({
    boxSize = 180,          // 100 (Trace) | 180 (Trail / Pursuit / Frontier)
    binInnerDepth = 28.0,   // 28 (Trace/Trail) | 42 (Pursuit) | 56 (Frontier)
    trayDividers = 1,       // 1 (Open) | 2 (Split — 180mm tiers only)
    lidText = '',           // Optional flush multi-color top lid text
    lidFont = 'Impact',
    plateColorHex = '#222222',
    trayColorHex = '#2C4C3B',
    accentColorHex = '#F36B21',
    exportPart = 'print_plate', // 'print_plate' | 'assembly' | 'top_lid' | 'inlay_only' | 'bottom_base' | 'tray' | 'knob' | 'c_clip' | 'bottom_cap'
    designCode = 'ORBITAL-CUSTOM',
} = {}) {
    const knobD = boxSize >= 150 ? 34 : 26;
    const safeDividers = boxSize <= 100 ? 1 : (trayDividers >= 2 ? 2 : 1);
    const tierName =
        boxSize <= 100 ? 'Trace' : binInnerDepth >= 56 ? 'Frontier' : binInnerDepth >= 42 ? 'Pursuit' : 'Trail';
    const cleanText = String(lidText || '').trim().replace(/"/g, '\\"');

    return `/* ============================================================
   ORBITAL MATRIX V2.2 - Parametric Field Matrix Edition
   Design Code : ${designCode}
   Size Tier   : ${tierName} (${boxSize} x ${boxSize} mm | Bin Depth: ${binInnerDepth} mm)
   Dividers    : ${safeDividers === 1 ? 'Open (1-Bin)' : 'Split (2-Bin)'}
   Export Mode : ${exportPart.toUpperCase()}
   ============================================================ */

/* [Export & Preview] */
part = "${exportPart}"; // ["assembly", "print_plate", "top_lid", "inlay_only", "bottom_base", "tray", "knob", "c_clip", "bottom_cap"]
open_angle = 0; // [0:1:17]
explode = 0; // [0:1:25]

/* [Core Dimensions (mm)] */
box_size = ${boxSize};
bin_inner_depth = ${Number(binInnerDepth).toFixed(1)};
tray_dividers = ${safeDividers}; // [1:Open (1-Bin), 2:Split (2-Bin)]
plate_thick_top = 6.0;
plate_thick_bot = 8.0;
corner_chamfer = 5.0;
tray_wall = 2.6;

/* [Colors & Optional Lid Inlay] */
plate_color  = "${plateColorHex}";
tray_color   = "${trayColorHex}";
accent_color = "${accentColorHex}";
lid_text     = "${cleanText}";
lid_font     = "${lidFont}:style=Bold";

/* [Silicone Pad Dimples (Bottom Base)] */
use_silicone_pads = true;
pad_d = 10.4;
pad_depth = 1.0;
pad_inset = 12.0;

/* [Mechanism & Tolerances (mm) - V2.2 Tested] */
tol = 0.25;
z_clear = 0.35;
shaft_d = 18.0;
pin_d = 5.5;
top_pin_h = 4.5;
base_pin_h = 3.5;
slot_ceiling = 2.0;
clip_thick = 1.5;
clip_od = 17.5;
clip_groove_d = 11.0;
shaft_stub_d = 14.0;

/* [Knob Styling] */
knob_d = ${knobD};
knob_h = 12;
knob_flutes = 8;
hex_stem_flat = 9.0;

/* [Resolution] */
$fn = 64;

// --- Auto-Calculated Dimensions ---
half = box_size / 2;
tray_gap = 0.4;
tray_xy = half - tray_gap / 2;

slot_depth  = base_pin_h + 0.8;
tray_floor  = slot_depth + slot_ceiling;
tray_height = bin_inner_depth + tray_floor;

pin_margin = 7.0;
piv_x = pin_margin;
piv_y = half - pin_margin;
base_pin_x = half - pin_margin;
base_pin_y = half - pin_margin;

slot_len = (half - 2 * pin_margin) - 2.0;

z_tray_bot = plate_thick_bot + z_clear;
z_lid_bot  = z_tray_bot + tray_height + z_clear;
shaft_main_len = tray_height + 2 * z_clear;

cap_recess_d = 22.0;
cap_recess_h = 3.2;
z_clip_top = cap_recess_h + (cap_recess_d - clip_od) / 2;

// ============================================================
// MAIN DISPATCHER
// ============================================================
if (part == "assembly") {
    show_assembly();
} else if (part == "print_plate") {
    show_print_plate();
} else if (part == "top_lid") {
    rotate([180, 0, 0]) translate([0, 0, -plate_thick_top]) {
        color(plate_color) top_lid();
        if (lid_text != "") color(accent_color) lid_inlay_3d();
    }
} else if (part == "inlay_only") {
    rotate([180, 0, 0]) translate([0, 0, -plate_thick_top])
        color(accent_color) lid_inlay_3d();
} else if (part == "bottom_base") {
    color(plate_color) bottom_base();
} else if (part == "tray") {
    color(tray_color) single_tray();
} else if (part == "knob") {
    rotate([180, 0, 0]) translate([0, 0, -knob_h]) color(accent_color) knurled_knob();
} else if (part == "c_clip") {
    color(accent_color) c_clip();
} else if (part == "bottom_cap") {
    color(plate_color) bottom_cap();
}

// ============================================================
// HELPER SHAPES
// ============================================================
module chamfered_square(w, h, c) {
    polygon([
        [c, 0], [w - c, 0],
        [w, c], [w, h - c],
        [w - c, h], [c, h],
        [0, h - c], [0, c]
    ]);
}

module matrix_plate(size, thick, c, bevel = 1.2) {
    hull() {
        translate([-size/2 + bevel, -size/2 + bevel, 0])
            linear_extrude(0.01) chamfered_square(size - 2*bevel, size - 2*bevel, max(1, c - bevel));
        translate([-size/2, -size/2, bevel])
            linear_extrude(thick - 2*bevel) chamfered_square(size, size, c);
        translate([-size/2 + bevel, -size/2 + bevel, thick - 0.01])
            linear_extrude(0.01) chamfered_square(size - 2*bevel, size - 2*bevel, max(1, c - bevel));
    }
}

module lid_inlay_2d() {
    if (lid_text != "") {
        txt_y = -(knob_d / 2 + (half - knob_d / 2) * 0.48);
        max_w = box_size - 32;
        char_cnt = max(4, len(lid_text));
        t_sz = min(box_size * 0.075, (max_w / char_cnt) * 1.3);
        translate([0, txt_y, 0])
            text(lid_text, size = t_sz, font = lid_font, halign = "center", valign = "center");
    }
}

module lid_inlay_3d() {
    if (lid_text != "") {
        translate([0, 0, plate_thick_top - 0.8])
            linear_extrude(0.8)
            lid_inlay_2d();
    }
}

// ============================================================
// 1. BOTTOM BASE
// ============================================================
module bottom_base() {
    difference() {
        union() {
            matrix_plate(box_size, plate_thick_bot, corner_chamfer);
            for (a = [0, 90, 180, 270]) {
                rotate([0, 0, a])
                translate([base_pin_x, base_pin_y, plate_thick_bot - 0.5]) {
                    cylinder(d = pin_d, h = base_pin_h);
                    translate([0, 0, base_pin_h])
                        cylinder(d1 = pin_d, d2 = pin_d - 1.0, h = 0.5);
                }
            }
        }
        translate([0, 0, -1])
            cylinder(d = shaft_stub_d + 2*tol, h = plate_thick_bot + 2);
        translate([0, 0, -0.01])
            cylinder(d = cap_recess_d, h = cap_recess_h + 0.02);
        translate([cap_recess_d / 2 - 1.0, -2.5, -0.01])
            cube([3.5, 5.0, 1.8]);
        translate([0, 0, cap_recess_h - 0.01])
            cylinder(d1 = cap_recess_d, d2 = shaft_stub_d + 2*tol,
                     h = (cap_recess_d - (shaft_stub_d + 2*tol)) / 2);
        if (use_silicone_pads) {
            for (a = [0, 90, 180, 270]) {
                rotate([0, 0, a])
                translate([half - pad_inset, half - pad_inset, -0.01])
                    cylinder(d = pad_d, h = pad_depth + 0.02);
            }
        }
    }
}

// ============================================================
// 2. TOP LID
// ============================================================
module top_lid() {
    stub_len = plate_thick_bot - (cap_recess_h + 0.3);

    difference() {
        union() {
            matrix_plate(box_size, plate_thick_top, corner_chamfer);
            for (a = [0, 90, 180, 270]) {
                rotate([0, 0, a])
                translate([piv_x, piv_y, -top_pin_h]) {
                    translate([0, 0, 0.5])
                        cylinder(d = pin_d, h = top_pin_h);
                    cylinder(d1 = pin_d - 1.0, d2 = pin_d, h = 0.5);
                }
            }
            translate([0, 0, -shaft_main_len])
                cylinder(d = shaft_d, h = shaft_main_len + 0.5);
            translate([0, 0, -(shaft_main_len + stub_len)])
                cylinder(d = shaft_stub_d, h = stub_len + 0.5);
        }

        groove_from_base_top = plate_thick_bot - z_clip_top;
        groove_z = -(shaft_main_len + groove_from_base_top + clip_thick + 0.25);
        translate([0, 0, groove_z])
        difference() {
            cylinder(d = shaft_stub_d + 2, h = clip_thick + 0.3);
            translate([0, 0, -0.5])
                cylinder(d = clip_groove_d, h = clip_thick + 1.3);
        }

        hex_r = ((hex_stem_flat + tol) / 2) / cos(30);
        translate([0, 0, -12])
            cylinder(r = hex_r, h = plate_thick_top + 14, $fn = 6);

        groove_w = box_size - 14;
        translate([0, 0, plate_thick_top - 0.6])
        linear_extrude(0.8)
        difference() {
            translate([-groove_w/2, -groove_w/2])
                chamfered_square(groove_w, groove_w, corner_chamfer);
            translate([-(groove_w - 3.2)/2, -(groove_w - 3.2)/2])
                chamfered_square(groove_w - 3.2, groove_w - 3.2, max(1, corner_chamfer - 1));
        }

        for (a = [0:45:315]) {
            rotate([0, 0, a])
            translate([knob_d/2 + 4, -0.8, plate_thick_top - 0.6])
                cube([6, 1.6, 0.8]);
        }

        if (lid_text != "") {
            translate([0, 0, plate_thick_top - 0.8])
                linear_extrude(1.0)
                lid_inlay_2d();
        }
    }
}

// ============================================================
// 3. SINGLE TRAY (With Optional 2-Bin Split Fused Divider)
// ============================================================
module tray_cavity_2d() {
    c_cut = shaft_d / 2 + 1.2;
    offset_xy = tray_gap / 2;
    translate([offset_xy + tray_wall, offset_xy + tray_wall])
    difference() {
        chamfered_square(tray_xy - 2*tray_wall, tray_xy - 2*tray_wall, max(1, corner_chamfer - 1.5));
        translate([-tray_wall, -tray_wall])
            circle(r = c_cut + tray_wall);
        translate([piv_x - offset_xy - tray_wall, piv_y - offset_xy - tray_wall])
            circle(r = pin_d/2 + tray_wall + 0.4);
    }
}

module single_tray() {
    c_cut = shaft_d / 2 + 1.2;
    offset_xy = tray_gap / 2;

    union() {
        difference() {
            translate([offset_xy, offset_xy, 0])
            linear_extrude(tray_height)
                chamfered_square(tray_xy, tray_xy, corner_chamfer);

            translate([0, 0, tray_floor])
                linear_extrude(bin_inner_depth + 1)
                tray_cavity_2d();

            translate([0, 0, -1])
                cylinder(r = c_cut, h = tray_height + 2);

            translate([piv_x, piv_y, tray_height - (top_pin_h + 1.0)])
                cylinder(d = pin_d + 2*tol, h = top_pin_h + 2.0);

            slot_w = pin_d + 2*tol;
            translate([0, 0, -0.01])
            linear_extrude(slot_depth)
            hull() {
                translate([base_pin_x, base_pin_y]) circle(d = slot_w);
                translate([base_pin_x, base_pin_y - slot_len]) circle(d = slot_w);
            }

            rib_count = box_size >= 150 ? 6 : 4;
            for (i = [0 : rib_count - 1]) {
                pos = 14 + i * ((tray_xy - 26) / max(1, rib_count - 1));
                translate([half - 0.7, pos, 5])
                    cube([1.0, 1.6, tray_height - 10]);
                translate([pos, half - 0.7, 5])
                    cube([1.6, 1.0, tray_height - 10]);
            }
        }

        // Optional Internal Fused Divider (Split 2-Bin, embedded 0.4mm into walls & 0.5mm into floor for clean CGAL manifoldness)
        if (tray_dividers >= 2) {
            div_t = 1.6;
            div_h = bin_inner_depth - 1.5;
            mid_xy = offset_xy + tray_xy / 2;
            translate([0, 0, tray_floor - 0.5])
            linear_extrude(div_h + 0.5)
            intersection() {
                offset(r = 0.4) tray_cavity_2d();
                translate([0, mid_xy - div_t/2])
                    square([half, div_t]);
            }
        }
    }
}
// ============================================================
// 4. SIGNATURE KNURLED KNOB
// ============================================================
module knurled_knob() {
    stem_len = plate_thick_top + 8;
    hex_r = (hex_stem_flat / 2) / cos(30);

    union() {
        difference() {
            union() {
                cylinder(d = knob_d, h = knob_h - 1.5);
                translate([0, 0, knob_h - 1.5])
                    cylinder(d1 = knob_d, d2 = knob_d - 3.0, h = 1.5);
            }
            for (i = [0 : knob_flutes - 1]) {
                rotate([0, 0, i * (360 / knob_flutes)])
                translate([knob_d / 2 + 1.0, 0, -1])
                    cylinder(d = 5.5, h = knob_h + 2);
            }
            translate([0, 0, knob_h - 0.8])
                cylinder(d1 = knob_d * 0.45, d2 = knob_d * 0.52, h = 1.0);
        }
        translate([0, 0, -stem_len])
            cylinder(r = hex_r, h = stem_len + 0.5, $fn = 6);
    }
}

// ============================================================
// 5. RETAINING C-CLIP
// ============================================================
module c_clip() {
    id = clip_groove_d + 0.2;
    opening = id * 0.78;

    linear_extrude(clip_thick)
    difference() {
        circle(d = clip_od);
        circle(d = id);
        translate([0, -opening/2])
            square([clip_od, opening]);
    }
}

// ============================================================
// 6. DEAD-FLUSH SNAP-IN BOTTOM CAP
// ============================================================
module bottom_cap() {
    face_d = cap_recess_d - 0.35;
    face_h = 1.4;
    ring_h = cap_recess_h - face_h;

    union() {
        cylinder(d1 = face_d - 0.6, d2 = face_d, h = 0.3);
        translate([0, 0, 0.3])
            cylinder(d = face_d, h = face_h - 0.3);

        translate([0, 0, face_h])
        difference() {
            union() {
                cylinder(d = cap_recess_d - 0.15, h = ring_h - 0.5);
                translate([0, 0, ring_h - 0.7])
                    cylinder(d1 = cap_recess_d - 0.15, d2 = cap_recess_d + 0.15, h = 0.25);
                translate([0, 0, ring_h - 0.45])
                    cylinder(d1 = cap_recess_d + 0.15, d2 = cap_recess_d - 0.75, h = 0.45);
            }
            translate([0, 0, -0.5])
                cylinder(d = cap_recess_d - 3.4, h = ring_h + 1.0);
            for (a = [0, 90]) {
                rotate([0, 0, a])
                translate([-cap_recess_d, -1.0, -0.5])
                    cube([cap_recess_d * 2, 2.0, ring_h + 1.0]);
            }
        }
    }
}

// ============================================================
// KINEMATIC ASSEMBLY PREVIEW
// ============================================================
module show_assembly() {
    color(plate_color) bottom_base();

    L0 = base_pin_x - piv_x;
    px_rot = piv_x * cos(open_angle) - piv_y * sin(open_angle);
    py_rot = piv_x * sin(open_angle) + piv_y * cos(open_angle);
    vx = base_pin_x - px_rot;
    vy = base_pin_y - py_rot;
    dist = sqrt(vx*vx + vy*vy);
    phi = atan2(vy, vx);
    dy_slot = -sqrt(max(0, dist*dist - L0*L0));
    alpha = atan2(dy_slot, L0);
    tray_rot = phi - alpha;

    for (a = [0, 90, 180, 270]) {
        color(tray_color)
        rotate([0, 0, a])
        translate([px_rot, py_rot, z_tray_bot + explode])
        rotate([0, 0, tray_rot])
        translate([-piv_x, -piv_y, 0])
            single_tray();
    }

    translate([0, 0, z_lid_bot + explode * 2])
    rotate([0, 0, open_angle]) {
        color(plate_color) top_lid();
        if (lid_text != "") color(accent_color) lid_inlay_3d();
    }

    color(accent_color)
    translate([0, 0, z_lid_bot + plate_thick_top + explode * 3])
    rotate([0, 0, open_angle])
        knurled_knob();

    color(accent_color)
    translate([0, 0, (z_clip_top - clip_thick) - explode])
        c_clip();

    color(plate_color)
    translate([0, 0, -explode * 1.8])
        bottom_cap();
}

// ============================================================
// PRINT PLATE LAYOUT (All parts oriented flat for 0 supports)
// ============================================================
module show_print_plate() {
    color(plate_color) translate([0, 0, 0]) bottom_base();

    translate([box_size + 12, 0, 0])
        rotate([180, 0, 0]) translate([0, 0, -plate_thick_top]) {
            color(plate_color) top_lid();
            if (lid_text != "") color(accent_color) lid_inlay_3d();
        }

    for (i = [0:3]) {
        color(tray_color)
        translate([i * (tray_xy + 8) - half, -(box_size + 10), 0])
            single_tray();
    }

    color(accent_color)
    translate([-half + 20, half + 24, 0])
        rotate([180, 0, 0]) translate([0, 0, -knob_h]) knurled_knob();

    color(accent_color)
    translate([-half + 60, half + 24, 0]) c_clip();

    color(plate_color)
    translate([-half + 95, half + 24, 0]) bottom_cap();
}
`;
}