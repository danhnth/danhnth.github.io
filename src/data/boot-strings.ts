/**
 * Boot Sequence Strings
 *
 * Centralized string constants for i18n compliance.
 * All boot phase text is exported here for easy translation.
 */

export const BIOS_STRINGS = {
  title: 'DANHNTH SYSTEMS',
  biosDate: 'BIOS Date: 01/15/26 Ver 1.0.0',
  memoryTest: 'Memory Test:',
  memoryOk: 'OK',
  cpu: 'Intel(R) Core(TM) i7-9700K CPU @ 3.60GHz',
  ideChannel0: 'IDE Channel 0: Master: SSD-001',
  ideChannel1: 'IDE Channel 1: Master: NET-001',
  postComplete: 'BIOS POST complete.',
  keyboard: 'Keyboard',
  mouse: 'Mouse',
  primaryMaster: 'Primary Master',
  primarySlave: 'Primary Slave',
  secondaryMaster: 'Secondary Master',
  cdromDrive: 'CD-ROM Drive',
  usbController: 'USB Controller',
  networkController: 'Network Controller',
} as const;

export const HARDWARE_STRINGS = {
  detecting: 'Detecting hardware...',
  ideDrive0: 'HDA: WDC WD10EZEX-00BN5A0',
  ideDrive1: 'HDB: SAMSUNG SSD 860 EVO',
  networkInterface: 'Network Interface:',
  gpu: 'GPU:',
  statusOk: 'OK',
  complete: 'Hardware detection complete.',
  detectingIde: 'Detecting IDE drives...',
  detectingNetwork: 'Detecting network interfaces...',
  detectingPeripheral: 'Detecting peripheral devices...',
  usbBus1: 'USB Bus 001',
  usbBus2: 'USB Bus 002',
  acpiThermal: 'ACPI Thermal Zone',
  pciBridge: 'PCI Bridge',
  eth0Mac: '00:1a:2b:3c:4d:5e',
  wlan0Mac: '00:1a:2b:3c:4d:5f',
  loMac: '00:00:00:00:00:00',
} as const;

export const KERNEL_STRINGS = {
  loading: 'Loading kernel danhn-term v1.0...',
  terminalDriver: '[OK] Initializing terminal driver',
  crtEffects: '[OK] Loading CRT effects module',
  rootFilesystem: '[OK] Mounting root filesystem',
  audioSubsystem: '[OK] Starting audio subsystem',
  commandRegistry: '[OK] Loading command registry',
  loaded: 'Kernel loaded successfully.',
} as const;

export const INIT_STRINGS = {
  starting: 'Starting system services...',
  startingServices: 'Starting services...',
  terminalEngine: 'Mounting local filesystems',
  commandProcessor: 'Activating swap',
  effectRenderer: 'Setting hostname',
  audioManager: 'Configuring network interfaces',
  complete: 'All services started.',
} as const;

export const LOGIN_STRINGS = {
  loginPrompt: 'login: ',
  passwordPrompt: 'Password: ',
  loginSuccess: 'Login successful',
  welcome: 'Welcome to DANHNTH Systems',
} as const;