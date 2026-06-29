import { Pool, QueryResult } from 'pg';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getClient() {
  return pool.connect();
}

export async function closePool() {
  await pool.end();
}

// Initialize database schema
export async function initializeDatabase() {
  try {
    // Create barbearias table
    await query(`
      CREATE TABLE IF NOT EXISTS barbearias (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        plan TEXT NOT NULL,
        logo TEXT,
        location VARCHAR(255),
        phone VARCHAR(20),
        isOnboarded BOOLEAN DEFAULT false,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create bookings table
    await query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        barbeariaId UUID NOT NULL REFERENCES barbearias(id) ON DELETE CASCADE,
        barberId VARCHAR(255) NOT NULL,
        clientId VARCHAR(255),
        clientName VARCHAR(255),
        clientPhone VARCHAR(20),
        serviceId VARCHAR(255) NOT NULL,
        serviceName VARCHAR(255),
        date DATE NOT NULL,
        time TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'Livre',
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(barbeariaId, barberId, date, time)
      );
    `);

    // Create barbers table
    await query(`
      CREATE TABLE IF NOT EXISTS barbers (
        id VARCHAR(255) PRIMARY KEY,
        barbeariaId UUID NOT NULL REFERENCES barbearias(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(255),
        avatar TEXT,
        rating DECIMAL(3,1),
        reviews INTEGER DEFAULT 0,
        specialties TEXT,
        assignedServices TEXT,
        workingHours JSONB,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create services table
    await query(`
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(255) PRIMARY KEY,
        barbeariaId UUID NOT NULL REFERENCES barbearias(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        duration INTEGER NOT NULL,
        category VARCHAR(100),
        description TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create inventory table
    await query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id VARCHAR(255) PRIMARY KEY,
        barbeariaId UUID NOT NULL REFERENCES barbearias(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        stock INTEGER NOT NULL,
        minStock INTEGER,
        unit VARCHAR(50),
        costPrice DECIMAL(10,2),
        lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create clients table
    await query(`
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(255) PRIMARY KEY,
        barbeariaId UUID NOT NULL REFERENCES barbearias(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create superadmin_logs table
    await query(`
      CREATE TABLE IF NOT EXISTS superadmin_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        barbeariaId UUID REFERENCES barbearias(id) ON DELETE SET NULL,
        barbeariaName VARCHAR(255),
        action VARCHAR(255) NOT NULL,
        details JSONB,
        performedBy VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await query(`CREATE INDEX IF NOT EXISTS idx_bookings_barbeariaId ON bookings(barbeariaId);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_barbers_barbeariaId ON barbers(barbeariaId);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_services_barbeariaId ON services(barbeariaId);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_inventory_barbeariaId ON inventory(barbeariaId);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_clients_barbeariaId ON clients(barbeariaId);`);

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

