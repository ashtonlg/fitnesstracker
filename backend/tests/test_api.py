import pytest


def test_session_entries_and_progress(client):
    exercises = client.get("/exercises").json()
    assert exercises

    chinup = next((e for e in exercises if "chin-up" in e["name"].lower()), None)
    squat = next((e for e in exercises if e["name"].lower() == "back squat"), None)
    assert chinup and squat

    session = client.post("/sessions/start", json={"bodyweight_kg": 80}).json()
    session_id = session["id"]

    res = client.post(
        f"/sessions/{session_id}/entries",
        json={"exercise_id": chinup["id"], "weight_kg": 10, "reps": 5},
    )
    assert res.status_code == 200

    res = client.post(
        f"/sessions/{session_id}/entries",
        json={"exercise_id": squat["id"], "weight_kg": 100, "reps": 3},
    )
    assert res.status_code == 200

    entries = client.get(f"/sessions/{session_id}/entries").json()
    assert len(entries) == 2

    chinup_entry = next(e for e in entries if e["exercise_id"] == chinup["id"])
    assert chinup_entry["total_kg"] == pytest.approx(90.0)

    points = client.get(f"/progress/exercise/{chinup['id']}").json()
    assert len(points) == 1
    assert points[0]["e1rm"] > 0

    summary = client.get("/progress/summary").json()
    assert any(p["exercise_id"] == chinup["id"] for p in summary)

    delete_entry = client.delete(f"/entries/{chinup_entry['id']}")
    assert delete_entry.status_code == 200

    delete_session = client.delete(f"/sessions/{session_id}")
    assert delete_session.status_code == 200


def test_goals_flow(client):
    exercises = client.get("/exercises").json()
    squat = next((e for e in exercises if e["name"].lower() == "back squat"), None)
    assert squat

    session = client.post("/sessions/start", json={"bodyweight_kg": 75}).json()
    session_id = session["id"]
    client.post(
        f"/sessions/{session_id}/entries",
        json={"exercise_id": squat["id"], "weight_kg": 120, "reps": 3},
    )

    goal = client.post(
        "/goals",
        json={"type": "pr", "exercise_id": squat["id"], "target_weight_kg": 130, "target_reps": 3},
    ).json()
    assert goal["type"] == "pr"

    goals = client.get("/goals").json()
    assert any(g["id"] == goal["id"] for g in goals)

    summary = client.get("/goals/summary").json()
    assert "avg_load_kg" in summary


def test_cannot_add_entry_to_ended_session(client):
    """Test that entries cannot be added to a session that has already ended."""
    exercises = client.get("/exercises").json()
    squat = next((e for e in exercises if e["name"].lower() == "back squat"), None)
    assert squat

    # Start a session and add an entry
    session = client.post("/sessions/start", json={"bodyweight_kg": 80}).json()
    session_id = session["id"]

    res = client.post(
        f"/sessions/{session_id}/entries",
        json={"exercise_id": squat["id"], "weight_kg": 100, "reps": 5},
    )
    assert res.status_code == 200

    # End the session
    res = client.post(f"/sessions/{session_id}/end")
    assert res.status_code == 200
    assert res.json()["ended_at"] is not None

    # Try to add another entry to the ended session
    res = client.post(
        f"/sessions/{session_id}/entries",
        json={"exercise_id": squat["id"], "weight_kg": 120, "reps": 3},
    )
    assert res.status_code == 400
    assert "ended" in res.json()["detail"].lower()


def test_goal_creation_validation_errors(client):
    """Test validation edge cases for goal creation."""
    exercises = client.get("/exercises").json()
    squat = next((e for e in exercises if e["name"].lower() == "back squat"), None)
    assert squat

    # Invalid goal type
    res = client.post(
        "/goals",
        json={
            "type": "invalid_type",
            "exercise_id": squat["id"],
            "target_weight_kg": 100,
            "target_reps": 5,
        },
    )
    assert res.status_code == 400

    # PR goal missing required fields
    res = client.post(
        "/goals",
        json={"type": "pr", "exercise_id": squat["id"]},  # Missing target_weight_kg and target_reps
    )
    assert res.status_code == 400

    # PR goal with zero/negative values
    res = client.post(
        "/goals",
        json={"type": "pr", "exercise_id": squat["id"], "target_weight_kg": 0, "target_reps": -1},
    )
    assert res.status_code == 400

    # Frequency goal missing target_sessions_per_week
    res = client.post(
        "/goals",
        json={"type": "frequency"},  # Missing target_sessions_per_week
    )
    assert res.status_code == 400

    # Frequency goal with zero/negative value
    res = client.post(
        "/goals",
        json={"type": "frequency", "target_sessions_per_week": 0},
    )
    assert res.status_code == 400


def test_bodyweight_update_and_tracking(client):
    """Test bodyweight update during session and tracking history."""
    # Start session without bodyweight
    session = client.post("/sessions/start").json()
    session_id = session["id"]
    assert session["bodyweight_kg"] is None

    # Update bodyweight during session
    res = client.post(
        f"/sessions/{session_id}/bodyweight",
        json={"bodyweight_kg": 75.5},
    )
    assert res.status_code == 200
    assert res.json()["bodyweight_kg"] == 75.5

    # Get session and verify bodyweight
    session = client.get(f"/sessions/{session_id}").json()
    assert session["bodyweight_kg"] == 75.5

    # Add bodyweight exercise entry (chin-up)
    exercises = client.get("/exercises").json()
    chinup = next((e for e in exercises if "chin-up" in e["name"].lower()), None)
    assert chinup and chinup["uses_bodyweight"] is True

    res = client.post(
        f"/sessions/{session_id}/entries",
        json={"exercise_id": chinup["id"], "weight_kg": 10, "reps": 5},
    )
    assert res.status_code == 200

    # Check entries include bodyweight in total_kg
    entries = client.get(f"/sessions/{session_id}/entries").json()
    assert len(entries) == 1
    # total_kg should be weight_kg + bodyweight_kg = 10 + 75.5 = 85.5
    assert entries[0]["total_kg"] == 85.5

    # Check bodyweight history
    history = client.get("/bodyweight").json()
    assert len(history) == 1
    assert history[0]["weight_kg"] == 75.5


def test_404_errors_for_nonexistent_resources(client):
    """Test 404 responses for accessing non-existent resources."""
    # Non-existent session
    res = client.get("/sessions/99999")
    assert res.status_code == 404

    res = client.post("/sessions/99999/end")
    assert res.status_code == 404

    res = client.post(
        "/sessions/99999/bodyweight",
        json={"bodyweight_kg": 80},
    )
    assert res.status_code == 404

    res = client.get("/sessions/99999/entries")
    assert res.status_code == 404

    res = client.delete("/sessions/99999")
    assert res.status_code == 404

    # Non-existent exercise in progress endpoint
    res = client.get("/progress/exercise/99999")
    assert res.status_code == 404

    # Non-existent entry deletion
    res = client.delete("/entries/99999")
    assert res.status_code == 404

    # Non-existent goal deletion
    res = client.delete("/goals/99999")
    assert res.status_code == 404


def test_empty_database_states(client):
    """Test API behavior with empty database states."""
    # Goals summary with no data
    summary = client.get("/goals/summary").json()
    assert summary["chinup_reps"] == 0
    assert summary["chinup_sets"] == 0
    assert summary["avg_load_kg"] == 0.0
    assert summary["total_sets"] == 0

    # Progress summary with no entries
    progress = client.get("/progress/summary").json()
    assert progress == []

    # Bodyweight history with no sessions
    history = client.get("/bodyweight").json()
    assert history == []

    # Heatmap entries with no data
    heatmap = client.get("/heatmap/entries").json()
    assert heatmap == []

    # List sessions with no sessions
    sessions = client.get("/sessions").json()
    assert sessions == []

    # List goals with no goals
    goals = client.get("/goals").json()
    assert goals == []

    # Create a session with no bodyweight
    session = client.post("/sessions/start").json()
    assert session["bodyweight_kg"] is None
    assert session["ended_at"] is None

    # Get entries for a valid session with no entries
    entries = client.get(f"/sessions/{session['id']}/entries").json()
    assert entries == []
