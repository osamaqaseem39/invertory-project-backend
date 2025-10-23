import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface HardwareComponents {
  macAddress?: string;
  cpuId?: string;
  motherboardSerial?: string;
  diskSerial?: string;
  systemUuid?: string;
  platform: string;
  osVersion?: string;
  hostname?: string;
}

export interface DeviceFingerprintResult {
  deviceFingerprint: string;      // SHA256 hash (short)
  hardwareSignature: string;       // SHA256 hash (complete)
  components: HardwareComponents;
  isVirtualMachine: boolean;
  vmType?: string;
}

/**
 * Enhanced Hardware Fingerprint Service
 * Generates unique device identifiers that survive reinstallation
 */
export class HardwareFingerprintService {
  /**
   * Generate comprehensive device fingerprint
   */
  static async generateFingerprint(components: HardwareComponents): Promise<DeviceFingerprintResult> {
    // Basic fingerprint (for backward compatibility)
    const basicComponents = [
      components.platform,
      components.hostname || '',
      components.macAddress || '',
    ];
    const deviceFingerprint = this.hash(basicComponents.join('|'));

    // Enhanced signature (complete hardware profile)
    const completeComponents = [
      components.macAddress || '',
      components.cpuId || '',
      components.motherboardSerial || '',
      components.diskSerial || '',
      components.systemUuid || '',
      components.platform,
      components.hostname || '',
    ];
    const hardwareSignature = this.hash(completeComponents.join('|'));

    // VM Detection
    const vmDetection = this.detectVirtualMachine(components);

    return {
      deviceFingerprint,
      hardwareSignature,
      components,
      isVirtualMachine: vmDetection.isVM,
      vmType: vmDetection.vmType,
    };
  }

  /**
   * Detect if running in virtual machine
   */
  private static detectVirtualMachine(components: HardwareComponents): { isVM: boolean; vmType?: string } {
    const indicators: Record<string, string> = {
      // Hostname patterns
      'virtualbox': 'VirtualBox',
      'vmware': 'VMware',
      'qemu': 'QEMU',
      'kvm': 'KVM',
      'xen': 'Xen',
      'hyperv': 'Hyper-V',
      'parallels': 'Parallels',
      
      // MAC address prefixes (vendor OUIs)
      '08:00:27': 'VirtualBox',
      '00:0C:29': 'VMware',
      '00:50:56': 'VMware',
      '00:1C:42': 'Parallels',
      '52:54:00': 'QEMU/KVM',
    };

    // Check hostname
    const hostname = (components.hostname || '').toLowerCase();
    for (const [pattern, vmType] of Object.entries(indicators)) {
      if (hostname.includes(pattern)) {
        return { isVM: true, vmType };
      }
    }

    // Check MAC address
    const macAddress = components.macAddress || '';
    for (const [prefix, vmType] of Object.entries(indicators)) {
      if (macAddress.startsWith(prefix)) {
        return { isVM: true, vmType };
      }
    }

    // Check CPU ID patterns (VMware, VirtualBox often have specific patterns)
    const cpuId = (components.cpuId || '').toLowerCase();
    if (cpuId.includes('virtual') || cpuId.includes('vmware') || cpuId.includes('qemu')) {
      return { isVM: true, vmType: 'Unknown VM' };
    }

    return { isVM: false };
  }

  /**
   * Save hardware fingerprint to database
   */
  static async saveFingerprint(fingerprint: DeviceFingerprintResult): Promise<void> {
    const existing = await prisma.hardwareFingerprint.findFirst({
      where: {
        OR: [
          { device_fingerprint: fingerprint.deviceFingerprint },
          { hardware_signature: fingerprint.hardwareSignature },
        ],
      },
    });

    if (existing) {
      // Update existing record
      await prisma.hardwareFingerprint.update({
        where: { id: existing.id },
        data: {
          last_seen_at: new Date(),
          seen_count: { increment: 1 },
          // Update hardware components if changed
          mac_address: fingerprint.components.macAddress,
          cpu_id: fingerprint.components.cpuId,
          motherboard_serial: fingerprint.components.motherboardSerial,
          disk_serial: fingerprint.components.diskSerial,
          system_uuid: fingerprint.components.systemUuid,
          os_version: fingerprint.components.osVersion,
          hostname: fingerprint.components.hostname,
        },
      });
    } else {
      // Create new record
      await prisma.hardwareFingerprint.create({
        data: {
          device_fingerprint: fingerprint.deviceFingerprint,
          hardware_signature: fingerprint.hardwareSignature,
          mac_address: fingerprint.components.macAddress,
          cpu_id: fingerprint.components.cpuId,
          motherboard_serial: fingerprint.components.motherboardSerial,
          disk_serial: fingerprint.components.diskSerial,
          system_uuid: fingerprint.components.systemUuid,
          platform: fingerprint.components.platform,
          os_version: fingerprint.components.osVersion,
          hostname: fingerprint.components.hostname,
          is_virtual_machine: fingerprint.isVirtualMachine,
          vm_type: fingerprint.vmType,
        },
      });
    }
  }

  /**
   * Calculate similarity between two hardware signatures
   * Returns 0.0 (completely different) to 1.0 (identical)
   */
  static calculateSimilarity(signature1: string, signature2: string, components1: HardwareComponents, components2: HardwareComponents): number {
    if (signature1 === signature2) {
      return 1.0;
    }

    // Count matching components
    let matches = 0;
    let total = 0;

    const compareComponent = (val1?: string, val2?: string) => {
      if (val1 && val2) {
        total++;
        if (val1 === val2) matches++;
      }
    };

    compareComponent(components1.macAddress, components2.macAddress);
    compareComponent(components1.cpuId, components2.cpuId);
    compareComponent(components1.motherboardSerial, components2.motherboardSerial);
    compareComponent(components1.diskSerial, components2.diskSerial);
    compareComponent(components1.systemUuid, components2.systemUuid);

    if (total === 0) return 0.0;

    return matches / total;
  }

  /**
   * Check if hardware has changed significantly
   */
  static async detectHardwareChange(
    oldFingerprint: string,
    newComponents: HardwareComponents
  ): Promise<{ changed: boolean; similarity: number; reason?: string }> {
    const oldRecord = await prisma.hardwareFingerprint.findFirst({
      where: { device_fingerprint: oldFingerprint },
    });

    if (!oldRecord) {
      return { changed: true, similarity: 0.0, reason: 'No previous record found' };
    }

    const oldComponents: HardwareComponents = {
      macAddress: oldRecord.mac_address || undefined,
      cpuId: oldRecord.cpu_id || undefined,
      motherboardSerial: oldRecord.motherboard_serial || undefined,
      diskSerial: oldRecord.disk_serial || undefined,
      systemUuid: oldRecord.system_uuid || undefined,
      platform: oldRecord.platform,
      osVersion: oldRecord.os_version || undefined,
      hostname: oldRecord.hostname || undefined,
    };

    const newFingerprint = await this.generateFingerprint(newComponents);
    const similarity = this.calculateSimilarity(
      oldRecord.hardware_signature,
      newFingerprint.hardwareSignature,
      oldComponents,
      newComponents
    );

    // Consider hardware changed if similarity < 70%
    if (similarity < 0.7) {
      return {
        changed: true,
        similarity,
        reason: `Hardware similarity: ${(similarity * 100).toFixed(0)}% (threshold: 70%)`,
      };
    }

    return { changed: false, similarity };
  }

  /**
   * SHA-256 hash function
   */
  private static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get hardware fingerprint history
   */
  static async getHistory(deviceFingerprint: string) {
    return await prisma.hardwareFingerprint.findMany({
      where: { device_fingerprint: deviceFingerprint },
      orderBy: { first_seen_at: 'desc' },
    });
  }

  /**
   * Flag suspicious fingerprint
   */
  static async flagSuspicious(deviceFingerprint: string, reason: string): Promise<void> {
    await prisma.suspiciousActivity.create({
      data: {
        device_fingerprint: deviceFingerprint,
        activity_type: 'SUSPICIOUS_FINGERPRINT',
        severity: 'MEDIUM',
        description: reason,
        action_taken: 'FLAGGED',
      },
    });
  }
}





