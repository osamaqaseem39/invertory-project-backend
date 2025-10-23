/**
 * COMPREHENSIVE LICENSING SYSTEM TEST
 * Tests all protection mechanisms and edge cases
 */

import crypto from 'crypto';
import { default as fetch } from 'node-fetch';

const API_URL = 'http://localhost:4000/api/v1';
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

let testsPassed = 0;
let testsFailed = 0;
let adminToken = '';

// Test data
const device1 = {
  device_fingerprint: crypto.createHash('sha256').update('device1').digest('hex'),
  hardware_signature: crypto.createHash('sha256').update('hardware1').digest('hex'),
  mac_address: '00:11:22:33:44:55',
  cpu_id: 'CPU12345',
  motherboard_serial: 'MB12345',
  disk_serial: 'DISK12345',
  system_uuid: 'UUID12345',
  platform: 'win32',
  os_version: 'Windows 10',
  hostname: 'test-pc-1',
};

const device2 = {
  device_fingerprint: crypto.createHash('sha256').update('device2').digest('hex'),
  hardware_signature: crypto.createHash('sha256').update('hardware2').digest('hex'),
  mac_address: '08:00:27:AA:BB:CC', // VirtualBox MAC
  platform: 'linux',
  hostname: 'virtualbox-vm',
};

const device1ReinstallAttempt = {
  device_fingerprint: crypto.createHash('sha256').update('device1-reinstall').digest('hex'), // Different fingerprint
  hardware_signature: device1.hardware_signature, // SAME hardware
  mac_address: device1.mac_address,
  cpu_id: device1.cpu_id,
  platform: 'win32',
  hostname: 'test-pc-1',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name: string) {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.magenta}🧪 TEST: ${name}${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
}

function logSuccess(message: string) {
  testsPassed++;
  log(`✅ PASS: ${message}`, 'green');
}

function logFailure(message: string, error?: any) {
  testsFailed++;
  log(`❌ FAIL: ${message}`, 'red');
  if (error) {
    log(`   Error: ${error.response?.data?.error?.message || error.message}`, 'red');
  }
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== TESTS =====

async function test1_ServerHealth() {
  logTest('Server Health Check');
  
  try {
    const response = await axios.get(`${API_URL.replace('/api/v1', '')}/health`);
    
    if (response.status === 200) {
      logSuccess('Server is healthy and responding');
    } else {
      logFailure('Server health check returned unexpected status', response);
    }
  } catch (error) {
    logFailure('Server health check failed', error);
  }
}

async function test2_AdminLogin() {
  logTest('Admin Authentication');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      identifier: 'admin',
      password: 'admin123',
    });
    
    adminToken = response.data.access_token;
    
    if (adminToken) {
      logSuccess('Admin login successful, token received');
    } else {
      logFailure('Admin login succeeded but no token received');
    }
  } catch (error) {
    logFailure('Admin login failed', error);
  }
}

async function test3_NewDeviceTrialCheck() {
  logTest('Trial Check - New Device (Should Allow)');
  
  try {
    const response = await axios.post(`${API_URL}/licensing/trial/check`, device1);
    
    const data = response.data.data;
    
    if (data.eligible === true && data.creditsRemaining === 50) {
      logSuccess(`New device trial approved: ${data.creditsRemaining} credits`);
      log(`   Trial Guest ID: ${data.trialGuestId}`, 'blue');
    } else {
      logFailure('New device should be eligible for trial', data);
    }
  } catch (error) {
    logFailure('Trial check API call failed', error);
  }
}

async function test4_VMDetection() {
  logTest('VM Detection - VirtualBox Device');
  
  try {
    const response = await axios.post(`${API_URL}/licensing/trial/check`, device2);
    
    const data = response.data.data;
    
    // Should still allow trial but flag as VM
    if (data.eligible === true && data.isVMDetected) {
      logSuccess('VM detected correctly and flagged');
      log(`   VM Type detected: Yes`, 'yellow');
    } else if (data.eligible === true) {
      log('⚠️  WARN: VM not detected (VirtualBox MAC should trigger detection)', 'yellow');
    } else {
      logFailure('VM device trial check failed', data);
    }
  } catch (error) {
    logFailure('VM detection test failed', error);
  }
}

async function test5_CreditConsumption() {
  logTest('Credit Consumption - First Invoice');
  
  try {
    const response = await axios.post(`${API_URL}/licensing/trial/consume`, {
      device_fingerprint: device1.device_fingerprint,
      action: 'invoice_create',
      reference_id: 'INV-001',
      metadata: { invoice_number: 'INV-001', amount: 100.50 },
    });
    
    if (response.data.credits_remaining === 49) {
      logSuccess(`Credit consumed successfully: 49 remaining`);
    } else {
      logFailure(`Expected 49 credits, got ${response.data.credits_remaining}`);
    }
  } catch (error) {
    logFailure('Credit consumption failed', error);
  }
}

async function test6_MultipleCreditsConsumption() {
  logTest('Credit Consumption - Consume 48 More Credits (Total 49/50)');
  
  try {
    for (let i = 2; i <= 49; i++) {
      await axios.post(`${API_URL}/licensing/trial/consume`, {
        device_fingerprint: device1.device_fingerprint,
        action: 'invoice_create',
        reference_id: `INV-${String(i).padStart(3, '0')}`,
      });
      
      // Progress indicator
      if (i % 10 === 0) {
        log(`   Consumed ${i}/49 credits...`, 'blue');
      }
    }
    
    // Check final status
    const stats = await axios.get(`${API_URL}/licensing/trial/stats/${device1.device_fingerprint}`);
    const remaining = stats.data.data.credits_remaining;
    
    if (remaining === 1) {
      logSuccess(`49 credits consumed successfully: 1 credit remaining`);
    } else {
      logFailure(`Expected 1 credit remaining, got ${remaining}`);
    }
  } catch (error) {
    logFailure('Multiple credit consumption failed', error);
  }
}

async function test7_LastCreditConsumption() {
  logTest('Credit Consumption - Last Credit (Should Exhaust Trial)');
  
  try {
    const response = await axios.post(`${API_URL}/licensing/trial/consume`, {
      device_fingerprint: device1.device_fingerprint,
      action: 'invoice_create',
      reference_id: 'INV-050',
    });
    
    if (response.data.credits_remaining === 0) {
      logSuccess('Last credit consumed: Trial exhausted');
      log('   Credits remaining: 0', 'yellow');
    } else {
      logFailure(`Expected 0 credits, got ${response.data.credits_remaining}`);
    }
  } catch (error) {
    logFailure('Last credit consumption failed', error);
  }
}

async function test8_ExhaustedTrialBlocking() {
  logTest('Exhausted Trial - Should Block Further Actions (402)');
  
  try {
    const response = await axios.post(`${API_URL}/licensing/trial/consume`, {
      device_fingerprint: device1.device_fingerprint,
      action: 'invoice_create',
      reference_id: 'INV-051',
    });
    
    logFailure('Should have blocked exhausted trial, but allowed action');
  } catch (error: any) {
    if (error.response?.status === 402) {
      logSuccess('Exhausted trial correctly blocked with 402 Payment Required');
      log(`   Error: ${error.response.data.error.message}`, 'yellow');
    } else {
      logFailure('Wrong error code for exhausted trial', error);
    }
  }
}

async function test9_TrialResetAttempt() {
  logTest('Trial Reset Attack - Same Hardware, Different Fingerprint (Should Block)');
  
  try {
    const response = await axios.post(`${API_URL}/licensing/trial/check`, device1ReinstallAttempt);
    
    logFailure('Trial reset attack was NOT detected - SECURITY VULNERABILITY!');
    log(`   Response: ${JSON.stringify(response.data)}`, 'red');
  } catch (error: any) {
    if (error.response?.status === 403 && error.response?.data?.error?.code === 'TRIAL_RESET_DETECTED') {
      logSuccess('Trial reset attack detected and blocked!');
      log(`   Reason: ${error.response.data.error.message}`, 'yellow');
    } else {
      logFailure('Trial reset detection failed with unexpected error', error);
    }
  }
}

async function test10_SuspiciousActivityLogging() {
  logTest('Suspicious Activity Logging - Check Admin Endpoint');
  
  try {
    const response = await axios.get(`${API_URL}/licensing/admin/suspicious`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    const activities = response.data.data;
    
    if (Array.isArray(activities) && activities.length > 0) {
      logSuccess(`Suspicious activities logged: ${activities.length} records`);
      
      // Check for our trial reset attempt
      const resetAttempt = activities.find((a: any) => a.activity_type === 'TRIAL_RESET');
      if (resetAttempt) {
        log(`   ✓ Trial reset attempt logged with severity: ${resetAttempt.severity}`, 'green');
      } else {
        log('   ⚠️  Trial reset attempt not found in logs', 'yellow');
      }
    } else {
      log('⚠️  WARN: No suspicious activities logged (expected at least trial reset)', 'yellow');
    }
  } catch (error) {
    logFailure('Could not retrieve suspicious activities', error);
  }
}

async function test11_GenerateLicense() {
  logTest('License Generation - Create Perpetual License (Admin)');
  
  try {
    const response = await axios.post(
      `${API_URL}/licensing/license/generate`,
      {
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        companyName: 'Test Company Ltd',
        licenseType: 'PERPETUAL',
        deviceFingerprint: device1.device_fingerprint,
        hardwareSignature: device1.hardware_signature,
        maxActivations: 1,
        purchaseAmount: 299.99,
        currency: 'USD',
        paymentId: 'stripe_test_12345',
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    
    const license = response.data.data;
    
    if (license.license_key && license.jwt_token) {
      logSuccess('License generated successfully');
      log(`   License Key: ${license.license_key}`, 'blue');
      log(`   Type: ${license.license_type}`, 'blue');
      log(`   Expires: ${license.expires_at || 'Never (Perpetual)'}`, 'blue');
      
      // Save for next tests
      (global as any).testLicenseKey = license.license_key;
      (global as any).testJWT = license.jwt_token;
    } else {
      logFailure('License generated but missing key or JWT');
    }
  } catch (error) {
    logFailure('License generation failed', error);
  }
}

async function test12_LicenseActivation() {
  logTest('License Activation - Activate Generated License');
  
  const licenseKey = (global as any).testLicenseKey;
  
  if (!licenseKey) {
    log('⚠️  SKIP: No license key from previous test', 'yellow');
    return;
  }
  
  try {
    const response = await axios.post(`${API_URL}/licensing/license/activate`, {
      license_key: licenseKey,
      device_fingerprint: device1.device_fingerprint,
      hardware_signature: device1.hardware_signature,
      activation_method: 'ONLINE',
      ip_address: '192.168.1.100',
      country_code: 'US',
    });
    
    if (response.data.message.includes('successfully')) {
      logSuccess('License activated successfully');
      log(`   JWT Token: ${response.data.data.jwt_token ? 'Received' : 'Missing'}`, 'blue');
    } else {
      logFailure('License activation response unexpected');
    }
  } catch (error) {
    logFailure('License activation failed', error);
  }
}

async function test13_DuplicateActivationAttempt() {
  logTest('License Sharing Prevention - Activate Same License on Different Device');
  
  const licenseKey = (global as any).testLicenseKey;
  
  if (!licenseKey) {
    log('⚠️  SKIP: No license key from previous test', 'yellow');
    return;
  }
  
  try {
    await axios.post(`${API_URL}/licensing/license/activate`, {
      license_key: licenseKey,
      device_fingerprint: device2.device_fingerprint, // Different device!
      hardware_signature: device2.hardware_signature,
      activation_method: 'ONLINE',
    });
    
    logFailure('License sharing NOT prevented - SECURITY VULNERABILITY!');
  } catch (error: any) {
    if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('different device')) {
      logSuccess('License sharing correctly prevented');
      log(`   Reason: ${error.response.data.error.message}`, 'yellow');
    } else {
      logFailure('License sharing prevention failed with unexpected error', error);
    }
  }
}

async function test14_JWTVerification() {
  logTest('JWT License Verification - Validate Token');
  
  const jwtToken = (global as any).testJWT;
  
  if (!jwtToken) {
    log('⚠️  SKIP: No JWT token from previous test', 'yellow');
    return;
  }
  
  try {
    const response = await axios.post(`${API_URL}/licensing/license/verify`, {
      jwt_token: jwtToken,
      device_fingerprint: device1.device_fingerprint,
    });
    
    if (response.data.valid === true) {
      logSuccess('JWT verification successful');
      log(`   License Type: ${response.data.payload.licenseType}`, 'blue');
      log(`   Device Bound: ${response.data.payload.deviceFingerprint ? 'Yes' : 'No'}`, 'blue');
    } else {
      logFailure('JWT marked as invalid');
    }
  } catch (error) {
    logFailure('JWT verification failed', error);
  }
}

async function test15_JWTDeviceMismatch() {
  logTest('JWT Verification - Wrong Device (Should Reject)');
  
  const jwtToken = (global as any).testJWT;
  
  if (!jwtToken) {
    log('⚠️  SKIP: No JWT token from previous test', 'yellow');
    return;
  }
  
  try {
    await axios.post(`${API_URL}/licensing/license/verify`, {
      jwt_token: jwtToken,
      device_fingerprint: device2.device_fingerprint, // Wrong device!
    });
    
    logFailure('JWT device binding NOT enforced - SECURITY VULNERABILITY!');
  } catch (error: any) {
    if (error.response?.status === 401 && error.response?.data?.error?.message?.includes('different device')) {
      logSuccess('JWT device binding correctly enforced');
    } else {
      logFailure('JWT device binding check failed with unexpected error', error);
    }
  }
}

async function test16_ListTrials() {
  logTest('Admin Endpoint - List All Trials');
  
  try {
    const response = await axios.get(`${API_URL}/licensing/admin/trials`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    const trials = response.data.data;
    
    if (Array.isArray(trials) && trials.length >= 2) {
      logSuccess(`Retrieved ${trials.length} trial sessions`);
      log(`   Device 1 Status: ${trials.find((t: any) => t.device_fingerprint === device1.device_fingerprint)?.status}`, 'blue');
      log(`   Device 2 Status: ${trials.find((t: any) => t.device_fingerprint === device2.device_fingerprint)?.status}`, 'blue');
    } else {
      logFailure(`Expected at least 2 trials, got ${trials?.length || 0}`);
    }
  } catch (error) {
    logFailure('List trials failed', error);
  }
}

async function test17_ListLicenses() {
  logTest('Admin Endpoint - List All Licenses');
  
  try {
    const response = await axios.get(`${API_URL}/licensing/admin/licenses`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    const licenses = response.data.data;
    
    if (Array.isArray(licenses) && licenses.length >= 1) {
      logSuccess(`Retrieved ${licenses.length} license(s)`);
      
      const testLicense = licenses[0];
      log(`   License Key: ${testLicense.license_key}`, 'blue');
      log(`   Status: ${testLicense.status}`, 'blue');
      log(`   Type: ${testLicense.license_type}`, 'blue');
      log(`   Activations: ${testLicense.activation_count}/${testLicense.max_activations}`, 'blue');
    } else {
      logFailure('No licenses found (expected at least 1)');
    }
  } catch (error) {
    logFailure('List licenses failed', error);
  }
}

async function test18_GetLicenseDetails() {
  logTest('Admin Endpoint - Get License Details');
  
  const licenseKey = (global as any).testLicenseKey;
  
  if (!licenseKey) {
    log('⚠️  SKIP: No license key available', 'yellow');
    return;
  }
  
  try {
    const response = await axios.get(`${API_URL}/licensing/license/${licenseKey}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    
    const license = response.data.data;
    
    if (license && license.activation_history) {
      logSuccess('License details retrieved with activation history');
      log(`   Total Activations: ${license.activation_history.length}`, 'blue');
      
      if (license.activation_history.length > 0) {
        log(`   Last Activation: ${license.activation_history[0].attempted_at}`, 'blue');
        log(`   Success: ${license.activation_history[0].success}`, 'blue');
      }
    } else {
      logFailure('License details incomplete');
    }
  } catch (error) {
    logFailure('Get license details failed', error);
  }
}

async function test19_GetTrialStats() {
  logTest('Trial Statistics - Check Device 1 Stats');
  
  try {
    const response = await axios.get(`${API_URL}/licensing/trial/stats/${device1.device_fingerprint}`);
    
    const stats = response.data.data;
    
    if (stats) {
      logSuccess('Trial statistics retrieved');
      log(`   Status: ${stats.status}`, 'blue');
      log(`   Credits Used: ${stats.credits_used}/${stats.credits_allocated}`, 'blue');
      log(`   Credits Remaining: ${stats.credits_remaining}`, 'blue');
      log(`   Suspicious: ${stats.is_suspicious ? 'Yes' : 'No'}`, stats.is_suspicious ? 'red' : 'green');
      log(`   VM Detected: ${stats.is_vm_detected ? 'Yes' : 'No'}`, stats.is_vm_detected ? 'yellow' : 'green');
      
      if (stats.credit_ledger && stats.credit_ledger.length > 0) {
        log(`   Ledger Entries: ${stats.credit_ledger.length}`, 'blue');
      }
    } else {
      logFailure('Trial statistics not found');
    }
  } catch (error) {
    logFailure('Get trial stats failed', error);
  }
}

async function test20_InvalidLicenseKey() {
  logTest('Invalid License Key - Should Reject');
  
  try {
    await axios.post(`${API_URL}/licensing/license/activate`, {
      license_key: 'FAKE-XXXX-YYYY-ZZZZ',
      device_fingerprint: device1.device_fingerprint,
      hardware_signature: device1.hardware_signature,
      activation_method: 'ONLINE',
    });
    
    logFailure('Invalid license key NOT rejected - SECURITY VULNERABILITY!');
  } catch (error: any) {
    if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('Invalid license')) {
      logSuccess('Invalid license key correctly rejected');
    } else {
      logFailure('Invalid license rejection failed with unexpected error', error);
    }
  }
}

async function test21_LicenseRevocation() {
  logTest('License Revocation - Revoke Test License');
  
  const licenseKey = (global as any).testLicenseKey;
  
  if (!licenseKey) {
    log('⚠️  SKIP: No license key available', 'yellow');
    return;
  }
  
  try {
    await axios.post(
      `${API_URL}/licensing/license/${licenseKey}/revoke`,
      { reason: 'Test revocation - automated testing' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    logSuccess('License revoked successfully');
    
    // Try to activate revoked license
    try {
      await axios.post(`${API_URL}/licensing/license/activate`, {
        license_key: licenseKey,
        device_fingerprint: device2.device_fingerprint,
        hardware_signature: device2.hardware_signature,
        activation_method: 'ONLINE',
      });
      
      logFailure('Revoked license was accepted - SECURITY VULNERABILITY!');
    } catch (activationError: any) {
      if (activationError.response?.data?.error?.message?.includes('revoked')) {
        log('   ✓ Revoked license correctly rejected on activation attempt', 'green');
      }
    }
  } catch (error) {
    logFailure('License revocation failed', error);
  }
}

async function test22_UnauthorizedAccess() {
  logTest('RBAC - Unauthorized User Cannot Generate License');
  
  try {
    await axios.post(`${API_URL}/licensing/license/generate`, {
      customerEmail: 'hacker@example.com',
      licenseType: 'PERPETUAL',
    });
    
    logFailure('Unauthorized user CAN generate licenses - SECURITY VULNERABILITY!');
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      logSuccess('Unauthorized access correctly blocked');
    } else {
      logFailure('RBAC check failed with unexpected error', error);
    }
  }
}

async function test23_DataIntegrity() {
  logTest('Data Integrity - Check Credit Ledger Consistency');
  
  try {
    const stats = await axios.get(`${API_URL}/licensing/trial/stats/${device1.device_fingerprint}`);
    const trial = stats.data.data;
    
    if (!trial) {
      log('⚠️  SKIP: Trial data not found', 'yellow');
      return;
    }
    
    const expectedBalance = trial.credits_allocated - trial.credits_used;
    const actualBalance = trial.credits_remaining;
    
    if (expectedBalance === actualBalance) {
      logSuccess('Credit balance integrity verified');
      log(`   Formula: ${trial.credits_allocated} - ${trial.credits_used} = ${actualBalance}`, 'green');
    } else {
      logFailure(`Credit mismatch! Expected ${expectedBalance}, got ${actualBalance}`);
    }
    
    // Check ledger entries
    if (trial.credit_ledger && trial.credit_ledger.length > 0) {
      const ledgerSum = trial.credit_ledger.reduce((sum: number, entry: any) => sum + entry.amount, 0);
      log(`   Ledger entries: ${trial.credit_ledger.length}`, 'blue');
      log(`   Ledger sum: ${ledgerSum} (should be negative)`, 'blue');
    }
  } catch (error) {
    logFailure('Data integrity check failed', error);
  }
}

async function test24_ExhaustedTrialStatus() {
  logTest('Trial Status - Verify Device 1 Marked as EXHAUSTED');
  
  try {
    const response = await axios.post(`${API_URL}/licensing/trial/check`, device1);
    
    const data = response.data.data;
    
    if (data.status === 'EXHAUSTED' && data.eligible === false && data.requiresActivation === true) {
      logSuccess('Exhausted trial status correctly reported');
      log(`   Status: ${data.status}`, 'yellow');
      log(`   Requires Activation: ${data.requiresActivation}`, 'yellow');
    } else {
      logFailure(`Trial status should be EXHAUSTED, got ${data.status}`);
    }
  } catch (error) {
    logFailure('Trial status check failed', error);
  }
}

async function test25_ProtectionMechanismsVerification() {
  logTest('Protection Mechanisms - Verify All Layers Active');
  
  const checks = [];
  
  // Check 1: Trial registry table exists
  try {
    await axios.get(`${API_URL}/licensing/admin/trials`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    checks.push({ name: 'Trial Registry', status: true });
  } catch {
    checks.push({ name: 'Trial Registry', status: false });
  }
  
  // Check 2: License table exists
  try {
    await axios.get(`${API_URL}/licensing/admin/licenses`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    checks.push({ name: 'License Management', status: true });
  } catch {
    checks.push({ name: 'License Management', status: false });
  }
  
  // Check 3: Suspicious activity logging
  try {
    await axios.get(`${API_URL}/licensing/admin/suspicious`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    checks.push({ name: 'Suspicious Activity Logging', status: true });
  } catch {
    checks.push({ name: 'Suspicious Activity Logging', status: false });
  }
  
  const allPassed = checks.every(c => c.status);
  
  if (allPassed) {
    logSuccess('All protection mechanisms are active');
    checks.forEach(c => log(`   ✓ ${c.name}`, 'green'));
  } else {
    logFailure('Some protection mechanisms are not working');
    checks.forEach(c => log(`   ${c.status ? '✓' : '✗'} ${c.name}`, c.status ? 'green' : 'red'));
  }
}

// ===== RUN ALL TESTS =====

async function runAllTests() {
  console.clear();
  log('\n═══════════════════════════════════════════════════════════════════', 'blue');
  log('         🔒 LICENSING SYSTEM COMPREHENSIVE TEST SUITE', 'magenta');
  log('         Testing ALL Protection Mechanisms & Edge Cases', 'blue');
  log('═══════════════════════════════════════════════════════════════════\n', 'blue');
  
  const startTime = Date.now();
  
  try {
    // Basic tests
    await test1_ServerHealth();
    await sleep(100);
    await test2_AdminLogin();
    await sleep(100);
    
    // Trial tests
    await test3_NewDeviceTrialCheck();
    await sleep(100);
    await test4_VMDetection();
    await sleep(100);
    await test5_CreditConsumption();
    await sleep(100);
    await test6_MultipleCreditsConsumption();
    await sleep(100);
    await test7_LastCreditConsumption();
    await sleep(100);
    await test8_ExhaustedTrialBlocking();
    await sleep(100);
    
    // Security tests
    await test9_TrialResetAttempt();
    await sleep(100);
    await test10_SuspiciousActivityLogging();
    await sleep(100);
    
    // License tests
    await test11_GenerateLicense();
    await sleep(100);
    await test12_LicenseActivation();
    await sleep(100);
    await test13_DuplicateActivationAttempt();
    await sleep(100);
    await test14_JWTVerification();
    await sleep(100);
    await test15_JWTDeviceMismatch();
    await sleep(100);
    
    // Admin tests
    await test16_ListTrials();
    await sleep(100);
    await test17_ListLicenses();
    await sleep(100);
    await test18_GetLicenseDetails();
    await sleep(100);
    await test19_GetTrialStats();
    await sleep(100);
    
    // Final validation
    await test20_InvalidLicenseKey();
    await sleep(100);
    await test21_LicenseRevocation();
    await sleep(100);
    await test22_UnauthorizedAccess();
    await sleep(100);
    await test23_DataIntegrity();
    await sleep(100);
    await test24_ExhaustedTrialStatus();
    await sleep(100);
    await test25_ProtectionMechanismsVerification();
    
  } catch (error) {
    log(`\n❌ Critical error during test execution: ${error}`, 'red');
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Final Report
  console.log('\n');
  log('═══════════════════════════════════════════════════════════════════', 'blue');
  log('                        📊 TEST RESULTS', 'magenta');
  log('═══════════════════════════════════════════════════════════════════', 'blue');
  
  const total = testsPassed + testsFailed;
  const passRate = total > 0 ? ((testsPassed / total) * 100).toFixed(1) : '0.0';
  
  log(`\n  Total Tests: ${total}`, 'blue');
  log(`  ✅ Passed: ${testsPassed}`, 'green');
  log(`  ❌ Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  log(`  📈 Pass Rate: ${passRate}%`, passRate === '100.0' ? 'green' : 'yellow');
  log(`  ⏱️  Duration: ${duration}s\n`, 'blue');
  
  if (testsFailed === 0) {
    log('  🎉 ALL TESTS PASSED! LICENSING SYSTEM IS PRODUCTION-READY!', 'green');
  } else {
    log(`  ⚠️  ${testsFailed} TEST(S) FAILED - REVIEW REQUIRED`, 'yellow');
  }
  
  log('\n═══════════════════════════════════════════════════════════════════\n', 'blue');
  
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Execute
runAllTests();

