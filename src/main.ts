import './styles/reset.css';
import './styles/tokens.css';
import './styles/terminal.css';
import './styles/mobile.css';
import './effects/css-fallback.css';

import { Terminal } from './terminal/terminal.ts';
import { CommandRegistry } from './commands/registry.ts';
import { PluginManager } from './commands/plugin.ts';
import { CRTEffectsManager } from './effects/crt-manager.ts';
import { detectGPUTier, getCRTConfig } from './utils/gpu-detect.ts';
import { BootSequence } from './boot/boot-sequence.ts';
import { initAudioIntegration } from './audio/integration.ts';
import { TouchKeyboard } from './terminal/touch-keyboard.ts';
import type { CommandContext } from './types/commands.ts';

// Import all commands
import { helpCommand } from './commands/impl/help.ts';
import { clearCommand } from './commands/impl/clear.ts';
import { echoCommand } from './commands/impl/echo.ts';
import { neofetchCommand } from './commands/impl/neofetch.ts';
import { whoamiCommand } from './commands/impl/whoami.ts';
import { aboutCommand } from './commands/impl/about.ts';
import { skillsCommand } from './commands/impl/skills.ts';
import { projectsCommand } from './commands/impl/projects.ts';
import { catCommand } from './commands/impl/cat.ts';
import { certsCommand } from './commands/impl/certs.ts';
import { contactCommand } from './commands/impl/contact.ts';
import { resumeCommand } from './commands/impl/resume.ts';

// Import data for CommandContext
import * as data from './data/index.ts';

async function main(): Promise<void> {
  // 1. Detect GPU tier and initialize CRT effects
  const gpuTier = detectGPUTier();
  const crtConfig = getCRTConfig(gpuTier);

  // 2. Create terminal container
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    throw new Error('App container not found');
  }

  // 3. Initialize terminal
  const terminal = new Terminal(appContainer);

  // 4. Initialize command registry with context
  let registry: CommandRegistry;
  const context: CommandContext = {
    terminal,
    data,
    get registry(): CommandRegistry {
      return registry;
    },
  };
  registry = new CommandRegistry(context);
  terminal.setRegistry(registry);

  // 5. Initialize plugin manager
  const pluginManager = new PluginManager();

  // 6. Register all commands
  registry.register(helpCommand);
  registry.register(clearCommand);
  registry.register(echoCommand);
  registry.register(neofetchCommand);
  registry.register(whoamiCommand);
  registry.register(aboutCommand);
  registry.register(skillsCommand);
  registry.register(projectsCommand);
  registry.register(catCommand);
  registry.register(certsCommand);
  registry.register(contactCommand);
  registry.register(resumeCommand);

  // Register any plugin commands
  for (const cmd of pluginManager.getAllCommands()) {
    registry.register(cmd);
  }

  // 7. Initialize CRT effects
  const crtManager = new CRTEffectsManager(gpuTier, crtConfig);
  crtManager.setTerminalElement(terminal.getElement());
  crtManager.initialize();

  // 8. Initialize touch keyboard (mobile)
  new TouchKeyboard(terminal.getElement(), (key) => {
    if (key === 'Ctrl+C') {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true })
      );
    } else if (key === 'Ctrl+L') {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'l', ctrlKey: true, bubbles: true })
      );
    } else {
      document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    }
  });

  // 9. Initialize boot sequence
  const bootSequence = new BootSequence(terminal);

  // 10. Initialize audio integration
  initAudioIntegration(terminal, bootSequence);

  // 11. Run boot sequence (handles localStorage internally)
  await bootSequence.run();

  // 12. Focus terminal
  terminal.focus();
}

// Start the application
main().catch((err) => {
  console.error('Failed to initialize CRT Terminal Portfolio:', err);
});
