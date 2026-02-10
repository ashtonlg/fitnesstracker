import importlib
import os
import tempfile

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def client():
    fd, path = tempfile.mkstemp(prefix="ft_test_", suffix=".db")
    os.close(fd)
    os.environ["DATABASE_URL"] = f"sqlite:///{path}"

    import app.db as db
    import app.main as main

    importlib.reload(db)
    importlib.reload(main)

    with TestClient(main.app) as test_client:
        yield test_client

    try:
        os.remove(path)
    except FileNotFoundError:
        pass


@pytest.fixture(autouse=True)
def reset_db(client):
    client.post("/admin/reset")
    yield
