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

  // In-memory fallback for local development when Cosmos is not configured
  private useInMemory = false;
  private memoryResources: Array<Activity | UserCounter | Notification> = [];

  constructor() {
    this.databaseId = process.env.COSMOS_DATABASE_NAME || 'ARiffInReact';
    this.containerId = process.env.COSMOS_CONTAINER_ID || 'activities';

    // Decide whether to use in-memory fallback
    const endpoint = process.env.COSMOS_ENDPOINT || '';
    const key = process.env.COSMOS_KEY || '';

    if (process.env.NODE_ENV !== 'production' && (!endpoint || !key)) {
      this.useInMemory = true;
      console.warn('CosmosService: using in-memory fallback (COSMOS_ENDPOINT or COSMOS_KEY missing)');
    }

    // Also if in production but endpoint missing, avoid throwing later
    if (process.env.NODE_ENV === 'production' && !endpoint) {
      this.useInMemory = true;
      console.warn('CosmosService: running in production but COSMOS_ENDPOINT missing — using in-memory fallback');
    }
  }

  private async initialize(): Promise<Container> {
    // If already decided to use in-memory, return a dummy container value.
    if (this.useInMemory) {
      return this.container as unknown as Container;
    }

    if (this.container) return this.container;

    try {
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

      return this.container;
    } catch (err: any) {
      // If any error occurs during initialization, fall back to in-memory mode
      console.error('CosmosService initialization failed, falling back to in-memory. Error:', err?.stack || err);
      this.useInMemory = true;
      // Ensure memoryResources exists and return a dummy container
      this.memoryResources = this.memoryResources || [];
      return this.container as unknown as Container;
    }
  }

  // ============================================================================
  // ACTIVITIES
  // ============================================================================

  async getActivities(userId?: string): Promise<Activity[]> {
    if (this.useInMemory) {
      const filtered = this.memoryResources
        .filter((r: any) => r.type !== 'user_counter' && r.type !== 'notification')
        .filter((r: any) => (userId ? r.userId === userId : true))
        .sort((a: any, b: any) => (b.timestamp || '').localeCompare(a.timestamp || '')) as Activity[];
      return filtered as Activity[];
    }

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
    if (this.useInMemory) {
      return (this.memoryResources
        .filter((r: any) => r.type !== 'user_counter' && r.type !== 'notification')
        .sort((a: any, b: any) => (b.timestamp || '').localeCompare(a.timestamp || '')) as Activity[])
        .slice(0, limit);
    }

    const container = await this.initialize();

    const querySpec: SqlQuerySpec = {
      query: `SELECT * FROM c WHERE c.type != "user_counter" AND c.type != "notification" ORDER BY c.timestamp DESC OFFSET 0 LIMIT ${limit}`
    };

    const { resources } = await container.items.query<Activity>(querySpec).fetchAll();
    return resources;
  }

  async createActivity(activity: Activity): Promise<Activity> {
    if (this.useInMemory) {
      const newActivity: Activity = {
        ...activity,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      };
      this.memoryResources.push(newActivity as any);
      return newActivity;
    }

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
    if (this.useInMemory) {
      const found = this.memoryResources.find((r: any) => r.type === 'user_counter' && r.id === userId) as UserCounter | undefined;
      if (found) return found;
      return this.createUserCounter(userId);
    }

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
    if (this.useInMemory) {
      const counter: UserCounter = {
        id: userId,
        userId,
        count: 0,
        lastUpdated: new Date().toISOString(),
        type: 'user_counter'
      };
      this.memoryResources.push(counter as any);
      return counter;
    }

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
    if (this.useInMemory) {
      let current = this.memoryResources.find((r: any) => r.type === 'user_counter' && r.id === userId) as UserCounter | undefined;
      if (!current) {
        current = await this.createUserCounter(userId);
      }
      const updatedCounter: UserCounter = {
        ...current,
        count: current.count + amount,
        lastUpdated: new Date().toISOString()
      };
      // replace
      this.memoryResources = this.memoryResources.map((r: any) => (r.type === 'user_counter' && r.id === userId ? updatedCounter as any : r));
      return updatedCounter;
    }

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
    if (this.useInMemory) {
      const resetCounter: UserCounter = {
        id: userId,
        userId,
        count: 0,
        lastUpdated: new Date().toISOString(),
        type: 'user_counter'
      };
      this.memoryResources = this.memoryResources.map((r: any) => (r.type === 'user_counter' && r.id === userId ? resetCounter as any : r));
      // If not present, add
      if (!this.memoryResources.find((r: any) => r.type === 'user_counter' && r.id === userId)) {
        this.memoryResources.push(resetCounter as any);
      }
      return resetCounter;
    }

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
    if (this.useInMemory) {
      const q = this.memoryResources.filter((r: any) => r.type === 'notification' && r.userId === userId) as Notification[];
      const filtered = unreadOnly ? q.filter(n => !n.read) : q;
      return filtered.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
    }

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
    if (this.useInMemory) {
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        type: 'notification' as any
      };
      this.memoryResources.push(newNotification as any);
      return newNotification;
    }

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
    if (this.useInMemory) {
      const idx = this.memoryResources.findIndex((r: any) => r.type === 'notification' && r.id === notificationId && r.userId === userId);
      if (idx === -1) throw new Error('Notification not found');
      const notification = this.memoryResources[idx] as Notification;
      const updatedNotification: Notification = { ...notification, read: true };
      this.memoryResources[idx] = updatedNotification as any;
      return updatedNotification;
    }

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
