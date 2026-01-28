/**
 * @file test_vertex.js
 * @version 1.0.0-clean
 * @date 2026-01-28
 * @repo ai-agents-gmaster-build
 */

const { SearchServiceClient } = require('@google-cloud/discoveryengine').v1beta;

const PROJECT_ID = 'jlai-gm-v3';
const LOCATION = 'global';
const COLLECTION = 'default_collection';
const APP_ID = 'jlai-gm-v3-search_1764017119434'; // The Verified ID
const SERVING_CONFIG_ID = 'default_search';
const QUERY = "What is the holiday schedule?";

async function runTest() {
  console.log('🧪 TESTING BRAIN CONNECTION...');
  console.log('   Target App: ' + APP_ID);
  
  const client = new SearchServiceClient();
  const servingConfig = client.projectLocationCollectionEngineServingConfigPath(
    PROJECT_ID,
    LOCATION,
    COLLECTION,
    APP_ID,
    SERVING_CONFIG_ID
  );

  const request = {
    servingConfig: servingConfig,
    query: QUERY,
    pageSize: 3,
    contentSearchSpec: {
      summarySpec: {
        summaryResultCount: 3,
        includeCitations: true,
        modelPromptSpec: { prompt: "Summarize the answer." }
      }
    }
  };

  try {
    console.log("🚀 Sending Query...");
    const [response] = await client.search(request);
    
    if (response.summary && response.summary.summaryText) {
      console.log("\n✅ SUCCESS: RECEIVED AI SUMMARY");
      console.log("------------------------------------------------");
      console.log(response.summary.summaryText);
      console.log("------------------------------------------------");
    } else {
      console.log("\n⚠️ CONNECTED (200 OK). Index is likely still processing.");
    }
  } catch (error) {
    console.error("\n❌ FAILURE: CONNECTION REFUSED");
    console.error(error.message);
  }
}

runTest();
