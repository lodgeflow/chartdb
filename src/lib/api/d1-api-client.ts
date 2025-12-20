import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { ChartDBConfig } from '@/lib/domain/config';
import { getWorkspaceId } from '@/lib/utils/utils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiOptions {
    includeTables?: boolean;
    includeRelationships?: boolean;
    includeDependencies?: boolean;
    includeAreas?: boolean;
    includeCustomTypes?: boolean;
    includeNotes?: boolean;
}

class D1ApiClient {
    private workspaceId: string;

    constructor() {
        this.workspaceId = getWorkspaceId();
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                error: 'Unknown error',
            }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Diagram operations
    async listDiagrams(options: ApiOptions = {}): Promise<Diagram[]> {
        const params = new URLSearchParams({
            workspaceId: this.workspaceId,
            ...(options.includeTables && { includeTables: 'true' }),
            ...(options.includeRelationships && {
                includeRelationships: 'true',
            }),
            ...(options.includeDependencies && {
                includeDependencies: 'true',
            }),
            ...(options.includeAreas && { includeAreas: 'true' }),
            ...(options.includeCustomTypes && {
                includeCustomTypes: 'true',
            }),
            ...(options.includeNotes && { includeNotes: 'true' }),
        });

        return this.request<Diagram[]>(`/diagrams?${params}`);
    }

    async getDiagram(
        diagramId: string,
        options: ApiOptions = {}
    ): Promise<Diagram | null> {
        const params = new URLSearchParams({
            workspaceId: this.workspaceId,
            diagramId,
            ...(options.includeTables && { includeTables: 'true' }),
            ...(options.includeRelationships && {
                includeRelationships: 'true',
            }),
            ...(options.includeDependencies && {
                includeDependencies: 'true',
            }),
            ...(options.includeAreas && { includeAreas: 'true' }),
            ...(options.includeCustomTypes && {
                includeCustomTypes: 'true',
            }),
            ...(options.includeNotes && { includeNotes: 'true' }),
        });

        try {
            return await this.request<Diagram>(`/diagrams?${params}`);
        } catch (error) {
            if (error instanceof Error && error.message.includes('404')) {
                return null;
            }
            throw error;
        }
    }

    async createDiagram(diagram: Diagram): Promise<void> {
        await this.request('/diagrams', {
            method: 'POST',
            body: JSON.stringify({
                workspaceId: this.workspaceId,
                diagram: {
                    id: diagram.id,
                    name: diagram.name,
                    databaseType: diagram.databaseType,
                    databaseEdition: diagram.databaseEdition,
                    createdAt: diagram.createdAt.toISOString(),
                    updatedAt: diagram.updatedAt.toISOString(),
                },
            }),
        });
    }

    async updateDiagram(
        diagramId: string,
        attributes: Partial<Diagram>
    ): Promise<void> {
        const params = new URLSearchParams({
            workspaceId: this.workspaceId,
            diagramId,
        });

        await this.request(`/diagrams?${params}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: attributes.name,
                databaseType: attributes.databaseType,
                databaseEdition: attributes.databaseEdition,
                updatedAt:
                    attributes.updatedAt?.toISOString() ||
                    new Date().toISOString(),
            }),
        });
    }

    async deleteDiagram(diagramId: string): Promise<void> {
        const params = new URLSearchParams({
            workspaceId: this.workspaceId,
            diagramId,
        });

        await this.request(`/diagrams?${params}`, {
            method: 'DELETE',
        });
    }

    // Table operations
    async createTable(diagramId: string, table: DBTable): Promise<void> {
        await this.request('/tables', {
            method: 'POST',
            body: JSON.stringify({
                workspaceId: this.workspaceId,
                diagramId,
                table: {
                    ...table,
                    createdAt: table.createdAt
                        ? new Date(table.createdAt).toISOString()
                        : new Date().toISOString(),
                },
            }),
        });
    }

    async updateTable(
        tableId: string,
        updates: Partial<DBTable>
    ): Promise<void> {
        const params = new URLSearchParams({
            workspaceId: this.workspaceId,
            tableId,
        });

        await this.request(`/tables?${params}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    async deleteTable(tableId: string): Promise<void> {
        const params = new URLSearchParams({
            workspaceId: this.workspaceId,
            tableId,
        });

        await this.request(`/tables?${params}`, {
            method: 'DELETE',
        });
    }

    // Relationship operations
    async createRelationship(
        diagramId: string,
        relationship: DBRelationship
    ): Promise<void> {
        await this.request('/relationships', {
            method: 'POST',
            body: JSON.stringify({
                workspaceId: this.workspaceId,
                diagramId,
                relationship: {
                    ...relationship,
                    createdAt: relationship.createdAt
                        ? new Date(relationship.createdAt).toISOString()
                        : new Date().toISOString(),
                },
            }),
        });
    }

    async updateRelationship(
        relationshipId: string,
        updates: Partial<DBRelationship>
    ): Promise<void> {
        const params = new URLSearchParams({
            workspaceId: this.workspaceId,
            relationshipId,
        });

        await this.request(`/relationships?${params}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    async deleteRelationship(relationshipId: string): Promise<void> {
        const params = new URLSearchParams({
            workspaceId: this.workspaceId,
            relationshipId,
        });

        await this.request(`/relationships?${params}`, {
            method: 'DELETE',
        });
    }

    // Config operations
    async getConfig(): Promise<ChartDBConfig | undefined> {
        const params = new URLSearchParams({
            workspaceId: this.workspaceId,
        });

        const config = await this.request<ChartDBConfig | null>(
            `/config?${params}`
        );
        return config || undefined;
    }

    async updateConfig(config: Partial<ChartDBConfig>): Promise<void> {
        const params = new URLSearchParams({
            workspaceId: this.workspaceId,
        });

        await this.request(`/config?${params}`, {
            method: 'PUT',
            body: JSON.stringify(config),
        });
    }
}

export const d1ApiClient = new D1ApiClient();
