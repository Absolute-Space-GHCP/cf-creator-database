/**
 * @file check_firestore.js
 * @version 1.0.0-clean
 * @date 2026-01-28
 * @repo ai-agents-gmaster-build
 */

/**
 * Quick Firestore Employee Collection Check
 */
const { Firestore } = require('@google-cloud/firestore');

async function checkEmployees() {
    console.log('🔍 Checking Firestore employees collection...\n');
    
    const db = new Firestore();
    
    try {
        // Get all employees
        const snapshot = await db.collection('employees').get();
        
        console.log('✅ Collection exists: ' + !snapshot.empty);
        console.log('📊 Total documents: ' + snapshot.size);
        
        if (snapshot.empty) {
            console.log('\n⚠️  WARNING: The employees collection is EMPTY!');
            console.log('   Employee directory searches will not work.');
            console.log('   You need to run the sync_firestore.js ETL script to populate it.');
            return;
        }
        
        // Show sample data
        console.log('\n📋 Sample employees (first 5):');
        console.log('─'.repeat(60));
        
        let count = 0;
        snapshot.forEach(doc => {
            if (count >= 5) return;
            const d = doc.data();
            console.log(`  ${count + 1}. ${d.Name || d.name || 'N/A'}`);
            console.log(`     Department: ${d.Department || d.department || 'N/A'}`);
            console.log(`     Title: ${d.Title || d.title || 'N/A'}`);
            console.log(`     Email: ${d.Email || d.email || 'N/A'}`);
            console.log('');
            count++;
        });
        
        // Show unique departments
        const departments = new Set();
        snapshot.forEach(doc => {
            const d = doc.data();
            const dept = d.Department || d.department;
            if (dept) departments.add(dept);
        });
        
        console.log('🏢 Departments found:');
        console.log('─'.repeat(60));
        [...departments].sort().forEach(d => console.log(`  • ${d}`));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('NOT_FOUND')) {
            console.log('\n⚠️  The Firestore database may not exist.');
            console.log('   Create it in GCP Console: Firestore > Create Database');
        }
    }
}

checkEmployees();

