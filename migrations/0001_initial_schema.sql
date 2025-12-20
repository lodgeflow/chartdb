-- ChartDB D1 Database Schema

-- Diagrams table
CREATE TABLE IF NOT EXISTS diagrams (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    database_type TEXT NOT NULL,
    database_edition TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Tables table
CREATE TABLE IF NOT EXISTS db_tables (
    id TEXT PRIMARY KEY,
    diagram_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    schema TEXT NOT NULL DEFAULT 'public',
    x REAL NOT NULL,
    y REAL NOT NULL,
    fields TEXT NOT NULL, -- JSON string
    indexes TEXT, -- JSON string
    color TEXT,
    created_at INTEGER NOT NULL,
    width REAL,
    comment TEXT,
    is_view INTEGER DEFAULT 0,
    is_materialized_view INTEGER DEFAULT 0,
    "order" INTEGER,
    FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE
);

-- Relationships table
CREATE TABLE IF NOT EXISTS db_relationships (
    id TEXT PRIMARY KEY,
    diagram_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    name TEXT,
    source_schema TEXT NOT NULL,
    source_table_id TEXT NOT NULL,
    target_schema TEXT NOT NULL,
    target_table_id TEXT NOT NULL,
    source_field_id TEXT,
    target_field_id TEXT,
    type TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE
);

-- Dependencies table
CREATE TABLE IF NOT EXISTS db_dependencies (
    id TEXT PRIMARY KEY,
    diagram_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    schema TEXT NOT NULL,
    table_id TEXT NOT NULL,
    dependent_schema TEXT NOT NULL,
    dependent_table_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE
);

-- Areas table
CREATE TABLE IF NOT EXISTS areas (
    id TEXT PRIMARY KEY,
    diagram_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    color TEXT,
    FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE
);

-- Custom types table
CREATE TABLE IF NOT EXISTS db_custom_types (
    id TEXT PRIMARY KEY,
    diagram_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    schema TEXT NOT NULL,
    type TEXT NOT NULL,
    kind TEXT NOT NULL,
    "values" TEXT, -- JSON string for enum values
    fields TEXT, -- JSON string for composite types
    FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    diagram_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    content TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    color TEXT,
    FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE
);

-- Config table
CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    workspace_id TEXT NOT NULL,
    default_diagram_id TEXT
);

-- Diagram filters table
CREATE TABLE IF NOT EXISTS diagram_filters (
    diagram_id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    table_ids TEXT, -- JSON string array
    schemas_ids TEXT, -- JSON string array
    FOREIGN KEY (diagram_id) REFERENCES diagrams(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_diagrams_workspace ON diagrams(workspace_id);
CREATE INDEX IF NOT EXISTS idx_diagrams_updated_at ON diagrams(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tables_diagram ON db_tables(diagram_id);
CREATE INDEX IF NOT EXISTS idx_tables_workspace ON db_tables(workspace_id);
CREATE INDEX IF NOT EXISTS idx_relationships_diagram ON db_relationships(diagram_id);
CREATE INDEX IF NOT EXISTS idx_relationships_workspace ON db_relationships(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_diagram ON db_dependencies(diagram_id);
CREATE INDEX IF NOT EXISTS idx_dependencies_workspace ON db_dependencies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_areas_diagram ON areas(diagram_id);
CREATE INDEX IF NOT EXISTS idx_areas_workspace ON areas(workspace_id);
CREATE INDEX IF NOT EXISTS idx_custom_types_diagram ON db_custom_types(diagram_id);
CREATE INDEX IF NOT EXISTS idx_custom_types_workspace ON db_custom_types(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notes_diagram ON notes(diagram_id);
CREATE INDEX IF NOT EXISTS idx_notes_workspace ON notes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_config_workspace ON config(workspace_id);
CREATE INDEX IF NOT EXISTS idx_filters_workspace ON diagram_filters(workspace_id);

