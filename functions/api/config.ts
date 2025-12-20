import type { D1Database } from '@cloudflare/workers-types';

interface Env {
    DB: D1Database;
}

export async function onRequestGet(
    request: Request,
    env: Env
): Promise<Response> {
    try {
        const url = new URL(request.url);
        const workspaceId = url.searchParams.get('workspaceId');

        if (!workspaceId) {
            return new Response(
                JSON.stringify({ error: 'workspaceId is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const config = await env.DB.prepare(
            `SELECT * FROM config WHERE workspace_id = ?`
        )
            .bind(workspaceId)
            .first<{
                id: number;
                workspace_id: string;
                default_diagram_id: string | null;
            }>();

        if (!config) {
            return new Response(JSON.stringify(null), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(
            JSON.stringify({
                defaultDiagramId: config.default_diagram_id || '',
            }),
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('Error in GET /api/config:', error);
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
        const workspaceId = url.searchParams.get('workspaceId');

        if (!workspaceId) {
            return new Response(
                JSON.stringify({ error: 'workspaceId is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const body = await request.json();
        const { defaultDiagramId } = body;

        // Check if config exists
        const existing = await env.DB.prepare(
            `SELECT id FROM config WHERE workspace_id = ?`
        )
            .bind(workspaceId)
            .first();

        if (existing) {
            await env.DB.prepare(
                `UPDATE config SET default_diagram_id = ? WHERE workspace_id = ?`
            )
                .bind(defaultDiagramId || null, workspaceId)
                .run();
        } else {
            await env.DB.prepare(
                `INSERT INTO config (workspace_id, default_diagram_id) VALUES (?, ?)`
            )
                .bind(workspaceId, defaultDiagramId || null)
                .run();
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error in PUT /api/config:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
