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

interface UserCounter {
  id: string; // userId
  userId: string;
  count: number;
  lastUpdated: string;
  type: 'user_counter';
}

interface Notification {
  id?: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

class CosmosService {
  private client: CosmosClient | null = null;
  private container: Container | null = null;
  private databaseId: string;
  private containerId: string;

  constructor() {
    this.databaseId = process.env.COSMOS_DATABASE_NAME || 'ARiffInReact';
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

  // ============================================================================
  // ACTIVITIES
  // ============================================================================

  async getActivities(userId?: string): Promise<Activity[]> {
    const container = await this.initialize();
    
    // Build query based on parameters
    let querySpec: SqlQuerySpec = {
      query: 'SELECT * FROM c WHERE c.type != "user_counter" AND c.type != "notification" ORDER BY c.timestamp DESC'
    };
    
    if (userId) {
      querySpec = {
        query: 'SELECT * FROM c WHERE c.userId = @userId AND c.type != "user_counter" AND c.type != "notification" ORDER BY c.timestamp DESC',
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
      query: `SELECT * FROM c WHERE c.type != "user_counter" AND c.type != "notification" ORDER BY c.timestamp DESC OFFSET 0 LIMIT ${limit}`
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

  // ============================================================================
  // USER COUNTER
  // ============================================================================

  async getUserCounter(userId: string): Promise<UserCounter> {
    const container = await this.initialize();
    
    try {
      const { resource } = await container.item(userId, userId).read<UserCounter>();
      if (resource && resource.type === 'user_counter') {
        return resource;
      }
    } catch (error: any) {
      // If not found, create a new counter
      if (error.code === 404) {
        return this.createUserCounter(userId);
      }
      throw error;
    }
    
    // Fallback: create new counter
    return this.createUserCounter(userId);
  }

  private async createUserCounter(userId: string): Promise<UserCounter> {
    const container = await this.initialize();
    
    const counter: UserCounter = {
      id: userId,
      userId,
      count: 0,
      lastUpdated: new Date().toISOString(),
      type: 'user_counter'
    };
    
    const { resource } = await container.items.create(counter);
    return resource as UserCounter;
  }

  async incrementUserCounter(userId: string, amount: number = 1): Promise<UserCounter> {
    const container = await this.initialize();
    const currentCounter = await this.getUserCounter(userId);
    
    const updatedCounter: UserCounter = {
      ...currentCounter,
      count: currentCounter.count + amount,
      lastUpdated: new Date().toISOString()
    };
    
    const { resource } = await container
      .item(userId, userId)
      .replace<UserCounter>(updatedCounter);
    
    return resource as UserCounter;
  }

  async resetUserCounter(userId: string): Promise<UserCounter> {
    const container = await this.initialize();
    
    const resetCounter: UserCounter = {
      id: userId,
      userId,
      count: 0,
      lastUpdated: new Date().toISOString(),
      type: 'user_counter'
    };
    
    const { resource } = await container
      .item(userId, userId)
      .replace<UserCounter>(resetCounter);
    
    return resource as UserCounter;
  }

  // ============================================================================
  // NOTIFICATIONS (Future Feature)
  // ============================================================================

  async getNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    const container = await this.initialize();
    
    const querySpec: SqlQuerySpec = {
      query: unreadOnly
        ? 'SELECT * FROM c WHERE c.userId = @userId AND c.type = "notification" AND c.read = false ORDER BY c.createdAt DESC'
        : 'SELECT * FROM c WHERE c.userId = @userId AND c.type = "notification" ORDER BY c.createdAt DESC',
      parameters: [
        {
          name: '@userId',
          value: userId
        }
      ]
    };
    
    const { resources } = await container.items.query<Notification>(querySpec).fetchAll();
    return resources;
  }

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const container = await this.initialize();
    
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      type: 'notification' as any
    };
    
    const { resource } = await container.items.create(newNotification);
    return resource as Notification;
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<Notification> {
    const container = await this.initialize();
    
    const { resource: notification } = await container
      .item(notificationId, userId)
      .read<Notification>();
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    const updatedNotification: Notification = {
      ...notification,
      read: true
    };
    
    const { resource } = await container
      .item(notificationId, userId)
      .replace<Notification>(updatedNotification);
    
    return resource as Notification;
  }
}

export const cosmosService = new CosmosService();
