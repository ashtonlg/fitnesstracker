import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import BodyHeatmap, { calculateHeatData } from "./BodyHeatmap.jsx";

describe("BodyHeatmap", () => {
    it("renders the heatmap title", () => {
        render(<BodyHeatmap entries={[]} exercises={[]} />);
        expect(screen.getByText("Muscle Activity Heatmap")).toBeInTheDocument();
    });

    it("maps recent entries to heat on the correct parts", () => {
        const exercises = [
            { id: 1, body_part: "legs", sub_part: "quads" },
            { id: 2, body_part: "core", sub_part: "abs" },
        ];
        const entries = [
            {
                exercise_id: 1,
                weight_kg: 100,
                reps: 5,
                created_at: new Date().toISOString(),
            },
            {
                exercise_id: 2,
                weight_kg: 0,
                reps: 10,
                created_at: new Date().toISOString(),
            },
        ];

        const heat = calculateHeatData(entries, exercises, 30);
        expect(heat["quads-left"]).toBeGreaterThan(0);
        expect(heat["quads-right"]).toBeGreaterThan(0);
        expect(heat["abs"]).toBeGreaterThan(0);
    });
});
