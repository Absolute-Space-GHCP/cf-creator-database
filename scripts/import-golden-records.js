#!/usr/bin/env node
/**
 * @file import-golden-records.js
 * @description Import Golden Records (benchmark creators) into Firestore
 * @author Charley Scholz, JLAI
 * @coauthor Claude Opus 4.5, Claude Code (coding assistant), Cursor (IDE)
 * @created 2026-01-28
 * @updated 2026-01-28
 */

require('dotenv').config();
const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    projectId: process.env.GCP_PROJECT_ID || 'catchfire-app-2026',
    collection: process.env.FIRESTORE_COLLECTION || 'creators'
};

// Initialize Firestore
const firestore = new Firestore({ projectId: CONFIG.projectId });

/**
 * Import Golden Records from JSON file
 */
async function importGoldenRecords() {
    console.log('🏆 Golden Records Import');
    console.log('========================');
    console.log(`Project: ${CONFIG.projectId}`);
    console.log(`Collection: ${CONFIG.collection}`);
    console.log('');
    
    // Load golden records
    const dataPath = path.join(__dirname, '../data/golden-records.json');
    if (!fs.existsSync(dataPath)) {
        console.error('❌ Golden records file not found:', dataPath);
        process.exit(1);
    }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const records = data.goldenRecords;
    
    console.log(`📦 Found ${records.length} Golden Records to import`);
    console.log('');
    
    // Check for existing records to avoid duplicates
    const existingSnapshot = await firestore
        .collection(CONFIG.collection)
        .where('matching.isGoldenRecord', '==', true)
        .get();
    
    const existingNames = new Set();
    existingSnapshot.forEach(doc => {
        const name = doc.data().name;
        if (name) existingNames.add(name.toLowerCase());
    });
    
    console.log(`📊 Found ${existingNames.size} existing Golden Records`);
    console.log('');
    
    // Import records
    const batch = firestore.batch();
    const timestamp = new Date().toISOString();
    let newCount = 0;
    let skipCount = 0;
    
    for (const record of records) {
        // Check if already exists
        if (existingNames.has(record.name.toLowerCase())) {
            console.log(`⏭️  Skipping (exists): ${record.name}`);
            skipCount++;
            continue;
        }
        
        // Add to batch
        const docRef = firestore.collection(CONFIG.collection).doc();
        batch.set(docRef, {
            ...record,
            createdAt: timestamp,
            updatedAt: timestamp
        });
        
        console.log(`✅ Adding: ${record.name} (${record.craft.primary})`);
        newCount++;
    }
    
    if (newCount > 0) {
        console.log('');
        console.log('💾 Committing batch write...');
        await batch.commit();
    }
    
    // Summary
    console.log('');
    console.log('========================');
    console.log('📊 Import Summary');
    console.log('========================');
    console.log(`✅ Imported: ${newCount}`);
    console.log(`⏭️  Skipped:  ${skipCount}`);
    console.log(`📦 Total:    ${records.length}`);
    console.log('');
    
    // Verify
    const verifySnapshot = await firestore
        .collection(CONFIG.collection)
        .where('matching.isGoldenRecord', '==', true)
        .get();
    
    console.log(`🏆 Total Golden Records in database: ${verifySnapshot.size}`);
}

// Run
importGoldenRecords()
    .then(() => {
        console.log('');
        console.log('✨ Import complete!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Import failed:', error.message);
        process.exit(1);
    });
