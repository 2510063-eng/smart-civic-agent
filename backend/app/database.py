from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# SQLite specific connect_args to allow multiple threads in FastAPI
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency that provides a database session to API route handlers."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all database tables automatically on startup and ensure schema consistency."""
    import app.models  # Ensure models are imported before creating tables
    Base.metadata.create_all(bind=engine)

    # For SQLite: ensure any newly added columns exist if the file already exists
    if settings.DATABASE_URL.startswith("sqlite"):
        with engine.connect() as conn:
            try:
                res = conn.exec_driver_sql("PRAGMA table_info(complaints)")
                existing_cols = [row[1] for row in res.fetchall()]
                if existing_cols:
                    if "duplicate_of" not in existing_cols:
                        conn.exec_driver_sql("ALTER TABLE complaints ADD COLUMN duplicate_of VARCHAR(50)")
                    if "cluster_id" not in existing_cols:
                        conn.exec_driver_sql("ALTER TABLE complaints ADD COLUMN cluster_id VARCHAR(50)")
                    if "similarity_score" not in existing_cols:
                        conn.exec_driver_sql("ALTER TABLE complaints ADD COLUMN similarity_score FLOAT")
                    conn.commit()
            except Exception:
                pass
