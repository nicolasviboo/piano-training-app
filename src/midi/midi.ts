// Web MIDI API handling

export interface MIDIDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
}

export type MIDIMessageHandler = (midiNote: number, velocity: number) => void;

let midiAccess: MIDIAccess | null = null;
let selectedInput: MIDIInput | null = null;
let messageHandler: MIDIMessageHandler | null = null;

/**
 * Check if Web MIDI API is supported
 */
export function isMIDISupported(): boolean {
  return 'requestMIDIAccess' in navigator;
}

/**
 * Initialize MIDI access
 */
export async function initMIDI(): Promise<boolean> {
  if (!isMIDISupported()) {
    console.warn('Web MIDI API is not supported in this browser');
    return false;
  }

  try {
    midiAccess = await navigator.requestMIDIAccess();
    console.log('MIDI access granted');
    return true;
  } catch (error) {
    console.error('Failed to get MIDI access:', error);
    return false;
  }
}

/**
 * Get list of available MIDI input devices
 */
export function getInputDevices(): MIDIDeviceInfo[] {
  if (!midiAccess) return [];

  const devices: MIDIDeviceInfo[] = [];
  const inputs = midiAccess.inputs.values();

  for (const input of inputs) {
    devices.push({
      id: input.id,
      name: input.name || 'Unknown Device',
      manufacturer: input.manufacturer || 'Unknown',
      state: input.state,
    });
  }

  return devices;
}

/**
 * Connect to a MIDI input device
 */
export function connectDevice(deviceId: string, handler: MIDIMessageHandler): boolean {
  if (!midiAccess) {
    console.warn('MIDI not initialized');
    return false;
  }

  // Disconnect previous device
  disconnectDevice();

  const input = midiAccess.inputs.get(deviceId);
  if (!input) {
    console.error('Device not found:', deviceId);
    return false;
  }

  selectedInput = input;
  messageHandler = handler;

  // Attach message handler
  selectedInput.onmidimessage = handleMIDIMessage;

  console.log('Connected to MIDI device:', input.name);
  return true;
}

/**
 * Update the message handler without disconnecting
 */
export function updateMessageHandler(handler: MIDIMessageHandler): void {
  messageHandler = handler;
  console.log('MIDI message handler updated');
}

/**
 * Disconnect current MIDI device
 */
export function disconnectDevice(): void {
  if (selectedInput) {
    selectedInput.onmidimessage = null;
    selectedInput = null;
  }
  messageHandler = null;
}

/**
 * Handle incoming MIDI messages
 */
function handleMIDIMessage(event: MIDIMessageEvent): void {
  const data = event.data;
  if (!data || data.length < 3) return;

  const status = data[0];
  const note = data[1];
  const velocity = data[2];

  // Filter for NOTE_ON messages (status byte 144-159) with velocity > 0
  // NOTE_OFF is either status 128-143 or NOTE_ON with velocity 0
  const messageType = status & 0xf0;
  const isNoteOn = messageType === 0x90 && velocity > 0;

  if (isNoteOn && messageHandler) {
    messageHandler(note, velocity);
  }
}

/**
 * Get currently connected device info
 */
export function getConnectedDevice(): MIDIDeviceInfo | null {
  if (!selectedInput) return null;

  return {
    id: selectedInput.id,
    name: selectedInput.name || 'Unknown Device',
    manufacturer: selectedInput.manufacturer || 'Unknown',
    state: selectedInput.state,
  };
}

/**
 * Listen for device connection/disconnection events
 */
export function onDeviceStateChange(callback: (devices: MIDIDeviceInfo[]) => void): void {
  if (!midiAccess) return;

  midiAccess.onstatechange = () => {
    callback(getInputDevices());
  };
}

/**
 * Clean up MIDI resources
 */
export function cleanup(): void {
  disconnectDevice();
  if (midiAccess) {
    midiAccess.onstatechange = null;
  }
  midiAccess = null;
}

/**
 * Test MIDI input (useful for debugging)
 */
export function enableTestMode(onNote: (note: number) => void): () => void {
  const handler: MIDIMessageHandler = (midiNote) => {
    console.log('MIDI Note:', midiNote);
    onNote(midiNote);
  };

  // Store original handler
  const originalHandler = messageHandler;
  messageHandler = handler;

  // Return cleanup function
  return () => {
    messageHandler = originalHandler;
  };
}

