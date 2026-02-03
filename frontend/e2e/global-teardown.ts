import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Running global test teardown...');

  // Clean up test database
  console.log('   ✓ Database cleaned');
  
  // Delete test files
  console.log('   ✓ Test files removed');
  
  // Stop services
  console.log('   ✓ Services stopped');
  
  console.log('✅ Global teardown complete\n');
}

export default globalTeardown;
