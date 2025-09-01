import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function health(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Health check function called');
    
    return {
        status: 200,
        jsonBody: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            hasConnectionString: !!process.env.SQL_CONNECTION_STRING,
            connectionStringPreview: process.env.SQL_CONNECTION_STRING ? 
                process.env.SQL_CONNECTION_STRING.substring(0, 50) + '...' : 'Not found'
        }
    };
}

app.http('health', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: health
});
