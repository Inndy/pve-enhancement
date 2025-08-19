// ==UserScript==
// @name         PVE VNC Enhancement
// @namespace    https://inndy.tw/
// @version      2025-08-19
// @description  noVNC Paste + VM tag based xterm.js console switch
// @author       Inndy Lin <inndy.tw@gmail.com>
// @match        https://*:8006/*
// @include      https://*:8006/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=proxmox.com
// @grant        none
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/Inndy/pve-enhancement/main/pve.user.js
// @downloadURL  https://raw.githubusercontent.com/Inndy/pve-enhancement/main/pve.user.js
// ==/UserScript==

(function() {
  'use strict';

  function handleProxmox() {
    function modifyConsoleSource(consoleDiv) {
      const iframe = consoleDiv.querySelector('iframe');
      if (!iframe?.src) return;

      try {
        const url = new URL(iframe.src, window.location.origin);

        // Skip if already using xtermjs console
        if (url.searchParams.get('xtermjs') === '1') return;

        const vmid = url.searchParams.get('vmid');
        const node = url.searchParams.get('node');

        if (vmid && node) {
          const newSrc = `/?console=kvm&xtermjs=1&vmid=${vmid}&node=${node}&cmd=`;
          iframe.src = newSrc;
          console.log(`Modified console for VM ${vmid}:`, newSrc);
        } else {
          console.warn('Could not extract vmid or node from:', iframe.src);
        }
      } catch (error) {
        console.error('Error processing iframe:', error);
      }
    }

    function checkForConsole() {
      const qemuConfig = document.querySelector('div[id^="PVE-qemu-Config-"]');
      const lxcConfig = document.querySelector('div[id^="pveLXCConfig-"]');
      const novncConsole = document.querySelector('div[id^="pveNoVncConsole-"]');
      const tags = document.querySelectorAll('.x-component.pve-edit-tag.normal.x-box-item.x-component-default span');
      const checkTag = [...tags].some(tag => tag.textContent === 'use-xterm');

      // Only modify QEMU consoles (not LXC containers)
      if (novncConsole && qemuConfig && !lxcConfig && checkTag) {
        modifyConsoleSource(novncConsole);
      }
    }

    // Simple throttling to avoid excessive checks during DOM changes
    let checkTimeout = null;
    function throttledCheck() {
      if (checkTimeout) return;

      checkTimeout = setTimeout(() => {
        checkForConsole();
        checkTimeout = null;
      }, 100);
    }

    // Observe DOM changes with basic filtering
    const observer = new MutationObserver((mutations) => {
      const hasRelevantChanges = mutations.some(mutation =>
        mutation.type === 'childList' &&
        Array.from(mutation.addedNodes).some(node =>
          node.nodeType === Node.ELEMENT_NODE && (
            node.id?.startsWith('PVE-qemu-Config-') ||
            node.id?.startsWith('pveNoVncConsole-') ||
            node.id?.startsWith('pveLXCConfig-')
          )
        )
      );

      if (hasRelevantChanges) {
        throttledCheck();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial check for existing elements
    checkForConsole();
  }

  function handleNoVNC() {
    if (!localStorage['__PVE_VNC_PASTE']) {
      if (!confirm('First time open this site, enable noVNC paste?')) {
        return;
      }

      localStorage['__PVE_VNC_PASTE'] = 'enabled'
    }

    const keyStrokeDelay = 12

    async function sendKeyEvent(el, event, args) {
      return new Promise((resolve, _) => {
        setTimeout(() => {
          el.dispatchEvent(new KeyboardEvent(event, args));
          resolve();
        }, keyStrokeDelay);
      });
    }

    async function sendString(el, text) {
      if (!el || !text) return;
      const x = text[0];
      const needs_shift = x.match(/[A-Z!@#$%^&*()_+{}:\"<>?~|]/)
        if (x === '\n') {
          await sendKeyEvent(el, "keydown", {
            keyCode: 13,
          });
          await sendKeyEvent(el, "keyup", {
            keyCode: 13,
          });
        } else if (needs_shift) {
          await sendKeyEvent(el, "keydown", {
            keyCode: 16,
          });
          await sendKeyEvent(el, "keydown", {
            key: x,
            shiftKey: true,
          });
          await sendKeyEvent(el, "keyup", {
            key: x,
            shiftKey: true,
          });
          await sendKeyEvent(el, "keyup", {
            keyCode: 16,
          });
        } else {
          await sendKeyEvent(el, "keydown", {
            key: x,
          });
          await sendKeyEvent(el, "keyup", {
            key: x,
          });
        }
        setTimeout(sendString, keyStrokeDelay, el, text.substring(1));
      }

    document.body.onpaste = e => {
      const text = e.clipboardData.getData('text/plain');
      if (text.length > 100) {
        if (!confirm(`You are about to paste ${text.length} chars string, u sure?`)) {
          return;
        }
      }

      if (text.match(/[^\n\x20-\x7e]/)) {
        if (!confirm('String contains un-pasteable character, continue?')) {
          return;
        }
      }
      sendString(document.querySelector('canvas'), text);
    }
  }

  if (document.title.endsWith(' - Proxmox Virtual Environment') && typeof Proxmox === 'object') {
    handleProxmox();
  }
  if ((document.title.endsWith(' - noVNC') || document.title.endsWith(' - Proxmox Console')) &&
      typeof noVNC_fallback_error !== 'undefined' && typeof noVNC_control_bar_anchor !== 'undefined' &&
      typeof noVNC_keyboardinput !== 'undefined') {
    handleNoVNC();
  }
})();
