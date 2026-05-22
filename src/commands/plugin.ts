import type {
  Command,
  PluginManifest,
} from '../types/commands';
import type { BootStep } from '../types/boot.ts';

export class PluginManager {
  private readonly plugins: PluginManifest[] = [];

  registerPlugin(manifest: PluginManifest): void {
    this.plugins.push(manifest);
  }

  getAllCommands(): Command[] {
    const commands: Command[] = [];
    for (const plugin of this.plugins) {
      commands.push(...plugin.commands);
    }
    return commands;
  }

  getBootSteps(): BootStep[] {
    const steps: BootStep[] = [];
    for (const plugin of this.plugins) {
      if (plugin.bootHooks) {
        steps.push(...plugin.bootHooks);
      }
    }
    return steps;
  }

  getPlugins(): PluginManifest[] {
    return [...this.plugins];
  }
}
