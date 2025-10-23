/**
 * Client-Side Device Fingerprint Generation
 * For web browsers (will be replaced with Electron hardware ID in desktop app)
 */

export interface DeviceInfo {
  deviceFingerprint: string;
  hardwareSignature: string;
  platform: string;
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  hardwareConcurrency: number;
  deviceMemory?: number;
}

/**
 * Generate device fingerprint for web browser
 */
export async function generateDeviceFingerprint(): Promise<DeviceInfo> {
  const components: string[] = [];

  // Browser fingerprint components
  components.push(navigator.userAgent);
  components.push(navigator.language);
  components.push(screen.width + 'x' + screen.height);
  components.push(screen.colorDepth.toString());
  components.push(new Date().getTimezoneOffset().toString());
  components.push(navigator.hardwareConcurrency.toString());
  
  // Canvas fingerprint
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Device ID', 2, 15);
    components.push(canvas.toDataURL());
  }

  // WebGL fingerprint
  const gl = canvas.getContext('webgl');
  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL));
      components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
    }
  }

  // Generate hashes
  const combined = components.join('|');
  const deviceFingerprint = await sha256(combined.substring(0, 1000)); // Shorter for basic FP
  const hardwareSignature = await sha256(combined); // Full signature

  return {
    deviceFingerprint,
    hardwareSignature,
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as any).deviceMemory,
  };
}

/**
 * SHA-256 hash function for browser
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Store device fingerprint in localStorage
 */
export function saveDeviceFingerprint(deviceInfo: DeviceInfo): void {
  localStorage.setItem('device_fingerprint', deviceInfo.deviceFingerprint);
  localStorage.setItem('hardware_signature', deviceInfo.hardwareSignature);
  localStorage.setItem('device_info', JSON.stringify(deviceInfo));
}

/**
 * Get stored device fingerprint
 */
export function getStoredFingerprint(): { deviceFingerprint: string; hardwareSignature: string } | null {
  const deviceFingerprint = localStorage.getItem('device_fingerprint');
  const hardwareSignature = localStorage.getItem('hardware_signature');

  if (deviceFingerprint && hardwareSignature) {
    return { deviceFingerprint, hardwareSignature };
  }

  return null;
}

/**
 * Get or generate device fingerprint
 */
export async function getOrGenerateFingerprint(): Promise<{ deviceFingerprint: string; hardwareSignature: string }> {
  const stored = getStoredFingerprint();
  
  if (stored) {
    return stored;
  }

  const deviceInfo = await generateDeviceFingerprint();
  saveDeviceFingerprint(deviceInfo);
  
  return {
    deviceFingerprint: deviceInfo.deviceFingerprint,
    hardwareSignature: deviceInfo.hardwareSignature,
  };
}





