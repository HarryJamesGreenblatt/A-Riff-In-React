import { CosmosClient, Container, SqlQuerySpec } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';

// Types
interface Activity {
  id?: string;
  userId: string;
  type: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp?: string;
}

class CosmosService {
  private client: CosmosClient | null = null;
  private container: Container | null = null;
  private databaseId: string;
  private containerId: string;

  constructor() {
    this.databaseId = process.env.COSMOS_DATABASE_ID || 'ARiffInReact';
    this.containerId = process.env.COSMOS_CONTAINER_ID || 'activities';
  }

  private async initialize(): Promise<Container> {
    if (!this.container) {
      // Use different auth mechanisms based on environment
      if (process.env.NODE_ENV === 'production') {
        // In production, use Managed Identity
        const credential = new DefaultAzureCredential();
        const endpoint = process.env.COSMOS_ENDPOINT || '';
        
        this.client = new CosmosClient({
          endpoint,
          aadCredentials: credential
        });
      } else {
        // For local development, use connection key
        const endpoint = process.env.COSMOS_ENDPOINT || '';
        const key = process.env.COSMOS_KEY || '';
        
        this.client = new CosmosClient({
          endpoint,
          key
        });
      }

      const database = this.client.database(this.databaseId);
      this.container = database.container(this.containerId);
    }
    
    return this.container;
  }

  async getActivities(userId?: string): Promise<Activity[]> {
    const container = await this.initialize();
    
    // Build query based on parameters
    let querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c ORDER BY c.timestamp DESC'
    };
    
    if (userId) {
      querySpec = {
        query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.timestamp DESC',
        parameters: [
          {
            name: '@userId',
            value: userId
          }
        ]
      };
    }
    
    const { resources } = await container.items.query<Activity>(querySpec).fetchAll();
    return resources;
  }

  async getRecentActivities(limit = 20): Promise<Activity[]> {
    const container = await this.initialize();
    
    const querySpec: SqlQuerySpec = {
      query: `SELECT * FROM c ORDER BY c.timestamp DESC OFFSET 0 LIMIT ${limit}`
    };
    
    const { resources } = await container.items.query<Activity>(querySpec).fetchAll();
    return resources;
  }

  async createActivity(activity: Activity): Promise<Activity> {
    const container = await this.initialize();
    
    // Add generated fields
    const newActivity: Activity = {
      ...activity,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    const { resource } = await container.items.create(newActivity);
    return resource as Activity;
  }
}

export const cosmosService = new CosmosService();
