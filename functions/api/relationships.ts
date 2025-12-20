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
            relationship,
        }: {
            workspaceId: string;
            diagramId: string;
            relationship: any;
        } = body;

        if (!workspaceId || !diagramId || !relationship) {
            return new Response(
                JSON.stringify({
                    error:
                        'workspaceId, diagramId, and relationship are required',
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        await env.DB.prepare(
            `INSERT INTO db_relationships (
                id, diagram_id, workspace_id, name, source_schema, source_table_id,
                target_schema, target_table_id, source_field_id, target_field_id,
                type, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
            .bind(
                relationship.id,
                diagramId,
                workspaceId,
                relationship.name || null,
                relationship.sourceSchema || 'public',
                relationship.sourceTableId,
                relationship.targetSchema || 'public',
                relationship.targetTableId,
                relationship.sourceFieldId || null,
                relationship.targetFieldId || null,
                relationship.type,
                new Date(relationship.createdAt || Date.now()).getTime()
            )
            .run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error in POST /api/relationships:', error);
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
        const relationshipId = url.searchParams.get('relationshipId');
        const workspaceId = url.searchParams.get('workspaceId');

        if (!relationshipId || !workspaceId) {
            return new Response(
                JSON.stringify({
                    error: 'relationshipId and workspaceId are required',
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
        if (body.sourceSchema !== undefined) {
            updates.push('source_schema = ?');
            values.push(body.sourceSchema);
        }
        if (body.sourceTableId !== undefined) {
            updates.push('source_table_id = ?');
            values.push(body.sourceTableId);
        }
        if (body.targetSchema !== undefined) {
            updates.push('target_schema = ?');
            values.push(body.targetSchema);
        }
        if (body.targetTableId !== undefined) {
            updates.push('target_table_id = ?');
            values.push(body.targetTableId);
        }
        if (body.sourceFieldId !== undefined) {
            updates.push('source_field_id = ?');
            values.push(body.sourceFieldId);
        }
        if (body.targetFieldId !== undefined) {
            updates.push('target_field_id = ?');
            values.push(body.targetFieldId);
        }
        if (body.type !== undefined) {
            updates.push('type = ?');
            values.push(body.type);
        }

        if (updates.length === 0) {
            return new Response(JSON.stringify({ success: true }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        values.push(relationshipId, workspaceId);

        await env.DB.prepare(
            `UPDATE db_relationships SET ${updates.join(', ')} WHERE id = ? AND workspace_id = ?`
        )
            .bind(...values)
            .run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error in PUT /api/relationships:', error);
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
        const relationshipId = url.searchParams.get('relationshipId');
        const workspaceId = url.searchParams.get('workspaceId');

        if (!relationshipId || !workspaceId) {
            return new Response(
                JSON.stringify({
                    error: 'relationshipId and workspaceId are required',
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        await env.DB.prepare(
            `DELETE FROM db_relationships WHERE id = ? AND workspace_id = ?`
        )
            .bind(relationshipId, workspaceId)
            .run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error in DELETE /api/relationships:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}

