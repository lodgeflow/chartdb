import type { D1Database } from '@cloudflare/workers-types';

interface Env {
    DB: D1Database;
}

export async function onRequestPost(
    request: Request,
    env: Env
): Promise<Response> {
    try {
        const body = await request.json();
        const {
            workspaceId,
            diagramId,
            table,
        }: {
            workspaceId: string;
            diagramId: string;
            table: any;
        } = body;

        if (!workspaceId || !diagramId || !table) {
            return new Response(
                JSON.stringify({
                    error: 'workspaceId, diagramId, and table are required',
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        await env.DB.prepare(
            `INSERT INTO db_tables (
                id, diagram_id, workspace_id, name, schema, x, y, fields, indexes, 
                color, created_at, width, comment, is_view, is_materialized_view, "order"
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
            .bind(
                table.id,
                diagramId,
                workspaceId,
                table.name,
                table.schema || 'public',
                table.x,
                table.y,
                JSON.stringify(table.fields || []),
                table.indexes ? JSON.stringify(table.indexes) : null,
                table.color || null,
                new Date(table.createdAt || Date.now()).getTime(),
                table.width || null,
                table.comment || null,
                table.isView ? 1 : 0,
                table.isMaterializedView ? 1 : 0,
                table.order || null
            )
            .run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error in POST /api/tables:', error);
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
        const tableId = url.searchParams.get('tableId');
        const workspaceId = url.searchParams.get('workspaceId');

        if (!tableId || !workspaceId) {
            return new Response(
                JSON.stringify({
                    error: 'tableId and workspaceId are required',
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const body = await request.json();
        const updates: string[] = [];
        const values: any[] = [];

        if (body.name !== undefined) {
            updates.push('name = ?');
            values.push(body.name);
        }
        if (body.schema !== undefined) {
            updates.push('schema = ?');
            values.push(body.schema);
        }
        if (body.x !== undefined) {
            updates.push('x = ?');
            values.push(body.x);
        }
        if (body.y !== undefined) {
            updates.push('y = ?');
            values.push(body.y);
        }
        if (body.fields !== undefined) {
            updates.push('fields = ?');
            values.push(JSON.stringify(body.fields));
        }
        if (body.indexes !== undefined) {
            updates.push('indexes = ?');
            values.push(body.indexes ? JSON.stringify(body.indexes) : null);
        }
        if (body.color !== undefined) {
            updates.push('color = ?');
            values.push(body.color);
        }
        if (body.width !== undefined) {
            updates.push('width = ?');
            values.push(body.width);
        }
        if (body.comment !== undefined) {
            updates.push('comment = ?');
            values.push(body.comment);
        }
        if (body.isView !== undefined) {
            updates.push('is_view = ?');
            values.push(body.isView ? 1 : 0);
        }
        if (body.isMaterializedView !== undefined) {
            updates.push('is_materialized_view = ?');
            values.push(body.isMaterializedView ? 1 : 0);
        }
        if (body.order !== undefined) {
            updates.push('"order" = ?');
            values.push(body.order);
        }

        if (updates.length === 0) {
            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        values.push(tableId, workspaceId);

        await env.DB.prepare(
            `UPDATE db_tables SET ${updates.join(', ')} WHERE id = ? AND workspace_id = ?`
        )
            .bind(...values)
            .run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error in PUT /api/tables:', error);
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
        const tableId = url.searchParams.get('tableId');
        const workspaceId = url.searchParams.get('workspaceId');

        if (!tableId || !workspaceId) {
            return new Response(
                JSON.stringify({
                    error: 'tableId and workspaceId are required',
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        await env.DB.prepare(
            `DELETE FROM db_tables WHERE id = ? AND workspace_id = ?`
        )
            .bind(tableId, workspaceId)
            .run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error in DELETE /api/tables:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}

