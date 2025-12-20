import type { D1Database } from '@cloudflare/workers-types';

interface Env {
    DB: D1Database;
}

interface DiagramRow {
    id: string;
    workspace_id: string;
    name: string;
    database_type: string;
    database_edition: string | null;
    created_at: number;
    updated_at: number;
}

export async function onRequestGet(
    request: Request,
    env: Env
): Promise<Response> {
    try {
        const url = new URL(request.url);
        const workspaceId = url.searchParams.get('workspaceId');
        const diagramId = url.searchParams.get('diagramId');
        const includeTables = url.searchParams.get('includeTables') === 'true';
        const includeRelationships =
            url.searchParams.get('includeRelationships') === 'true';
        const includeDependencies =
            url.searchParams.get('includeDependencies') === 'true';
        const includeAreas = url.searchParams.get('includeAreas') === 'true';
        const includeCustomTypes =
            url.searchParams.get('includeCustomTypes') === 'true';
        const includeNotes = url.searchParams.get('includeNotes') === 'true';

        if (!workspaceId) {
            return new Response(
                JSON.stringify({ error: 'workspaceId is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (diagramId) {
            // Get single diagram
            const diagram = await getDiagramById(
                env.DB,
                diagramId,
                workspaceId,
                {
                    includeTables,
                    includeRelationships,
                    includeDependencies,
                    includeAreas,
                    includeCustomTypes,
                    includeNotes,
                }
            );

            if (!diagram) {
                return new Response(
                    JSON.stringify({ error: 'Diagram not found' }),
                    {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            }

            return new Response(JSON.stringify(diagram), {
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            // List all diagrams for workspace
            const diagrams = await listDiagrams(env.DB, workspaceId, {
                includeTables,
                includeRelationships,
                includeDependencies,
                includeAreas,
                includeCustomTypes,
                includeNotes,
            });

            return new Response(JSON.stringify(diagrams), {
                headers: { 'Content-Type': 'application/json' },
            });
        }
    } catch (error) {
        console.error('Error in GET /api/diagrams:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}

export async function onRequestPost(
    request: Request,
    env: Env
): Promise<Response> {
    try {
        const body = await request.json();
        const {
            workspaceId,
            diagram,
        }: {
            workspaceId: string;
            diagram: {
                id: string;
                name: string;
                databaseType: string;
                databaseEdition?: string;
                createdAt: string;
                updatedAt: string;
            };
        } = body;

        if (!workspaceId || !diagram) {
            return new Response(
                JSON.stringify({
                    error: 'workspaceId and diagram are required',
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        await env.DB.prepare(
            `INSERT INTO diagrams (id, workspace_id, name, database_type, database_edition, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
            .bind(
                diagram.id,
                workspaceId,
                diagram.name,
                diagram.databaseType,
                diagram.databaseEdition || null,
                new Date(diagram.createdAt).getTime(),
                new Date(diagram.updatedAt).getTime()
            )
            .run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error in POST /api/diagrams:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}

export async function onRequestPut(
    request: Request,
    env: Env
): Promise<Response> {
    try {
        const url = new URL(request.url);
        const diagramId = url.searchParams.get('diagramId');
        const workspaceId = url.searchParams.get('workspaceId');

        if (!diagramId || !workspaceId) {
            return new Response(
                JSON.stringify({
                    error: 'diagramId and workspaceId are required',
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const body = await request.json();
        const { name, databaseType, databaseEdition, updatedAt } = body;

        await env.DB.prepare(
            `UPDATE diagrams 
             SET name = ?, database_type = ?, database_edition = ?, updated_at = ?
             WHERE id = ? AND workspace_id = ?`
        )
            .bind(
                name,
                databaseType,
                databaseEdition || null,
                new Date(updatedAt).getTime(),
                diagramId,
                workspaceId
            )
            .run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error in PUT /api/diagrams:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}

export async function onRequestDelete(
    request: Request,
    env: Env
): Promise<Response> {
    try {
        const url = new URL(request.url);
        const diagramId = url.searchParams.get('diagramId');
        const workspaceId = url.searchParams.get('workspaceId');

        if (!diagramId || !workspaceId) {
            return new Response(
                JSON.stringify({
                    error: 'diagramId and workspaceId are required',
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        await env.DB.prepare(
            `DELETE FROM diagrams WHERE id = ? AND workspace_id = ?`
        )
            .bind(diagramId, workspaceId)
            .run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error in DELETE /api/diagrams:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}

async function getDiagramById(
    db: D1Database,
    diagramId: string,
    workspaceId: string,
    options: {
        includeTables?: boolean;
        includeRelationships?: boolean;
        includeDependencies?: boolean;
        includeAreas?: boolean;
        includeCustomTypes?: boolean;
        includeNotes?: boolean;
    }
) {
    const diagramRow = await db
        .prepare(`SELECT * FROM diagrams WHERE id = ? AND workspace_id = ?`)
        .bind(diagramId, workspaceId)
        .first<DiagramRow>();

    if (!diagramRow) {
        return null;
    }

    interface DiagramResult {
        id: string;
        name: string;
        databaseType: string;
        databaseEdition?: string;
        createdAt: Date;
        updatedAt: Date;
        tables?: Array<{
            id: string;
            name: string;
            schema: string;
            x: number;
            y: number;
            fields: unknown;
            indexes?: unknown;
            color: string;
            createdAt: Date;
            width?: number;
            comment?: string;
            isView: boolean;
            isMaterializedView: boolean;
            order?: number;
        }>;
        relationships?: Array<{
            id: string;
            name: string;
            sourceSchema: string;
            sourceTableId: string;
            targetSchema: string;
            targetTableId: string;
            sourceFieldId: string;
            targetFieldId: string;
            type: string;
            createdAt: Date;
        }>;
        dependencies?: Array<{
            id: string;
            schema: string;
            tableId: string;
            dependentSchema: string;
            dependentTableId: string;
            createdAt: Date;
        }>;
        areas?: Array<{
            id: string;
            name: string;
            x: number;
            y: number;
            width: number;
            height: number;
            color: string;
        }>;
        customTypes?: Array<{
            id: string;
            schema: string;
            type: string;
            kind: string;
            values?: unknown;
            fields?: unknown;
        }>;
        notes?: Array<{
            id: string;
            content: string;
            x: number;
            y: number;
            width: number;
            height: number;
            color: string;
        }>;
    }

    const diagram: DiagramResult = {
        id: diagramRow.id,
        name: diagramRow.name,
        databaseType: diagramRow.database_type,
        databaseEdition: diagramRow.database_edition || undefined,
        createdAt: new Date(diagramRow.created_at),
        updatedAt: new Date(diagramRow.updated_at),
    };

    if (options.includeTables) {
        const tables = await db
            .prepare(
                `SELECT * FROM db_tables WHERE diagram_id = ? AND workspace_id = ?`
            )
            .bind(diagramId, workspaceId)
            .all();
        diagram.tables = tables.results?.map((row) => ({
            id: row.id,
            name: row.name,
            schema: row.schema,
            x: row.x,
            y: row.y,
            fields: JSON.parse(row.fields || '[]'),
            indexes: row.indexes ? JSON.parse(row.indexes) : undefined,
            color: row.color,
            createdAt: new Date(row.created_at),
            width: row.width,
            comment: row.comment,
            isView: row.is_view === 1,
            isMaterializedView: row.is_materialized_view === 1,
            order: row.order,
        }));
    }

    if (options.includeRelationships) {
        const relationships = await db
            .prepare(
                `SELECT * FROM db_relationships WHERE diagram_id = ? AND workspace_id = ?`
            )
            .bind(diagramId, workspaceId)
            .all();
        diagram.relationships = relationships.results?.map((row) => ({
            id: row.id,
            name: row.name,
            sourceSchema: row.source_schema,
            sourceTableId: row.source_table_id,
            targetSchema: row.target_schema,
            targetTableId: row.target_table_id,
            sourceFieldId: row.source_field_id,
            targetFieldId: row.target_field_id,
            type: row.type,
            createdAt: new Date(row.created_at),
        }));
    }

    if (options.includeDependencies) {
        const dependencies = await db
            .prepare(
                `SELECT * FROM db_dependencies WHERE diagram_id = ? AND workspace_id = ?`
            )
            .bind(diagramId, workspaceId)
            .all();
        diagram.dependencies = dependencies.results?.map((row) => ({
            id: row.id,
            schema: row.schema,
            tableId: row.table_id,
            dependentSchema: row.dependent_schema,
            dependentTableId: row.dependent_table_id,
            createdAt: new Date(row.created_at),
        }));
    }

    if (options.includeAreas) {
        const areas = await db
            .prepare(
                `SELECT * FROM areas WHERE diagram_id = ? AND workspace_id = ?`
            )
            .bind(diagramId, workspaceId)
            .all();
        diagram.areas = areas.results?.map((row) => ({
            id: row.id,
            name: row.name,
            x: row.x,
            y: row.y,
            width: row.width,
            height: row.height,
            color: row.color,
        }));
    }

    if (options.includeCustomTypes) {
        const customTypes = await db
            .prepare(
                `SELECT * FROM db_custom_types WHERE diagram_id = ? AND workspace_id = ?`
            )
            .bind(diagramId, workspaceId)
            .all();
        diagram.customTypes = customTypes.results?.map((row) => ({
            id: row.id,
            schema: row.schema,
            type: row.type,
            kind: row.kind,
            values: row.values ? JSON.parse(row.values) : undefined,
            fields: row.fields ? JSON.parse(row.fields) : undefined,
        }));
    }

    if (options.includeNotes) {
        const notes = await db
            .prepare(
                `SELECT * FROM notes WHERE diagram_id = ? AND workspace_id = ?`
            )
            .bind(diagramId, workspaceId)
            .all();
        diagram.notes = notes.results?.map((row) => ({
            id: row.id,
            content: row.content,
            x: row.x,
            y: row.y,
            width: row.width,
            height: row.height,
            color: row.color,
        }));
    }

    return diagram;
}

async function listDiagrams(
    db: D1Database,
    workspaceId: string,
    options: {
        includeTables?: boolean;
        includeRelationships?: boolean;
        includeDependencies?: boolean;
        includeAreas?: boolean;
        includeCustomTypes?: boolean;
        includeNotes?: boolean;
    }
) {
    const diagrams = await db
        .prepare(
            `SELECT * FROM diagrams WHERE workspace_id = ? ORDER BY updated_at DESC`
        )
        .bind(workspaceId)
        .all<DiagramRow>();

    const result = await Promise.all(
        (diagrams.results || []).map((row) =>
            getDiagramById(db, row.id, workspaceId, options)
        )
    );

    return result.filter((d) => d !== null);
}
