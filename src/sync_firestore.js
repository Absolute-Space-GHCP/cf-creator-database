/**
 * @file sync_firestore.js
 * @version 1.0.0-clean
 * @date 2026-01-28
 * @repo ai-agents-gmaster-build
 */

/*
 * sync_firestore.js
 *
 * This is a standalone "ETL" (Extract, Transform, Load) script.
 * Its only job is to:
 * 1. EXTRACT data from the Google Sheet (Employee Directory)
 * 2. TRANSFORM it into objects
 * 3. LOAD it into our Firestore 'employees' collection.
 *
 * This script uses our "Golden Master" ADC (Application Default Credentials) fix.
 * Run it manually from your terminal with: node sync_firestore.js
 */

// 1. Load environment variables from .env file
require('dotenv').config();

// 2. Import Google Cloud libraries
const { google } = require('googleapis');
const { Firestore } = require('@google-cloud/firestore');

// 3. --- CONFIGURATION ---
// Get config from our .env file
const {
  EMPLOYEE_DIRECTORY_SHEET_ID,
  EMPLOYEE_DIRECTORY_SHEET_TAB,
  GCP_PROJECT_ID = 'jlai-gm-v3', // Default to our project ID
} = process.env;

// 4. --- AUTHENTICATION ---
// !! GOLDEN MASTER FIX !!
// We initialize all clients WITHOUT credentials.
// They will automatically find and use the local ADC.
const firestore = new Firestore({
  projectId: GCP_PROJECT_ID,
});

const sheets = google.sheets('v4');

/**
 * EXTRACT: Fetches all data from the Google Sheet.
 */
async function extractData() {
  console.log('--- Phase 1: EXTRACT ---');
  console.log(`Fetching data from Sheet ID: ${EMPLOYEE_DIRECTORY_SHEET_ID}`);

  // Authenticate for Google Sheets
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  google.options({ auth: auth });

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: EMPLOYEE_DIRECTORY_SHEET_ID,
      range: EMPLOYEE_DIRECTORY_SHEET_TAB, // Assumes tab name is correct
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('No data found in Google Sheet.');
    }

    console.log(`✅ Extracted ${rows.length} rows from Google Sheets.`);
    return rows;
  } catch (err) {
    console.error('❌ Error reading Google Sheet:', err.message);
    console.log(
      '\nTroubleshooting: \n1. Is EMPLOYEE_DIRECTORY_SHEET_ID correct in .env? \n2. Is EMPLOYEE_DIRECTORY_SHEET_TAB correct in .env? \n3. Does your gcloud user have "Viewer" access to that Google Sheet?'
    );
    return null;
  }
}

/**
 * TRANSFORM: Converts rows into clean employee objects.
 * Assumes the first row is headers (Name, Email, Title, etc.)
 */
function transformData(rows) {
  console.log('--- Phase 2: TRANSFORM ---');

  // Get headers (first row) and normalize them (lowercase, no spaces)
  const headers = rows.shift().map((h) => h.toLowerCase().replace(/ /g, '_'));
  
  // Find the index for "Name" to use as the document ID
  // This makes sure we don't create duplicates
  const nameIndex = headers.indexOf('name');
  if (nameIndex === -1) {
    console.warn('⚠️ Warning: No "Name" column found. Using auto-generated IDs.');
  }

  const employees = rows.map((row) => {
    const employee = {};
    headers.forEach((header, index) => {
      // Use the header as the key (e.g., "Name", "Title")
      // And the row cell as the value
      employee[header] = row[index];
    });
    return employee;
  });

  console.log(`✅ Transformed ${employees.length} employee records.`);
  return { employees, nameIndex };
}

/**
 * LOAD: Writes all employee objects to Firestore in a single batch.
 */
async function loadData(employees, nameIndex) {
  console.log('--- Phase 3: LOAD ---');
  console.log(`Writing ${employees.length} documents to Firestore...`);

  const collectionRef = firestore.collection('employees');
  const batch = firestore.batch();

  employees.forEach((employee) => {
    let docRef;

    // Use "Name" as the document ID if possible to prevent duplicates
    if (nameIndex !== -1 && employee.name) {
      docRef = collectionRef.doc(employee.name);
    } else {
      // Let Firestore auto-generate an ID
      docRef = collectionRef.doc();
    }

    // Add the "set" operation to the batch
    // 'merge: true' prevents overwriting fields if you only sync partial data
    batch.set(docRef, employee, { merge: true });
  });

  try {
    // Commit the batch
    await batch.commit();
    console.log('✅✅✅ SUCCESS! Firestore has been populated.');
  } catch (err) {
    console.error('❌ Error writing to Firestore:', err.message);
  }
}

/**
 * Main ETL function
 */
async function main() {
  if (
    !EMPLOYEE_DIRECTORY_SHEET_ID ||
    !EMPLOYEE_DIRECTORY_SHEET_TAB
  ) {
    console.error(
      'Error: Missing EMPLOYEE_DIRECTORY_SHEET_ID or EMPLOYEE_DIRECTORY_SHEET_TAB in .env file.'
    );
    return;
  }

  const rows = await extractData();
  if (rows) {
    const { employees, nameIndex } = transformData(rows);
    if (employees.length > 0) {
      await loadData(employees, nameIndex);
    } else {
      console.log('No employees found to load.');
    }
  }
}

// Run the script
main();