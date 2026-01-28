"""
File: test_firestore.py
Version: 1.0.0-clean
Date: 2026-01-28
Repo: ai-agents-gmaster-build

test_firestore.py

This is a minimal, local-only script to test the Google Cloud Firestore connection.
It is designed to be run with: python test_firestore.py

It validates our GCP authentication using our "Golden Master Fix" (local ADC).
"""

import os
from google.cloud import firestore

# --- CONFIGURATION ---
# This is our "Golden Master" project ID string.
PROJECT_ID = 'jlai-gm-v3'

# The collection we want to test.
# Let's assume 'employees' from our plan.
COLLECTION_NAME = 'employees'

def run_firestore_test():
    """
    Instantiates a Firestore client (using local ADC) and
    attempts to list documents from a collection.
    """
    print('--- Running Firestore Connection Test ---')
    print(f'Project: {PROJECT_ID}')
    print(f'Collection: {COLLECTION_NAME}\n')

    try:
        # 1. Instantiate the client.
        #    !! GOLDEN MASTER FIX !!
        #    We pass no credentials. The client will automatically
        #    find and use our local "Application Default Credentials" (ADC)
        #    which we created with `gcloud auth application-default login`.
        db = firestore.Client(project=PROJECT_ID)

        # 2. Define the collection reference
        collection_ref = db.collection(COLLECTION_NAME)

        # 3. Run a simple test query to get 5 documents
        print('Querying Firestore...')
        docs = collection_ref.limit(5).stream()

        results = []
        for doc in docs:
            results.append(doc.to_dict())

        print('--- SUCCESS: Received Response ---')
        if not results:
            print(f'Successfully connected, but the "{COLLECTION_NAME}" collection is empty.')
        else:
            print(f'Successfully retrieved {len(results)} documents:')
            print(results)
        
        print('\nTest complete. Firestore connection is valid.')

    except Exception as error:
        print('--- ERROR: Test Failed ---')
        print(f'An error occurred: {error}')
        print(
            '\nTroubleshooting: \n1. Did you run `gcloud auth application-default login`? \n2. Is the Firestore API enabled in GCP? \n3. Does the "employees" collection exist?'
        )

# 4. Run the main function
if __name__ == '__main__':
    run_firestore_test()