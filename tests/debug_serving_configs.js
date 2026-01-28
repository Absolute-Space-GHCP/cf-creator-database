/**
 * @file debug_serving_configs.js
 * @version 1.0.0-clean
 * @date 2026-01-28
 * @repo ai-agents-gmaster-build
 */

const { ServingConfigServiceClient } = require('@google-cloud/discoveryengine').v1beta;

const PROJECT_ID = 'jlai-gm-v3';
const LOCATION = 'global';
const COLLECTION = 'default_collection';
const ENGINE_ID = 'jlai-gm-v3-search_1764017119434'; // Verified from debug_engine.js

async function listConfigs() {
  console.log('🕵️ DIAGNOSTIC: Listing Serving Configs...');
  const client = new ServingConfigServiceClient();
  const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/collections/${COLLECTION}/engines/${ENGINE_ID}`;

  try {
    const [configs] = await client.listServingConfigs({ parent });
    
    if (configs.length === 0) {
      console.log('⚠️  No Serving Configs found (This would cause the error).');
    } else {
      console.log(`✅ Found ${configs.length} Config(s):`);
      configs.forEach(config => {
        console.log('\n------------------------------------------------');
        console.log(`NAME: ${config.displayName}`);
        console.log(`ID:   ${config.name.split('/').pop()}`); // <--- THIS is what we need
        console.log(`FULL: ${config.name}`);
        console.log('------------------------------------------------');
      });
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

listConfigs();
