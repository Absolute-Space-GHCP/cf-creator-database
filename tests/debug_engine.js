/**
 * @file debug_engine.js
 * @version 1.0.0-clean
 * @date 2026-01-28
 * @repo ai-agents-gmaster-build
 */

const { EngineServiceClient } = require('@google-cloud/discoveryengine').v1beta;

const PROJECT_ID = 'jlai-gm-v3';
const LOCATION = 'global';
const COLLECTION = 'default_collection';

async function listEngines() {
  console.log('🕵️ DIAGNOSTIC: Listing Engines...');
  const client = new EngineServiceClient();
  const parent = `projects/${PROJECT_ID}/locations/${LOCATION}/collections/${COLLECTION}`;

  try {
    const [engines] = await client.listEngines({ parent });
    
    if (engines.length === 0) {
      console.log('⚠️  No Engines found. API is not seeing the App yet.');
    } else {
      console.log(`✅ Found ${engines.length} Engine(s):`);
      engines.forEach(engine => {
        console.log('\n------------------------------------------------');
        console.log(`NAME: ${engine.displayName}`);
        console.log(`ID:   ${engine.name.split('/').pop()}`);
        console.log(`FULL PATH: ${engine.name}`);
        console.log('------------------------------------------------');
      });
    }
  } catch (error) {
    console.error('❌ ERROR LISTING ENGINES:', error.message);
  }
}

listEngines();
