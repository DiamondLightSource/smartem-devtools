---
name: Database
description: PostgreSQL administration, Alembic migrations, schema design, and database troubleshooting for smartem-decisions
version: 1.0.0
tags: [database, postgresql, alembic, migrations, schema]
---

# Database Skill

PostgreSQL database administration and Alembic migration management for the SmartEM system.

## When to Use

- Creating or modifying database migrations
- Troubleshooting database connection issues
- Schema design and optimisation
- Query performance analysis
- Database backup/recovery operations

## Critical Rules

1. **ALWAYS verify database configuration first**:
   ```bash
   # Check environment variables
   env | grep -E "POSTGRES|DATABASE"

   # Check .env file
   cat .env | grep -E "POSTGRES|DATABASE"

   # Check k8s config if applicable
   kubectl get configmap -o yaml | grep -E "POSTGRES|DATABASE"
   ```

2. **NEVER assume database names** - always verify from actual config

3. **Use application's connection setup** when available:
   ```python
   from smartem_backend.utils import setup_postgres_connection
   ```

## Common Actions

### Alembic Migrations

```bash
# Current migration status
cd repos/DiamondLightSource/smartem-decisions
python -m alembic current

# Migration history
python -m alembic history

# Create new migration (auto-generate from model changes)
python -m alembic revision --autogenerate -m "Description of change"

# Apply migrations
python -m alembic upgrade head

# Rollback one migration
python -m alembic downgrade -1

# Rollback to specific revision
python -m alembic downgrade <revision_id>
```

### Schema Validation

```bash
# Check for schema drift (CI workflow)
# Compares Alembic migrations against SQLModel definitions
python -m alembic check
```

### PostgreSQL Queries

```bash
# Connect to database (verify connection params first!)
psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB

# Common diagnostic queries
psql -c "SELECT version();"
psql -c "SELECT current_database();"
psql -c "\dt"  # List tables
psql -c "\d+ tablename"  # Describe table with details
```

### Performance Analysis

```sql
-- Check table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Active queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Migration Templates

### Basic Migration

```python
"""Description of migration.

Revision ID: xxxx
Revises: yyyy
Create Date: YYYY-MM-DD
"""
from alembic import op
import sqlalchemy as sa

revision = "xxxx"
down_revision = "yyyy"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tablename", sa.Column("newcol", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("tablename", "newcol")
```

### Data Migration (with safety)

```python
def upgrade() -> None:
    # Schema change
    op.add_column("tablename", sa.Column("newcol", sa.String(255), nullable=True))

    # Data migration - use raw SQL for performance
    op.execute("UPDATE tablename SET newcol = 'default' WHERE newcol IS NULL")

    # Make non-nullable after data is populated
    op.alter_column("tablename", "newcol", nullable=False)


def downgrade() -> None:
    op.alter_column("tablename", "newcol", nullable=True)
    op.drop_column("tablename", "newcol")
```

## SmartEM-Specific Context

### Database Tables

Key tables in smartem-decisions:
- `acquisition` - EPU sessions
- `grid` - Sample grids
- `gridsquare` - Grid locations
- `foilhole` - Individual holes
- `micrograph` - Captured images
- `atlas`, `atlastile` - Overview images
- `quality_prediction`, `quality_prediction_model` - ML predictions
- `agent_session`, `agent_instruction`, `agent_connection` - Agent management

### Scientific Data Considerations

- Time-series data patterns (acquisitions over time)
- Large binary references (image paths, not blobs)
- Hierarchical relationships (acquisition -> grid -> gridsquare -> foilhole -> micrograph)
- High-frequency inserts during active microscopy sessions

## Troubleshooting

### Connection Issues

```bash
# Test basic connectivity
pg_isready -h $POSTGRES_HOST -p 5432

# Check if service is running (k8s)
kubectl get pods | grep postgres
kubectl logs <postgres-pod>
```

### Migration Conflicts

```bash
# If heads diverged
python -m alembic heads
python -m alembic merge -m "merge heads" <rev1> <rev2>
```

## References

- Alembic docs: https://alembic.sqlalchemy.org/
- PostgreSQL docs: https://www.postgresql.org/docs/
- SQLModel docs: https://sqlmodel.tiangolo.com/
