import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import type { Request, Response } from 'express';
import appInstance from '../app';

/**
 * The main Azure Function that acts as a proxy to the Express app.
 * This function adapts the Azure Function request/response to the Express format.
 */
export async function api(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

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
