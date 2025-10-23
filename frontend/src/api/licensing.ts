import axios from 'axios';

const API_URL = 'http://localhost:4000/api/v1';

export interface TrialCheckRequest {
  device_fingerprint: string;
  hardware_signature: string;
  mac_address?: string;
  cpu_id?: string;
  motherboard_serial?: string;
  disk_serial?: string;
  system_uuid?: string;
  platform: string;
  os_version?: string;
  hostname?: string;
  ip_address?: string;
  user_agent?: string;
  country_code?: string;
  timezone?: string;
}

export interface TrialCheckResponse {
  eligible: boolean;
  reason?: string;
  message: string;
  trialGuestId?: string;
  creditsRemaining?: number;
  status?: string;
  requiresActivation?: boolean;
  isVMDetected?: boolean;
  isSuspicious?: boolean;
}

export interface TrialStats {
  id: string;
  device_fingerprint: string;
  hardware_signature: string;
  trial_guest_id: string;
  status: string;
  credits_allocated: number;
  credits_used: number;
  credits_remaining: number;
  first_seen_at: string;
  last_seen_at: string;
  trial_started_at: string;
  is_vm_detected: boolean;
  is_suspicious: boolean;
  credit_ledger?: any[];
}

export interface License {
  id: string;
  license_key: string;
  license_type: string;
  status: string;
  customer_email: string;
  customer_name?: string;
  company_name?: string;
  device_fingerprint?: string;
  activation_count: number;
  max_activations: number;
  issued_at: string;
  activated_at?: string;
  expires_at?: string;
  is_revoked: boolean;
}

export interface LicenseGenerationRequest {
  customerEmail: string;
  customerName?: string;
  companyName?: string;
  licenseType: string;
  deviceFingerprint?: string;
  hardwareSignature?: string;
  maxActivations?: number;
  expiresInDays?: number;
  purchaseAmount?: number;
  currency?: string;
  paymentId?: string;
}

const licensingAPI = {
  /**
   * Check trial eligibility (PUBLIC)
   */
  checkTrial: async (data: TrialCheckRequest): Promise<TrialCheckResponse> => {
    const response = await axios.post(`${API_URL}/licensing/trial/check`, data);
    return response.data.data;
  },

  /**
   * Consume trial credit (PUBLIC)
   */
  consumeCredit: async (deviceFingerprint: string, action: string, referenceId?: string, metadata?: any) => {
    const response = await axios.post(`${API_URL}/licensing/trial/consume`, {
      device_fingerprint: deviceFingerprint,
      action,
      reference_id: referenceId,
      metadata,
    });
    return response.data;
  },

  /**
   * Get trial statistics (PUBLIC)
   */
  getTrialStats: async (deviceFingerprint: string): Promise<TrialStats> => {
    const response = await axios.get(`${API_URL}/licensing/trial/stats/${deviceFingerprint}`);
    return response.data.data;
  },

  /**
   * Generate license (ADMIN)
   */
  generateLicense: async (token: string, data: LicenseGenerationRequest) => {
    const response = await axios.post(`${API_URL}/licensing/license/generate`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  /**
   * Activate license (PUBLIC)
   */
  activateLicense: async (
    licenseKey: string,
    deviceFingerprint: string,
    hardwareSignature: string,
    activationMethod: string = 'ONLINE'
  ) => {
    const response = await axios.post(`${API_URL}/licensing/license/activate`, {
      license_key: licenseKey,
      device_fingerprint: deviceFingerprint,
      hardware_signature: hardwareSignature,
      activation_method: activationMethod,
    });
    return response.data;
  },

  /**
   * Verify JWT license (PUBLIC)
   */
  verifyLicense: async (jwtToken: string, deviceFingerprint: string) => {
    const response = await axios.post(`${API_URL}/licensing/license/verify`, {
      jwt_token: jwtToken,
      device_fingerprint: deviceFingerprint,
    });
    return response.data;
  },

  /**
   * Get license details (ADMIN)
   */
  getLicenseDetails: async (token: string, licenseKey: string) => {
    const response = await axios.get(`${API_URL}/licensing/license/${licenseKey}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  /**
   * Revoke license (ADMIN)
   */
  revokeLicense: async (token: string, licenseKey: string, reason: string) => {
    const response = await axios.post(
      `${API_URL}/licensing/license/${licenseKey}/revoke`,
      { reason },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  /**
   * List all trials (ADMIN)
   */
  listTrials: async (token: string) => {
    const response = await axios.get(`${API_URL}/licensing/admin/trials`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  /**
   * List all licenses (ADMIN)
   */
  listLicenses: async (token: string) => {
    const response = await axios.get(`${API_URL}/licensing/admin/licenses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },

  /**
   * Get suspicious activities (ADMIN)
   */
  getSuspiciousActivities: async (token: string) => {
    const response = await axios.get(`${API_URL}/licensing/admin/suspicious`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data;
  },
};

export default licensingAPI;





