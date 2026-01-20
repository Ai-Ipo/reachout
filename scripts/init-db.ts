import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function initDatabase() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('❌ Error: DATABASE_URL not found in .env.local');
        console.log('👉 Please add your Supabase Transactional connection string to .env.local');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }, // Required for Supabase
    });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected.');

        const schemaPath = path.join(__dirname, '../supabase/schema.sql');
        console.log(`📄 Reading schema from ${schemaPath}...`);
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('🚀 Executing schema...');
        // Split by statement if needed, or run as invalid block if pg driver supports it.
        // pg driver query can handle multiple statements.
        await client.query(schemaSql);

        console.log('✅ Database initialized successfully!');
    } catch (err) {
        console.error('❌ Failed to initialize database:', err);
    } finally {
        await client.end();
    }
}

initDatabase();
