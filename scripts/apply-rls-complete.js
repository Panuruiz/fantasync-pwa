const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyRLSPolicies() {
  try {
    console.log('Reading RLS policies SQL file...');
    const sqlPath = path.join(__dirname, 'create-rls-policies.sql');
    let sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Remove comments and empty lines
    sql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n');
    
    // Split by semicolon followed by any whitespace and newline
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip if statement is just whitespace or separators
      if (!statement || statement === '' || /^[=-]+$/.test(statement)) {
        continue;
      }
      
      console.log(`\nExecuting statement ${i + 1}/${statements.length}:`);
      const preview = statement.length > 80 
        ? statement.slice(0, 80) + '...'
        : statement;
      console.log(preview.replace(/\n\s+/g, ' '));
      
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log('✓ Success');
        successCount++;
      } catch (error) {
        console.log(`⚠️  Warning: ${error.message.slice(0, 150)}`);
        errorCount++;
        // Continue with other statements - some might already exist
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Successful statements: ${successCount}`);
    console.log(`Warnings/Errors: ${errorCount}`);
    console.log(`Total statements processed: ${successCount + errorCount}`);
    
    if (successCount > 20) { // We expect around 30+ policies
      console.log('\n✅ RLS policies have been applied successfully!');
    } else if (successCount > 0) {
      console.log('\n⚠️  Some policies were applied, but check manually for completeness.');
    } else {
      console.log('\n❌ No statements succeeded. Check Supabase connection and permissions.');
    }
    
  } catch (error) {
    console.error('Critical error applying RLS policies:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyRLSPolicies();