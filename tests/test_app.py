from fastapi.testclient import TestClient
import pytest

from src.app import app, activities

client = TestClient(app)

TEST_EMAIL = "test_student@example.com"
TEST_ACTIVITY = "Basketball"


def reset_participants(activity, original):
    activities[activity]["participants"] = original


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Sanity check for a known activity
    assert TEST_ACTIVITY in data


def test_signup_and_get_participants():
    activity = TEST_ACTIVITY
    # Backup original participants
    original = activities[activity]["participants"][:]

    # Ensure test email not present
    if TEST_EMAIL in original:
        activities[activity]["participants"].remove(TEST_EMAIL)

    try:
        # Signup
        resp = client.post(f"/activities/{activity}/signup?email={TEST_EMAIL}")
        assert resp.status_code == 200
        resp_json = resp.json()
        assert "Signed up" in resp_json.get("message", "")

        # Verify participant appears in list
        resp = client.get(f"/activities/{activity}/participants")
        assert resp.status_code == 200
        participants = resp.json().get("participants", [])
        assert TEST_EMAIL in participants

        # Signing up same email again should fail
        resp = client.post(f"/activities/{activity}/signup?email={TEST_EMAIL}")
        assert resp.status_code == 400
    finally:
        # Cleanup
        reset_participants(activity, original)


def test_remove_participant():
    activity = TEST_ACTIVITY
    original = activities[activity]["participants"][:]

    # Ensure TEST_EMAIL present so we can remove it
    if TEST_EMAIL not in activities[activity]["participants"]:
        activities[activity]["participants"].append(TEST_EMAIL)

    try:
        # Remove participant
        resp = client.delete(f"/activities/{activity}/participants?email={TEST_EMAIL}")
        assert resp.status_code == 200
        resp_json = resp.json()
        assert "Removed" in resp_json.get("message", "")

        # Verify removed
        resp = client.get(f"/activities/{activity}/participants")
        assert resp.status_code == 200
        participants = resp.json().get("participants", [])
        assert TEST_EMAIL not in participants

        # Removing again should return 404
        resp = client.delete(f"/activities/{activity}/participants?email={TEST_EMAIL}")
        assert resp.status_code == 404
    finally:
        reset_participants(activity, original)
