/**
 * Migration script: Supabase → PostgreSQL Railway
 * 
 * This script migrates operational data from Supabase to PostgreSQL Railway.
 * Authentication remains in Supabase.
 * 
 * Usage:
 *   npx tsx scripts/migrate-supabase-to-postgres.ts
 */

import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

if (!databaseUrl) {
  console.error('❌ DATABASE_URL missing. Set DATABASE_URL for PostgreSQL Railway');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const pgPool = new Pool({ connectionString: databaseUrl });

async function migrate() {
  try {
    console.log('🚀 Starting migration from Supabase to PostgreSQL...\n');

    // 1. Migrate barbearias
    console.log('📦 Migrating barbearias...');
    const { data: barbearias, error: barbError } = await supabase
      .from('barbearias')
      .select('*');

    if (barbError) throw barbError;

    for (const barb of barbearias || []) {
      await pgPool.query(
        `INSERT INTO barbearias (id, name, email, slug, plan, logo, location, phone, isOnboarded, createdAt, updatedAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
         name = $2, email = $3, slug = $4, plan = $5, logo = $6, location = $7, phone = $8, isOnboarded = $9, updatedAt = $11`,
        [barb.id, barb.name, barb.email, barb.slug, barb.plan, barb.logo, barb.location, barb.phone, barb.isOnboarded, barb.createdAt, new Date().toISOString()]
      );
    }
    console.log(`✅ Migrated ${barbearias?.length || 0} barbearias\n`);

    // 2. Migrate bookings
    console.log('📦 Migrating bookings...');
    const { data: bookings, error: bookError } = await supabase
      .from('bookings')
      .select('*');

    if (bookError) throw bookError;

    for (const booking of bookings || []) {
      await pgPool.query(
        `INSERT INTO bookings (id, barbeariaId, barberId, clientId, clientName, clientPhone, serviceId, serviceName, date, time, status, notes, createdAt, updatedAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO UPDATE SET
         status = $11, notes = $12, updatedAt = $14`,
        [booking.id, booking.barbeariaId, booking.barberId, booking.clientId, booking.clientName, booking.clientPhone, booking.serviceId, booking.serviceName, booking.date, booking.time, booking.status, booking.notes, booking.createdAt, new Date().toISOString()]
      );
    }
    console.log(`✅ Migrated ${bookings?.length || 0} bookings\n`);

    // 3. Migrate superadmin logs
    console.log('📦 Migrating superadmin logs...');
    const { data: logs, error: logError } = await supabase
      .from('superadmin_logs')
      .select('*');

    if (logError) throw logError;

    for (const log of logs || []) {
      await pgPool.query(
        `INSERT INTO superadmin_logs (id, barbeariaId, barbeariaName, action, details, performedBy, createdAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [log.id, log.barbeariaId, log.barbeariaName, log.action, JSON.stringify(log.details), log.performedBy, log.createdAt]
      );
    }
    console.log(`✅ Migrated ${logs?.length || 0} superadmin logs\n`);

    console.log('✨ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Update your code to use db-postgres.ts instead of db.ts');
    console.log('2. Test the application thoroughly');
    console.log('3. Keep Supabase for authentication');
    console.log('4. Monitor PostgreSQL performance');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pgPool.end();
  }
}

migrate();

