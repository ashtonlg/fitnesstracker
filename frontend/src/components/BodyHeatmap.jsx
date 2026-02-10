import React, { useMemo, useState } from "react";
import { COLORS } from "../theme.js";

// Body part to sub-parts mapping based on seed.py
export const BODY_PARTS_MAP = {
    legs: {
        label: "Legs",
        // Front: quads, calves, tibialis anterior
        // Back: hamstrings, glutes, calves
        subParts: {
            quads: { label: "Quads", front: true, back: false },
            hamstrings: { label: "Hamstrings", front: false, back: true },
            glutes: { label: "Glutes", front: false, back: true },
            calves: { label: "Calves", front: true, back: true },
            "tibialis anterior": { label: "Tibialis", front: true, back: false },
            abductors: { label: "Abductors", front: false, back: true },
            adductors: { label: "Adductors", front: true, back: false },
            compound: { label: "Compound", front: true, back: true },
        },
    },
    back: {
        label: "Back",
        // Back: lats, upper back, lower back
        subParts: {
            "lower back": { label: "Lower Back", front: false, back: true },
            compound: { label: "Compound", front: false, back: true }, // lats/upper back
        },
    },
    chest: {
        label: "Chest",
        // Front: pecs
        subParts: {
            pecs: { label: "Pecs", front: true, back: false },
            compound: { label: "Compound", front: true, back: false },
        },
    },
    shoulders: {
        label: "Shoulders",
        // Front: lateral delts (side), front delts (implicit in compound)
        // Back: rear delts, traps
        subParts: {
            "lateral delts": { label: "Side Delts", front: true, back: false },
            "rear delts": { label: "Rear Delts", front: false, back: true },
            traps: { label: "Traps", front: false, back: true },
            compound: { label: "Compound", front: true, back: true },
        },
    },
    arms: {
        label: "Arms",
        // Front: biceps
        // Back: triceps
        subParts: {
            biceps: { label: "Biceps", front: true, back: false },
            triceps: { label: "Triceps", front: false, back: true },
            forearms: { label: "Forearms", front: true, back: true },
        },
    },
    core: {
        label: "Core",
        // Front: abs, obliques
        subParts: {
            abs: { label: "Abs", front: true, back: false },
            obliques: { label: "Obliques", front: true, back: false },
        },
    },
};

// Heat level colors - from light (low activity) to intense (high activity)
const HEAT_COLORS = {
    0: "#e8e4dc", // empty/no activity - warm gray
    1: "#d4e6b5", // light green
    2: "#a8d18e", // medium green
    3: "#f5d47a", // yellow
    4: "#f5a623", // orange
    5: "#e85d5d", // red (high activity)
};

function getHeatColor(level) {
    const clamped = Math.max(0, Math.min(5, Math.floor(level)));
    return HEAT_COLORS[clamped];
}

// SVG Body Front View Component
function BodyFrontSVG({ heatData, onPartClick, hoveredPart, setHoveredPart }) {
    const getFill = (partId, defaultColor = "#e8e4dc") => {
        if (heatData[partId] !== undefined) {
            return getHeatColor(heatData[partId]);
        }
        return defaultColor;
    };

    const isHovered = (partId) => hoveredPart === partId;

    const pathStyle = (partId) => ({
        fill: getFill(partId),
        stroke: isHovered(partId) ? COLORS.mustard : "#b8b4ac",
        strokeWidth: isHovered(partId) ? 2.5 : 1.5,
        cursor: onPartClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        filter: isHovered(partId) ? "brightness(1.05)" : "none",
    });

    return (
        <svg viewBox="0 0 200 380" style={{ width: "100%", height: "auto", maxHeight: 400 }}>
            {/* Head */}
            <ellipse cx="100" cy="30" rx="22" ry="26" style={{ fill: "#e8e4dc", stroke: "#b8b4ac", strokeWidth: 1.5 }} />

            {/* Neck */}
            <rect x="90" y="52" width="20" height="15" style={{ fill: "#e8e4dc", stroke: "#b8b4ac", strokeWidth: 1.5 }} />

            {/* Trapezius (front view - upper traps visible) */}
            <path
                d="M 70 67 Q 100 75 130 67 L 135 85 Q 100 95 65 85 Z"
                style={pathStyle("traps-front")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("traps-front")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("shoulders", "traps")}
            />

            {/* Shoulders - Front Delts / Compound area */}
            <ellipse
                cx="50" cy="90" rx="18" ry="14"
                style={pathStyle("shoulders-left")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("shoulders-left")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("shoulders", "compound")}
            />
            <ellipse
                cx="150" cy="90" rx="18" ry="14"
                style={pathStyle("shoulders-right")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("shoulders-right")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("shoulders", "compound")}
            />

            {/* Lateral Delts (visible from front on sides) */}
            <ellipse
                cx="35" cy="95" rx="8" ry="12"
                style={pathStyle("lateral-delts-left")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("lateral-delts-left")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("shoulders", "lateral delts")}
            />
            <ellipse
                cx="165" cy="95" rx="8" ry="12"
                style={pathStyle("lateral-delts-right")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("lateral-delts-right")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("shoulders", "lateral delts")}
            />

            {/* Upper Chest / Pecs */}
            <path
                d="M 65 85 Q 100 100 135 85 L 135 130 Q 100 145 65 130 Z"
                style={pathStyle("chest-upper")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("chest-upper")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("chest", "pecs")}
            />

            {/* Lower Chest */}
            <path
                d="M 65 130 Q 100 145 135 130 L 130 155 Q 100 170 70 155 Z"
                style={pathStyle("chest-lower")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("chest-lower")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("chest", "compound")}
            />

            {/* Abs */}
            <rect
                x="85" y="155" width="30" height="55" rx="3"
                style={pathStyle("abs")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("abs")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("core", "abs")}
            />
            {/* Abs definition lines */}
            <line x1="85" y1="172" x2="115" y2="172" stroke="#c8c4bc" strokeWidth="1" />
            <line x1="85" y1="189" x2="115" y2="189" stroke="#c8c4bc" strokeWidth="1" />
            <line x1="100" y1="155" x2="100" y2="210" stroke="#c8c4bc" strokeWidth="1" />

            {/* Obliques */}
            <path
                d="M 70 155 L 85 155 L 85 210 L 70 200 Z"
                style={pathStyle("obliques-left")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("obliques-left")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("core", "obliques")}
            />
            <path
                d="M 130 155 L 115 155 L 115 210 L 130 200 Z"
                style={pathStyle("obliques-right")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("obliques-right")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("core", "obliques")}
            />

            {/* Biceps */}
            <ellipse
                cx="35" cy="125" rx="12" ry="22"
                style={pathStyle("biceps-left")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("biceps-left")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("arms", "biceps")}
            />
            <ellipse
                cx="165" cy="125" rx="12" ry="22"
                style={pathStyle("biceps-right")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("biceps-right")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("arms", "biceps")}
            />

            {/* Forearms */}
            <ellipse
                cx="30" cy="165" rx="10" ry="20"
                style={pathStyle("forearms-left")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("forearms-left")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("arms", "forearms")}
            />
            <ellipse
                cx="170" cy="165" rx="10" ry="20"
                style={pathStyle("forearms-right")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("forearms-right")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("arms", "forearms")}
            />

            {/* Hands */}
            <ellipse cx="25" cy="195" rx="12" ry="15" style={{ fill: "#e8e4dc", stroke: "#b8b4ac", strokeWidth: 1.5 }} />
            <ellipse cx="175" cy="195" rx="12" ry="15" style={{ fill: "#e8e4dc", stroke: "#b8b4ac", strokeWidth: 1.5 }} />

            {/* Quads */}
            <path
                d="M 70 210 Q 60 240 65 290 L 85 295 Q 90 250 88 210 Z"
                style={pathStyle("quads-left")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("quads-left")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("legs", "quads")}
            />
            <path
                d="M 130 210 Q 140 240 135 290 L 115 295 Q 110 250 112 210 Z"
                style={pathStyle("quads-right")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("quads-right")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("legs", "quads")}
            />

            {/* Adductors (inner thigh) */}
            <path
                d="M 88 210 L 95 295 L 105 295 L 112 210 Z"
                style={pathStyle("adductors")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("adductors")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("legs", "adductors")}
            />

            {/* Knees */}
            <ellipse cx="72" cy="300" rx="14" ry="12" style={{ fill: "#e8e4dc", stroke: "#b8b4ac", strokeWidth: 1.5 }} />
            <ellipse cx="128" cy="300" rx="14" ry="12" style={{ fill: "#e8e4dc", stroke: "#b8b4ac", strokeWidth: 1.5 }} />

            {/* Tibialis Anterior (shins) */}
            <path
                d="M 62 312 L 82 312 L 80 340 L 64 340 Z"
                style={pathStyle("tibialis-left")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("tibialis-left")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("legs", "tibialis anterior")}
            />
            <path
                d="M 138 312 L 118 312 L 120 340 L 136 340 Z"
                style={pathStyle("tibialis-right")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("tibialis-right")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("legs", "tibialis anterior")}
            />

            {/* Calves (front view - outer portion) */}
            <ellipse
                cx="55" cy="330" rx="10" ry="18"
                style={pathStyle("calves-left")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("calves-left")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("legs", "calves")}
            />
            <ellipse
                cx="145" cy="330" rx="10" ry="18"
                style={pathStyle("calves-right")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("calves-right")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("legs", "calves")}
            />

            {/* Feet */}
            <ellipse cx="60" cy="360" rx="20" ry="12" style={{ fill: "#e8e4dc", stroke: "#b8b4ac", strokeWidth: 1.5 }} />
            <ellipse cx="140" cy="360" rx="20" ry="12" style={{ fill: "#e8e4dc", stroke: "#b8b4ac", strokeWidth: 1.5 }} />
        </svg>
    );
}

// SVG Body Back View Component
function BodyBackSVG({ heatData, onPartClick, hoveredPart, setHoveredPart }) {
    const getFill = (partId, defaultColor = "#e8e4dc") => {
        if (heatData[partId] !== undefined) {
            return getHeatColor(heatData[partId]);
        }
        return defaultColor;
    };

    const isHovered = (partId) => hoveredPart === partId;

    const pathStyle = (partId) => ({
        fill: getFill(partId),
        stroke: isHovered(partId) ? COLORS.mustard : "#b8b4ac",
        strokeWidth: isHovered(partId) ? 2.5 : 1.5,
        cursor: onPartClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        filter: isHovered(partId) ? "brightness(1.05)" : "none",
    });

    return (
        <svg viewBox="0 0 200 380" style={{ width: "100%", height: "auto", maxHeight: 400 }}>
            {/* Head */}
            <ellipse cx="100" cy="30" rx="22" ry="26" style={{ fill: "#e8e4dc", stroke: "#b8b4ac", strokeWidth: 1.5 }} />

            {/* Neck */}
            <rect x="90" y="52" width="20" height="15" style={{ fill: "#e8e4dc", stroke: "#b8b4ac", strokeWidth: 1.5 }} />

            {/* Traps */}
            <path
                d="M 55 67 L 85 72 L 90 95 L 60 90 Z"
                style={pathStyle("traps-left")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("traps-left")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("shoulders", "traps")}
            />
            <path
                d="M 145 67 L 115 72 L 110 95 L 140 90 Z"
                style={pathStyle("traps-right")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("traps-right")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("shoulders", "traps")}
            />

            {/* Upper Back / Lats area */}
            <path
                d="M 60 90 Q 100 85 140 90 L 145 140 Q 100 150 55 140 Z"
                style={pathStyle("back-upper")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("back-upper")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("back", "compound")}
            />

            {/* Lats (side of back) */}
            <path
                d="M 55 140 L 70 140 L 75 200 L 55 190 Z"
                style={pathStyle("lats-left")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("lats-left")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("back", "compound")}
            />
            <path
                d="M 145 140 L 130 140 L 125 200 L 145 190 Z"
                style={pathStyle("lats-right")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("lats-right")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("back", "compound")}
            />

            {/* Lower Back */}
            <path
                d="M 75 200 L 125 200 L 120 240 L 80 240 Z"
                style={pathStyle("lower-back")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("lower-back")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("back", "lower back")}
            />

            {/* Rear Delts */}
            <ellipse
                cx="45" cy="95" rx="12" ry="14"
                style={pathStyle("rear-delts-left")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("rear-delts-left")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("shoulders", "rear delts")}
            />
            <ellipse
                cx="155" cy="95" rx="12" ry="14"
                style={pathStyle("rear-delts-right")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("rear-delts-right")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("shoulders", "rear delts")}
            />

            {/* Triceps */}
            <ellipse
                cx="30" cy="130" rx="12" ry="22"
                style={pathStyle("triceps-left")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("triceps-left")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("arms", "triceps")}
            />
            <ellipse
                cx="170" cy="130" rx="12" ry="22"
                style={pathStyle("triceps-right")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("triceps-right")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("arms", "triceps")}
            />

            {/* Forearms */}
            <ellipse
                cx="25" cy="170" rx="10" ry="20"
                style={pathStyle("forearms-left")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("forearms-left")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("arms", "forearms")}
            />
            <ellipse
                cx="175" cy="170" rx="10" ry="20"
                style={pathStyle("forearms-right")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("forearms-right")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("arms", "forearms")}
            />

            {/* Hands */}
            <ellipse cx="20" cy="200" rx="12" ry="15" style={{ fill: "#e8e4dc", stroke: "#b8b4ac", strokeWidth: 1.5 }} />
            <ellipse cx="180" cy="200" rx="12" ry="15" style={{ fill: "#e8e4dc", stroke: "#b8b4ac", strokeWidth: 1.5 }} />

            {/* Glutes */}
            <ellipse
                cx="85" cy="255" rx="22" ry="20"
                style={pathStyle("glutes-left")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("glutes-left")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("legs", "glutes")}
            />
            <ellipse
                cx="115" cy="255" rx="22" ry="20"
                style={pathStyle("glutes-right")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("glutes-right")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("legs", "glutes")}
            />

            {/* Hamstrings */}
            <path
                d="M 63 275 L 85 275 L 88 330 L 65 325 Z"
                style={pathStyle("hamstrings-left")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("hamstrings-left")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("legs", "hamstrings")}
            />
            <path
                d="M 137 275 L 115 275 L 112 330 L 135 325 Z"
                style={pathStyle("hamstrings-right")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("hamstrings-right")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("legs", "hamstrings")}
            />

            {/* Abductors (outer thigh - back view) */}
            <path
                d="M 63 240 L 70 240 L 68 275 L 60 270 Z"
                style={pathStyle("abductors-left")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("abductors-left")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("legs", "abductors")}
            />
            <path
                d="M 137 240 L 130 240 L 132 275 L 140 270 Z"
                style={pathStyle("abductors-right")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("abductors-right")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("legs", "abductors")}
            />

            {/* Knees */}
            <ellipse cx="72" cy="335" rx="14" ry="12" style={{ fill: "#e8e4dc", stroke: "#b8b4ac", strokeWidth: 1.5 }} />
            <ellipse cx="128" cy="335" rx="14" ry="12" style={{ fill: "#e8e4dc", stroke: "#b8b4ac", strokeWidth: 1.5 }} />

            {/* Calves */}
            <ellipse
                cx="55" cy="355" rx="12" ry="18"
                style={pathStyle("calves-left-back")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("calves-left-back")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("legs", "calves")}
            />
            <ellipse
                cx="145" cy="355" rx="12" ry="18"
                style={pathStyle("calves-right-back")}
                onMouseEnter={() => setHoveredPart && setHoveredPart("calves-right-back")}
                onMouseLeave={() => setHoveredPart && setHoveredPart(null)}
                onClick={() => onPartClick && onPartClick("legs", "calves")}
            />

            {/* Feet */}
            <ellipse cx="55" cy="375" rx="20" ry="12" style={{ fill: "#e8e4dc", stroke: "#b8b4ac", strokeWidth: 1.5 }} />
            <ellipse cx="145" cy="375" rx="20" ry="12" style={{ fill: "#e8e4dc", stroke: "#b8b4ac", strokeWidth: 1.5 }} />
        </svg>
    );
}

// Calculate heat data from workout entries
export function calculateHeatData(entries, exercises, timeRange = 30) {
    const heatMap = {};
    const now = new Date();
    const cutoff = new Date(now - timeRange * 24 * 60 * 60 * 1000);

    // Initialize all parts to 0
    const allParts = [
        // Front view parts
        "traps-front",
        "shoulders-left", "shoulders-right",
        "lateral-delts-left", "lateral-delts-right",
        "chest-upper", "chest-lower",
        "abs",
        "obliques-left", "obliques-right",
        "biceps-left", "biceps-right",
        "forearms-left", "forearms-right",
        "quads-left", "quads-right",
        "adductors",
        "tibialis-left", "tibialis-right",
        "calves-left", "calves-right",
        // Back view parts
        "traps-left", "traps-right",
        "back-upper",
        "lats-left", "lats-right",
        "lower-back",
        "rear-delts-left", "rear-delts-right",
        "triceps-left", "triceps-right",
        "glutes-left", "glutes-right",
        "hamstrings-left", "hamstrings-right",
        "abductors-left", "abductors-right",
        "calves-left-back", "calves-right-back",
    ];
    allParts.forEach(part => heatMap[part] = 0);

    // Group entries by exercise
    const exerciseEntries = {};
    entries.forEach(entry => {
        if (!exerciseEntries[entry.exercise_id]) {
            exerciseEntries[entry.exercise_id] = [];
        }
        exerciseEntries[entry.exercise_id].push(entry);
    });

    // Calculate heat for each exercise
    Object.entries(exerciseEntries).forEach(([exId, exEntries]) => {
        const exercise = exercises.find(e => String(e.id) === String(exId));
        if (!exercise) return;

        // Filter to recent entries
        const recentEntries = exEntries.filter(e => new Date(e.date || e.created_at) >= cutoff);

        // Calculate intensity based on volume (sets * reps * weight factor)
        let totalVolume = 0;
        recentEntries.forEach(entry => {
            const weight = entry.total_kg || entry.weight_kg || 0;
            const reps = entry.reps || 0;
            totalVolume += weight * reps;
        });

        // Normalize volume to heat level (0-5)
        // Base heat on number of sets in the time period
        const setCount = recentEntries.length;
        let heatLevel = 0;
        if (setCount === 0) heatLevel = 0;
        else if (setCount <= 2) heatLevel = 1;
        else if (setCount <= 4) heatLevel = 2;
        else if (setCount <= 6) heatLevel = 3;
        else if (setCount <= 10) heatLevel = 4;
        else heatLevel = 5;

        // Map to body parts
        const bodyPart = exercise.body_part?.toLowerCase();
        const subPart = exercise.sub_part?.toLowerCase();

        // Apply heat to relevant body parts
        applyHeatToParts(heatMap, bodyPart, subPart, heatLevel);
    });

    return heatMap;
}

function applyHeatToParts(heatMap, bodyPart, subPart, heatLevel) {
    const applyHeat = (parts) => {
        parts.forEach(part => {
            heatMap[part] = Math.max(heatMap[part] || 0, heatLevel);
        });
    };

    // Mapping logic based on body_part and sub_part
    switch (bodyPart) {
        case "legs":
            switch (subPart) {
                case "quads":
                    applyHeat(["quads-left", "quads-right"]);
                    break;
                case "hamstrings":
                    applyHeat(["hamstrings-left", "hamstrings-right"]);
                    break;
                case "glutes":
                    applyHeat(["glutes-left", "glutes-right"]);
                    break;
                case "calves":
                    applyHeat(["calves-left", "calves-right", "calves-left-back", "calves-right-back"]);
                    break;
                case "tibialis anterior":
                    applyHeat(["tibialis-left", "tibialis-right"]);
                    break;
                case "abductors":
                    applyHeat(["abductors-left", "abductors-right"]);
                    break;
                case "adductors":
                    applyHeat(["adductors"]);
                    break;
                case "compound":
                    applyHeat(["quads-left", "quads-right", "hamstrings-left", "hamstrings-right",
                               "glutes-left", "glutes-right"]);
                    break;
            }
            break;
        case "back":
            switch (subPart) {
                case "lower back":
                    applyHeat(["lower-back"]);
                    break;
                case "compound":
                    applyHeat(["back-upper", "lats-left", "lats-right", "lower-back"]);
                    break;
            }
            break;
        case "chest":
            switch (subPart) {
                case "pecs":
                    applyHeat(["chest-upper"]);
                    break;
                case "compound":
                    applyHeat(["chest-upper", "chest-lower"]);
                    break;
            }
            break;
        case "shoulders":
            switch (subPart) {
                case "lateral delts":
                    applyHeat(["lateral-delts-left", "lateral-delts-right"]);
                    break;
                case "rear delts":
                    applyHeat(["rear-delts-left", "rear-delts-right"]);
                    break;
                case "traps":
                    applyHeat(["traps-front", "traps-left", "traps-right"]);
                    break;
                case "compound":
                    applyHeat(["shoulders-left", "shoulders-right", "traps-front", "traps-left", "traps-right"]);
                    break;
            }
            break;
        case "arms":
            switch (subPart) {
                case "biceps":
                    applyHeat(["biceps-left", "biceps-right"]);
                    break;
                case "triceps":
                    applyHeat(["triceps-left", "triceps-right"]);
                    break;
                case "forearms":
                    applyHeat(["forearms-left", "forearms-right"]);
                    break;
            }
            break;
        case "core":
            switch (subPart) {
                case "abs":
                    applyHeat(["abs"]);
                    break;
                case "obliques":
                    applyHeat(["obliques-left", "obliques-right"]);
                    break;
            }
            break;
    }
}

// Legend Component
function HeatLegend() {
    return (
        <div style={styles.legend}>
            <span style={styles.legendLabel}>Activity:</span>
            <div style={styles.legendItems}>
                <div style={styles.legendItem}>
                    <div style={{ ...styles.legendColor, backgroundColor: HEAT_COLORS[0] }} />
                    <span style={styles.legendText}>None</span>
                </div>
                <div style={styles.legendItem}>
                    <div style={{ ...styles.legendColor, backgroundColor: HEAT_COLORS[1] }} />
                    <span style={styles.legendText}>Low</span>
                </div>
                <div style={styles.legendItem}>
                    <div style={{ ...styles.legendColor, backgroundColor: HEAT_COLORS[3] }} />
                    <span style={styles.legendText}>Medium</span>
                </div>
                <div style={styles.legendItem}>
                    <div style={{ ...styles.legendColor, backgroundColor: HEAT_COLORS[5] }} />
                    <span style={styles.legendText}>High</span>
                </div>
            </div>
        </div>
    );
}

// Main Body Heatmap Component
export default function BodyHeatmap({
    entries = [],
    exercises = [],
    onPartClick,
    timeRange = 30,
}) {
    const [view, setView] = useState("front"); // "front" | "back"
    const [hoveredPart, setHoveredPart] = useState(null);

    const heatData = useMemo(() => {
        return calculateHeatData(entries, exercises, timeRange);
    }, [entries, exercises, timeRange]);

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>Muscle Activity Heatmap</h3>
                <div style={styles.viewToggle}>
                    <button
                        style={view === "front" ? styles.toggleBtnActive : styles.toggleBtn}
                        onClick={() => setView("front")}
                    >
                        Front
                    </button>
                    <button
                        style={view === "back" ? styles.toggleBtnActive : styles.toggleBtn}
                        onClick={() => setView("back")}
                    >
                        Back
                    </button>
                </div>
            </div>

            <HeatLegend />

            <div style={styles.svgContainer}>
                {view === "front" ? (
                    <BodyFrontSVG
                        heatData={heatData}
                        onPartClick={onPartClick}
                        hoveredPart={hoveredPart}
                        setHoveredPart={setHoveredPart}
                    />
                ) : (
                    <BodyBackSVG
                        heatData={heatData}
                        onPartClick={onPartClick}
                        hoveredPart={hoveredPart}
                        setHoveredPart={setHoveredPart}
                    />
                )}
            </div>

            {hoveredPart && (
                <div style={styles.tooltip}>
                    {getPartLabel(hoveredPart)}
                </div>
            )}
        </div>
    );
}

function getPartLabel(partId) {
    const labels = {
        "traps-front": "Traps",
        "shoulders-left": "Front Delts (L)",
        "shoulders-right": "Front Delts (R)",
        "lateral-delts-left": "Side Delts (L)",
        "lateral-delts-right": "Side Delts (R)",
        "chest-upper": "Upper Chest",
        "chest-lower": "Lower Chest",
        "abs": "Abs",
        "obliques-left": "Obliques (L)",
        "obliques-right": "Obliques (R)",
        "biceps-left": "Biceps (L)",
        "biceps-right": "Biceps (R)",
        "forearms-left": "Forearms (L)",
        "forearms-right": "Forearms (R)",
        "quads-left": "Quads (L)",
        "quads-right": "Quads (R)",
        "adductors": "Adductors",
        "tibialis-left": "Tibialis (L)",
        "tibialis-right": "Tibialis (R)",
        "calves-left": "Calves (L)",
        "calves-right": "Calves (R)",
        "traps-left": "Traps (L)",
        "traps-right": "Traps (R)",
        "back-upper": "Upper Back",
        "lats-left": "Lats (L)",
        "lats-right": "Lats (R)",
        "lower-back": "Lower Back",
        "rear-delts-left": "Rear Delts (L)",
        "rear-delts-right": "Rear Delts (R)",
        "triceps-left": "Triceps (L)",
        "triceps-right": "Triceps (R)",
        "glutes-left": "Glutes (L)",
        "glutes-right": "Glutes (R)",
        "hamstrings-left": "Hamstrings (L)",
        "hamstrings-right": "Hamstrings (R)",
        "abductors-left": "Abductors (L)",
        "abductors-right": "Abductors (R)",
        "calves-left-back": "Calves (L)",
        "calves-right-back": "Calves (R)",
    };
    return labels[partId] || partId;
}

const styles = {
    container: {
        background: COLORS.card,
        borderRadius: 20,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        marginBottom: 16,
    },
    title: {
        margin: 0,
        fontSize: 14,
        color: COLORS.textMuted,
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    viewToggle: {
        display: "flex",
        gap: 4,
        background: COLORS.bg,
        padding: 4,
        borderRadius: 9999,
    },
    toggleBtn: {
        padding: "6px 14px",
        borderRadius: 9999,
        border: "none",
        background: "transparent",
        color: COLORS.textMuted,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    toggleBtnActive: {
        padding: "6px 14px",
        borderRadius: 9999,
        border: "none",
        background: COLORS.mustardLight,
        color: COLORS.mustardDark,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
    },
    svgContainer: {
        width: "100%",
        maxWidth: 280,
        display: "flex",
        justifyContent: "center",
        padding: "10px 0",
    },
    legend: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
        width: "100%",
    },
    legendLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        fontWeight: 500,
    },
    legendItems: {
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        justifyContent: "center",
    },
    legendItem: {
        display: "flex",
        alignItems: "center",
        gap: 4,
    },
    legendColor: {
        width: 14,
        height: 14,
        borderRadius: 4,
        border: "1px solid #d0ccc4",
    },
    legendText: {
        fontSize: 11,
        color: COLORS.textMuted,
    },
    tooltip: {
        marginTop: 12,
        padding: "8px 16px",
        background: COLORS.mustardLight,
        color: COLORS.mustardDark,
        borderRadius: 9999,
        fontSize: 13,
        fontWeight: 600,
    },
};
