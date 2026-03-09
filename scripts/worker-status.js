#!/usr/bin/env node
/**
 * @file worker-status.js
 * @version 1.0.0-clean
 * @date 2026-01-28
 * @repo ai-agents-gmaster-build
 */

/**
 * Worker Status Script - AI Golden Master
 * Checks: Local process, Health endpoint, Cloud Run status, Recent logs
 * Logs results to mem for historical tracking
 */

const { execSync } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  serviceName: process.env.SERVICE_NAME || 'ai-golden-master',
  projectId: process.env.GCP_PROJECT_ID || 'YOUR_PROJECT_ID',
  region: 'us-central1',
  localPort: process.env.PORT || 8090,
  healthEndpoint: `http://localhost:${process.env.PORT || 8090}/health`,
};

const STATUS_EMOJI = {
  running: '✅',
  stopped: '❌',
  warning: '⚠️',
  unknown: '❓',
};

// Utilities
function exec(command, silent = false) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
  } catch (error) {
    return null;
  }
}

async function checkLocalProcess() {
  console.log('\n🔍 Checking Local Process...');
  try {
    // Check if port is in use
    const result = exec(`lsof -i :${CONFIG.localPort} -t`, true);
    if (result && result.trim()) {
      const pid = result.trim();
      const processInfo = exec(`ps -p ${pid} -o pid,command`, true);
      console.log(`${STATUS_EMOJI.running} Local process running`);
      console.log(`   PID: ${pid}`);
      console.log(`   Port: ${CONFIG.localPort}`);
      return { status: 'running', pid, port: CONFIG.localPort };
    } else {
      console.log(`${STATUS_EMOJI.stopped} No local process on port ${CONFIG.localPort}`);
      return { status: 'stopped', port: CONFIG.localPort };
    }
  } catch (error) {
    console.log(`${STATUS_EMOJI.warning} Error checking local process:`, error.message);
    return { status: 'error', error: error.message };
  }
}

async function checkHealthEndpoint() {
  console.log('\n🏥 Checking Health Endpoint...');

  // Try /health endpoint first, fallback to root
  const endpoints = [
    CONFIG.healthEndpoint,
    `http://localhost:${CONFIG.localPort}/`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint, { timeout: 5000 });
      console.log(`${STATUS_EMOJI.running} Service responding`);
      console.log(`   Endpoint: ${endpoint}`);
      console.log(`   Status: ${response.status}`);
      return { status: 'healthy', endpoint, statusCode: response.status };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`${STATUS_EMOJI.stopped} Service not reachable (connection refused)`);
        return { status: 'unreachable', error: 'Connection refused' };
      }
      // Try next endpoint if this one fails
      continue;
    }
  }

  console.log(`${STATUS_EMOJI.warning} No endpoints responding`);
  return { status: 'error', error: 'All endpoints failed' };
}

async function checkCloudRunStatus() {
  console.log('\n☁️  Checking Cloud Run Status...');

  if (CONFIG.projectId === 'YOUR_PROJECT_ID') {
    console.log(`${STATUS_EMOJI.warning} Cloud Run check skipped: PROJECT_ID not configured`);
    console.log('   Set GCP_PROJECT_ID environment variable to enable Cloud Run checks');
    return { status: 'not_configured' };
  }

  try {
    const result = exec(
      `gcloud run services describe ${CONFIG.serviceName} --region=${CONFIG.region} --project=${CONFIG.projectId} --format=json`,
      true
    );

    if (result) {
      const service = JSON.parse(result);
      const status = service.status?.conditions?.find(c => c.type === 'Ready');
      const url = service.status?.url;
      const latestRevision = service.status?.latestReadyRevisionName;

      if (status?.status === 'True') {
        console.log(`${STATUS_EMOJI.running} Cloud Run service is running`);
      } else {
        console.log(`${STATUS_EMOJI.warning} Cloud Run service status: ${status?.status}`);
      }

      console.log(`   URL: ${url}`);
      console.log(`   Latest Revision: ${latestRevision}`);
      console.log(`   Last Modified: ${service.metadata?.annotations?.['run.googleapis.com/lastModifier']}`);

      return {
        status: status?.status === 'True' ? 'running' : 'degraded',
        url,
        revision: latestRevision,
        conditions: service.status?.conditions,
      };
    } else {
      console.log(`${STATUS_EMOJI.stopped} Cloud Run service not found or not accessible`);
      return { status: 'not_found' };
    }
  } catch (error) {
    console.log(`${STATUS_EMOJI.warning} Error checking Cloud Run:`, error.message);
    return { status: 'error', error: error.message };
  }
}

async function getRecentLogs() {
  console.log('\n📋 Getting Recent Logs...');

  if (CONFIG.projectId === 'YOUR_PROJECT_ID') {
    console.log(`${STATUS_EMOJI.warning} Logs check skipped: PROJECT_ID not configured`);
    return { status: 'not_configured' };
  }

  try {
    const result = exec(
      `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${CONFIG.serviceName}" --limit=10 --project=${CONFIG.projectId} --format=json`,
      true
    );

    if (result) {
      const logs = JSON.parse(result);
      console.log(`${STATUS_EMOJI.running} Retrieved ${logs.length} recent log entries`);

      // Show last 5 logs
      logs.slice(0, 5).forEach((log, i) => {
        const timestamp = log.timestamp || log.receiveTimestamp;
        const message = log.textPayload || JSON.stringify(log.jsonPayload) || 'No message';
        const severity = log.severity || 'INFO';
        const messageStr = String(message);
        console.log(`   [${severity}] ${timestamp}: ${messageStr.substring(0, 100)}${messageStr.length > 100 ? '...' : ''}`);
      });

      return { status: 'success', count: logs.length, logs: logs.slice(0, 5) };
    } else {
      console.log(`${STATUS_EMOJI.warning} No logs found`);
      return { status: 'no_logs' };
    }
  } catch (error) {
    console.log(`${STATUS_EMOJI.warning} Error fetching logs:`, error.message);
    return { status: 'error', error: error.message };
  }
}

function logToFile(statusData) {
  console.log('\n💾 Logging status...');
  try {
    const logDir = path.join(__dirname, '..', 'logs');
    const logFile = path.join(logDir, 'worker-status-logs.jsonl');

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      service: CONFIG.serviceName,
      project: CONFIG.projectId,
      ...statusData,
    };

    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    console.log(`${STATUS_EMOJI.running} Status logged`);
    console.log(`   File: ${logFile}`);

    return { status: 'success', file: logFile };
  } catch (error) {
    console.log(`${STATUS_EMOJI.warning} Error logging status:`, error.message);
    return { status: 'error', error: error.message };
  }
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🤖 WORKER STATUS - ${CONFIG.serviceName}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📅 ${new Date().toLocaleString()}`);

  const statusData = {
    localProcess: await checkLocalProcess(),
    healthEndpoint: await checkHealthEndpoint(),
    cloudRun: await checkCloudRunStatus(),
    logs: await getRecentLogs(),
  };

  const memLog = logToFile(statusData);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Status check complete');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Exit with error code if critical services are down
  const isHealthy =
    (statusData.localProcess.status === 'running' || statusData.cloudRun.status === 'running');

  process.exit(isHealthy ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
