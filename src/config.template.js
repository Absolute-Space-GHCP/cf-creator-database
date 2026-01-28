/**
 * @file config.template.js
 * @version 1.0.0-clean
 * @date 2026-01-28
 * @repo ai-agents-gmaster-build
 */

/**
 * AI Golden Master - Configuration Template
 * 
 * INSTRUCTIONS:
 * 1. Copy this file to `config.js` in the same directory
 * 2. Replace all placeholder values with your own configuration
 * 3. Deploy to Cloud Run
 * 
 * DO NOT commit config.js to version control (add to .gitignore)
 */

module.exports = {
    // ==========================================================================
    // BOT IDENTITY
    // ==========================================================================
    botName: 'Your Bot Name',           // e.g., 'BA Reconcile', 'Invoice Bot'
    botVersion: '1.0.0',
    botDescription: 'AI-powered assistant for your organization',
    
    // URLs for the "about me" response
    documentsUrl: '/documents',         // Your documents page
    directoryUrl: '/directory',         // Your directory page (or null if not using)
    
    // ==========================================================================
    // GCP CONFIGURATION
    // ==========================================================================
    gcp: {
        projectId: 'your-gcp-project',          // Your GCP project ID
        location: 'us-central1',                 // Cloud Run region
        gcsBucket: 'your-gcs-bucket',           // GCS bucket with PDFs
    },
    
    // ==========================================================================
    // DOCUMENT CATALOG
    // Maps keywords to PDF document paths in your GCS bucket
    // Format: 'keyword': ['path/to/document.pdf']
    // ==========================================================================
    documentCatalog: {
        // EXAMPLES - Replace with your own:
        // 'benefits': ['01_Benefits/Benefits_Guide.pdf'],
        // 'vacation': ['02_Leave/PTO_Policy.pdf'],
        // 'holiday': ['03_Time_Off/Holiday_Schedule.pdf'],
        
        // Add your keyword mappings here:
    },
    
    // ==========================================================================
    // ALL PDFs
    // Complete list of all PDF paths in your GCS bucket
    // ==========================================================================
    allPdfs: [
        // EXAMPLES - Replace with your own:
        // '01_Benefits/Benefits_Guide.pdf',
        // '02_Leave/PTO_Policy.pdf',
        // '03_Time_Off/Holiday_Schedule.pdf',
        
        // Add all your PDF paths here:
    ],
    
    // ==========================================================================
    // PROCESS MAPPINGS
    // Regex patterns for mid-process/life-event queries
    // Format: 'regex_pattern': ['path/to/document.pdf']
    // ==========================================================================
    processMappings: {
        // EXAMPLES - Replace with your own:
        // 'baby|newborn|child': ['01_Benefits/Benefits_Guide.pdf'],
        // 'enrollment|sign.?up': ['01_Benefits/Enrollment_Guide.pdf'],
        
        // Add your process mappings here:
    },
    
    // ==========================================================================
    // DOCUMENT INFO
    // Display names and URL slugs for documents
    // Format: 'filename.pdf': { name: 'Display Name', slug: 'url-slug' }
    // ==========================================================================
    documentInfo: {
        // EXAMPLES - Replace with your own:
        // 'Benefits_Guide.pdf': { name: 'Benefits Guide', slug: 'benefits' },
        // 'PTO_Policy.pdf': { name: 'PTO Policy', slug: 'pto' },
        
        // Add your document info here:
    },
    
    // ==========================================================================
    // SENSITIVE QUERY PATTERNS (Optional)
    // Patterns that should redirect users to DM for privacy
    // ==========================================================================
    sensitivePatterns: [
        // EXAMPLES:
        // /my salary/i,
        // /my benefits cost/i,
        // /my medical/i,
    ],
    
    // ==========================================================================
    // EAP/MENTAL HEALTH KEYWORDS (Optional)
    // Keywords that trigger supportive responses with DM suggestion
    // ==========================================================================
    eapKeywords: [
        // EXAMPLES:
        // 'counseling',
        // 'mental health',
        // 'therapist',
        // 'stress',
    ],
    
    // ==========================================================================
    // FEATURE FLAGS
    // Enable/disable optional features
    // ==========================================================================
    features: {
        employeeDirectory: false,       // Set true if using Firestore employee data
        yearAwareRouting: false,        // Set true if you have multi-year documents
        sensitiveQueryRedirect: false,  // Set true to redirect personal queries to DM
        eapDmSuggestion: false,         // Set true to suggest DM for mental health queries
        analytics: true,                // Usage analytics (recommended)
    },
    
    // ==========================================================================
    // EMPLOYEE DIRECTORY CONFIG (if features.employeeDirectory = true)
    // ==========================================================================
    employeeDirectory: {
        firestoreCollection: 'employees',
        slideDeckUrl: null,             // Google Slides URL for employee profiles
        // Department mappings for search aliases
        departmentAliases: {
            // 'tech': 'Technology',
            // 'hr': 'Human Resources',
        },
    },
    
    // ==========================================================================
    // YEAR-AWARE CONFIG (if features.yearAwareRouting = true)
    // ==========================================================================
    yearAware: {
        years: [2025, 2026],            // Years to support
        defaultYear: 'both',            // 'both' or specific year
    },
};

