import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import type { Request, Response } from 'express';
import appInstance from '../app';

/**
 * The main Azure Function that acts as a proxy to the Express app.
 * This function adapts the Azure Function request/response to the Express format.
 */
export async function api(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    // Simple health check
    if (request.params.route === 'health') {
        return {
            status: 200,
            jsonBody: {
                status: 'ok',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                hasConnectionString: !!process.env.SQL_CONNECTION_STRING
            }
        };
    }

    // Database test endpoint
    if (request.params.route === 'dbtest') {
        try {
            const { getDbPool } = await import('../services/database');
            context.log('Attempting to get database pool...');
            const pool = await getDbPool();
            context.log('Database pool created successfully');
            
            // Try a simple query
            const result = await pool.request().query('SELECT 1 as test');
            context.log('Test query executed successfully');
            
            return {
                status: 200,
                jsonBody: {
                    status: 'success',
                    message: 'Database connection successful',
                    testResult: result.recordset
                }
            };
        } catch (error) {
            const err = error as Error;
            context.log('Database test failed:', err);
            return {
                status: 500,
                jsonBody: {
                    status: 'error',
                    message: err.message,
                    stack: err.stack
                }
            };
        }
    }

    return new Promise((resolve) => {
        (async () => {
            // 1. Adapt the Azure HttpRequest to a shape Express can understand.
            // We only need to construct the properties our Express app actually uses.
            const expressRequest = {
                method: request.method,
                url: request.params.route ? `/${request.params.route}` : '/',
                headers: request.headers,
                query: Object.fromEntries(request.query.entries()),
                body: await request.json().catch(() => undefined), // Safely parse JSON body
            } as unknown as Request;

            // 2. Create a mock Express Response object. Its methods will resolve the promise,
            // effectively sending the response back to the Azure Functions host.
            const res: Partial<Response> & { statusCode?: number } = {};
            res.status = (code: number) => {
                res.statusCode = code;
                return res as Response;
            };
            res.json = (body: unknown) => {
                resolve({
                    status: res.statusCode || 200,
                    jsonBody: body,
                    headers: { 'Content-Type': 'application/json' },
                });
                return res as Response;
            };
            res.send = (body: unknown) => {
                resolve({
                    status: res.statusCode || 200,
                    body: String(body),
                });
                return res as Response;
            };

            // 3. Pass the adapted request and response to our Express app instance.
            appInstance(expressRequest, res as Response);
        })();
    });
}

app.http('api', {
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    authLevel: 'anonymous',
    route: '{*route}',
    handler: api
});
