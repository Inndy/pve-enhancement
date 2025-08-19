# PVE VNC Enhancement

A userscript for Proxmox Virtual Environment (PVE) that enhances the web interface with clipboard paste support and automatic console switching.

## Features

### 1. noVNC Clipboard Paste Support
- Automatically pastes clipboard content into noVNC canvas using keyboard events
- Confirmation dialogs for large content (>100 characters) or non-ASCII text
- User preference stored in local storage with first-time setup prompt

### 2. VM Tag-Based Console Switching
- Automatically switches VMs tagged with `use-xterm` from noVNC to xterm.js terminal
- Only applies to QEMU VMs, not LXC containers
- Real-time detection via DOM observation

## Installation

1. Install a userscript manager (Tampermonkey, Greasemonkey, etc.)
2. Install the script from: `https://raw.githubusercontent.com/Inndy/pve-enhancement/main/pve.user.js`
3. The script will auto-update when new versions are released

## Usage

### Clipboard Paste
1. Open any noVNC console in PVE
2. On first use, confirm to enable paste functionality
3. Use Ctrl+V to paste clipboard content into the console

### Console Switching
1. Tag your QEMU VM with `use-xterm` in PVE
2. Open the console - it will automatically switch to xterm.js instead of noVNC

## Technical Details

- **Target URLs**: `https://*:8006/*` (standard PVE port)
- **Detection**: Uses document title and global objects to determine mode
- **DOM Observation**: Monitors for console tab changes with 100ms throttling
- **Keyboard Simulation**: 12ms delay between key events for reliable paste

## Compatibility

- Proxmox Virtual Environment web interface
- Modern browsers with userscript manager support
