import type { Command, CommandResult, CommandContext } from '../../types/commands';
import type { OutputLine } from '../../types/terminal';
import { projects } from '../../data/projects';

export const projectsCommand: Command = {
  id: 'builtin:projects',
  name: 'projects',
  description: 'List portfolio projects',
  usage: 'projects [name|number]',
  handler: (args: string[], _context: CommandContext): CommandResult => {
    const lines: OutputLine[] = [];

    if (args.length === 0) {
      lines.push({ text: 'PROJECTS', type: 'heading' });
      lines.push({ text: '', type: 'text' });

      projects.forEach((project, index) => {
        lines.push({ text: `[${index + 1}] ${project.title}`, type: 'heading' });
        lines.push({ text: `    Period: ${project.period}`, type: 'dim' });
        lines.push({ text: `    ${project.description}`, type: 'text' });
        lines.push({
          text: `    Tags: ${project.tags.join(', ')}`,
          type: 'dim',
        });
        lines.push({ text: '', type: 'text' });
      });

      lines.push({ text: "Type 'projects <number>' or 'projects <name>' for details", type: 'dim' });
    } else {
      const query = args[0].toLowerCase();
      let selectedProject = projects.find((p) => {
        const indexMatch = !isNaN(Number(query)) && projects.indexOf(p) === Number(query) - 1;
        const nameMatch = p.id.toLowerCase().includes(query) || p.title.toLowerCase().includes(query);
        return indexMatch || nameMatch;
      });

      if (!selectedProject) {
        return {
          lines: [{ text: `projects: '${args[0]}': Project not found`, type: 'error' }],
          exitStatus: 1,
        };
      }

      lines.push({ text: selectedProject.title, type: 'heading' });
      lines.push({ text: '', type: 'text' });
      lines.push({ text: `Period: ${selectedProject.period}`, type: 'dim' });
      lines.push({ text: '', type: 'text' });
      lines.push({ text: selectedProject.description, type: 'text' });
      lines.push({ text: '', type: 'text' });
      lines.push({
        text: `Tags: ${selectedProject.tags.join(', ')}`,
        type: 'dim',
      });
      lines.push({ text: '', type: 'text' });
      lines.push({
        text: selectedProject.githubUrl,
        type: 'link',
      });
    }

    return {
      lines,
      exitStatus: 0,
    };
  },
};

export default projectsCommand;