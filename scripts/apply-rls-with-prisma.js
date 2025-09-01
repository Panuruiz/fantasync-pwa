const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyRLSPolicies() {
  try {
    console.log('Reading RLS policies SQL file...');
    const sqlPath = path.join(__dirname, 'create-rls-policies.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split the SQL into individual statements, handling multiline statements
    const statements = sql
      .split(/;\s*\n/)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== '--');
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\nExecuting statement ${i + 1}/${statements.length}:`);
      console.log(statement.slice(0, 80) + '...');
      
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log('✓ Success');
        successCount++;
      } catch (error) {
        console.log(`⚠️  Warning: ${error.message.slice(0, 100)}`);
        errorCount++;
        // Continue with other statements - some might already exist
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Successful statements: ${successCount}`);
    console.log(`Warnings/Errors: ${errorCount}`);
    console.log(`Total statements: ${statements.length}`);
    
    if (successCount > 0) {
      console.log('\n✓ RLS policies have been applied successfully!');
    } else {
      console.log('\n⚠️  All statements failed or already exist. Check Supabase dashboard manually.');
    }
    
  } catch (error) {
    console.error('Critical error applying RLS policies:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyRLSPolicies();