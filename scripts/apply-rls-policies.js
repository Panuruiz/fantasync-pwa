const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyPolicies() {
  try {
    console.log('Reading RLS policies SQL file...');
    const sqlPath = path.join(__dirname, 'create-rls-policies.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' }).single();
        
        if (error) {
          // Try direct execution if RPC fails
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ sql: statement + ';' })
          });
          
          if (!response.ok) {
            console.warn(`Warning: ${statement.substring(0, 30)}... - May already exist or requires manual application`);
            errorCount++;
          } else {
            console.log(`✓ Success`);
            successCount++;
          }
        } else {
          console.log(`✓ Success`);
          successCount++;
        }
      } catch (err) {
        console.warn(`Warning: ${statement.substring(0, 30)}... - ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n=== Summary ===`);
    console.log(`Successful statements: ${successCount}`);
    console.log(`Warnings/Errors: ${errorCount}`);
    console.log(`\nNote: Some policies may already exist. You can apply them manually via Supabase dashboard.`);
    
  } catch (error) {
    console.error('Error applying policies:', error);
    process.exit(1);
  }
}

applyPolicies();