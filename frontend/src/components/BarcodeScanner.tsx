import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  title?: string;
  instructions?: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onClose,
  title = 'Scan Barcode',
  instructions = 'Point your camera at a barcode or QR code',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    initScanner();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (selectedDeviceId && hasPermission) {
      startScanning(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  const initScanner = async () => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      setHasPermission(true);
      streamRef.current = stream;

      // Get available video devices
      const videoDevices = await navigator.mediaDevices.enumerateDevices();
      const cameras = videoDevices.filter(device => device.kind === 'videoinput');
      setDevices(cameras);

      // Select default camera (prefer back camera)
      const backCamera = cameras.find(camera => 
        camera.label.toLowerCase().includes('back') || 
        camera.label.toLowerCase().includes('rear')
      ) || cameras[0];

      if (backCamera) {
        setSelectedDeviceId(backCamera.deviceId);
      }
    } catch (err: any) {
      console.error('Camera permission error:', err);
      setHasPermission(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device. Please use manual input.');
      } else {
        setError('Failed to access camera. Please try manual input.');
      }
    }
  };

  const startScanning = async (deviceId: string) => {
    if (!videoRef.current) return;

    try {
      setIsScanning(true);
      setError('');

      // Initialize barcode reader
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      // Start continuous scanning
      await codeReader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const barcode = result.getText();
            console.log('Barcode detected:', barcode);
            
            // Vibrate on scan (mobile only)
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }
            
            // Call parent callback
            onScan(barcode);
            
            // Stop scanning after successful scan
            cleanup();
          }
          
          if (err && !(err instanceof NotFoundException)) {
            console.error('Scanning error:', err);
          }
        }
      );
    } catch (err: any) {
      console.error('Scanning error:', err);
      setError('Failed to start scanning. Please try again.');
      setIsScanning(false);
    }
  };

  const cleanup = () => {
    // Stop code reader
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsScanning(false);
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  const switchCamera = () => {
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    setSelectedDeviceId(devices[nextIndex].deviceId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {hasPermission === false ? (
            // Permission denied
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚫</div>
              <h4 className="text-xl font-semibold text-gray-800 mb-2">Camera Access Required</h4>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-2 text-sm text-gray-600 text-left max-w-md mx-auto">
                <p className="font-semibold">To enable camera:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click the camera icon in your browser's address bar</li>
                  <li>Select "Always allow camera access"</li>
                  <li>Refresh the page and try again</li>
                </ol>
              </div>
              <button
                onClick={handleClose}
                className="mt-6 btn-secondary"
              >
                Use Manual Input Instead
              </button>
            </div>
          ) : hasPermission === null ? (
            // Loading
            <div className="text-center py-12">
              <div className="inline-block w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Requesting camera access...</p>
            </div>
          ) : (
            // Camera view
            <div className="space-y-4">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 text-center">
                  📷 {instructions}
                </p>
              </div>

              {/* Video Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                
                {/* Scanning Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Scanning Frame */}
                    <div className="relative w-64 h-64">
                      {/* Corner Brackets */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
                      
                      {/* Scanning Line Animation */}
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute w-full h-1 bg-green-500 opacity-75 animate-scan"></div>
                      </div>
                    </div>
                    
                    {/* Status Text */}
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                      <div className="inline-block bg-black bg-opacity-75 text-white px-4 py-2 rounded-full">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">Scanning...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 text-center">{error}</p>
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-between gap-4">
                {/* Camera Selector */}
                {devices.length > 1 && (
                  <button
                    onClick={switchCamera}
                    className="btn-secondary flex-1"
                    disabled={!isScanning}
                  >
                    <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Switch Camera
                  </button>
                )}

                {/* Cancel Button */}
                <button
                  onClick={handleClose}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>

              {/* Tips */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <p className="font-semibold mb-2">📋 Scanning Tips:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Hold camera steady and parallel to barcode</li>
                  <li>Ensure good lighting (use flash if needed)</li>
                  <li>Keep barcode within the green frame</li>
                  <li>Move closer or further until barcode is clear</li>
                  <li>Clean camera lens if blurry</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scanning Animation Styles */}
      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
};





