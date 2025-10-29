// MIDI device selection and status display

import { useState, useEffect, useRef } from 'react';
import {
  getInputDevices,
  connectDevice,
  disconnectDevice,
  getConnectedDevice,
  onDeviceStateChange,
  MIDIDeviceInfo,
  MIDIMessageHandler,
} from '../midi/midi';

interface DevicePickerProps {
  onDeviceConnect: (handler: MIDIMessageHandler) => void;
  messageHandler: MIDIMessageHandler | null;
}

export default function DevicePicker({ onDeviceConnect, messageHandler }: DevicePickerProps) {
  const [devices, setDevices] = useState<MIDIDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [connectedDevice, setConnectedDevice] = useState<MIDIDeviceInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastNote, setLastNote] = useState<string>('');
  const [noteTestActive, setNoteTestActive] = useState(false);
  
  // Use ref to always have latest messageHandler (fixes stale closure issue)
  const messageHandlerRef = useRef<MIDIMessageHandler | null>(null);
  
  // Update ref whenever messageHandler changes
  useEffect(() => {
    messageHandlerRef.current = messageHandler;
  }, [messageHandler]);

  const refreshDevices = () => {
    setIsRefreshing(true);
    const updatedDevices = getInputDevices();
    setDevices(updatedDevices);
    console.log('MIDI devices refreshed:', updatedDevices);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    // Load initial devices
    refreshDevices();

    // Listen for device changes
    onDeviceStateChange((updatedDevices) => {
      setDevices(updatedDevices);
      console.log('MIDI devices changed:', updatedDevices);
      
      // Check if connected device was disconnected
      const connected = getConnectedDevice();
      if (!connected || !updatedDevices.find(d => d.id === connected.id)) {
        setConnectedDevice(null);
        setSelectedDeviceId('');
      }
    });
  }, []);

  const handleConnect = () => {
    if (!selectedDeviceId) return;

    // Create a wrapper handler that shows test feedback
    // Uses ref so it always calls the LATEST messageHandler (fixes stale closure)
    const testHandler: MIDIMessageHandler = (midiNote, velocity) => {
      // Show note feedback for testing
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const octave = Math.floor(midiNote / 12) - 1;
      const noteName = noteNames[midiNote % 12];
      setLastNote(`${noteName}${octave} (${midiNote})`);
      setNoteTestActive(true);
      
      // Clear the indicator after 500ms
      setTimeout(() => setNoteTestActive(false), 500);
      
      // Pass through to actual handler (use ref to get latest)
      if (messageHandlerRef.current) {
        messageHandlerRef.current(midiNote, velocity);
      }
    };

    const success = connectDevice(selectedDeviceId, testHandler);
    if (success) {
      const device = getConnectedDevice();
      setConnectedDevice(device);
      onDeviceConnect(testHandler);
    }
  };

  const handleDisconnect = () => {
    disconnectDevice();
    setConnectedDevice(null);
    setSelectedDeviceId('');
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <span className="mr-2">🎹</span>
        MIDI Device
      </h3>

      {connectedDevice ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-green-50 border border-green-300 rounded p-3">
            <div>
              <div className="font-medium text-green-900">{connectedDevice.name}</div>
              <div className="text-sm text-green-700">{connectedDevice.manufacturer}</div>
            </div>
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${noteTestActive ? 'bg-blue-500 animate-ping' : 'bg-green-500 animate-pulse'}`}></span>
              <span className="text-sm text-green-700 font-medium">Connected</span>
            </div>
          </div>
          
          {/* MIDI Test Indicator */}
          <div className={`p-3 rounded border transition-all ${
            noteTestActive 
              ? 'bg-blue-50 border-blue-300' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="text-xs text-gray-600 mb-1">🎹 Test your keys:</div>
            <div className={`font-mono text-sm font-bold transition-colors ${
              noteTestActive ? 'text-blue-600' : 'text-gray-400'
            }`}>
              {lastNote || 'Play any key...'}
            </div>
          </div>
          
          <button
            onClick={handleDisconnect}
            className="w-full py-2 px-4 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {devices.length === 0 ? (
            <div className="space-y-3">
              <div className="text-gray-700 text-sm p-3 bg-yellow-50 border border-yellow-300 rounded">
                <div className="font-semibold mb-2">⚠️ No MIDI devices found</div>
                <div className="space-y-2 text-xs">
                  <p><strong>Troubleshooting steps:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Connect your MIDI keyboard via USB</li>
                    <li>Turn on your keyboard/piano</li>
                    <li>Make sure drivers are installed (check Device Manager on Windows)</li>
                    <li>Close other music software that might be using MIDI</li>
                    <li>Try a different USB port or cable</li>
                    <li>Restart your browser after connecting</li>
                  </ol>
                  <p className="mt-2"><strong>Browser requirements:</strong></p>
                  <ul className="list-disc list-inside ml-2">
                    <li>Chrome, Edge, or Opera (recommended)</li>
                    <li>HTTPS connection (or localhost)</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={refreshDevices}
                disabled={isRefreshing}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {isRefreshing ? '🔄 Refreshing...' : '🔄 Refresh Devices'}
              </button>
            </div>
          ) : (
            <>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Select a device...</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name} ({device.manufacturer})
                  </option>
                ))}
              </select>
              <button
                onClick={handleConnect}
                disabled={!selectedDeviceId}
                className="w-full py-2 px-4 bg-primary text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Connect
              </button>
              <button
                onClick={refreshDevices}
                className="w-full py-1 px-3 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                🔄 Refresh List
              </button>
            </>
          )}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        💡 Tip: Press any key on your MIDI keyboard to test the connection
      </div>
    </div>
  );
}

