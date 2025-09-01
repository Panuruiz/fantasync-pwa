const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function dropPolicies() {
  try {
    console.log('Dropping character policies...');
    
    const policies = [
      'DROP POLICY IF EXISTS "characters_insert_player" ON characters;',
      'DROP POLICY IF EXISTS "characters_update_owner" ON characters;', 
      'DROP POLICY IF EXISTS "characters_delete_owner" ON characters;',
      'DROP POLICY IF EXISTS "characters_select_player" ON characters;',
      'DROP POLICY IF EXISTS "characters_select_public" ON characters;',
      'DROP POLICY IF EXISTS "characters_select_master" ON characters;',
      'DROP POLICY IF EXISTS "characters_update_master" ON characters;'
    ];
    
    for (const policy of policies) {
      console.log(`Executing: ${policy}`);
      await prisma.$executeRawUnsafe(policy);
    }
    
    console.log('Successfully dropped all character policies');
    
  } catch (error) {
    console.error('Error dropping policies:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

dropPolicies();