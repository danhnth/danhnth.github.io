import type { Command, CommandResult, CommandContext } from '../../types/commands';
import type { OutputLine } from '../../types/terminal';
import { profile } from '../../data/profile';
import { projects } from '../../data/projects';

interface VirtualFile {
  content: OutputLine[];
}

function getVirtualFiles(): Record<string, VirtualFile> {
  return {
    'about.md': {
      content: [
        { text: 'ABOUT', type: 'heading' },
        { text: '', type: 'text' },
        { text: profile.bio, type: 'text' },
        { text: '', type: 'text' },
        { text: `Name: ${profile.name}`, type: 'text' },
        { text: `Title: ${profile.title}`, type: 'text' },
        { text: `Location: ${profile.location}`, type: 'text' },
        { text: `University: ${profile.university}`, type: 'text' },
        { text: `Year: ${profile.year}`, type: 'text' },
        { text: `Major: ${profile.major}`, type: 'text' },
      ],
    },
    'projects/ids.md': {
      content: (() => {
        const project = projects.find((p) => p.id === 'ids-deep-learning');
        if (!project) return [{ text: 'Project not found', type: 'error' }];
        return [
          { text: project.title, type: 'heading' },
          { text: '', type: 'text' },
          { text: `Period: ${project.period}`, type: 'dim' },
          { text: '', type: 'text' },
          { text: project.description, type: 'text' },
          { text: '', type: 'text' },
          { text: `Tags: ${project.tags.join(', ')}`, type: 'dim' },
          { text: '', type: 'text' },
          { text: project.githubUrl, type: 'link' },
        ];
      })(),
    },
    'projects/soc.md': {
      content: (() => {
        const project = projects.find((p) => p.id === 'soc-implementation');
        if (!project) return [{ text: 'Project not found', type: 'error' }];
        return [
          { text: project.title, type: 'heading' },
          { text: '', type: 'text' },
          { text: `Period: ${project.period}`, type: 'dim' },
          { text: '', type: 'text' },
          { text: project.description, type: 'text' },
          { text: '', type: 'text' },
          { text: `Tags: ${project.tags.join(', ')}`, type: 'dim' },
          { text: '', type: 'text' },
          { text: project.githubUrl, type: 'link' },
        ];
      })(),
    },
    'resume.txt': {
      content: [
        { text: 'RESUME', type: 'heading' },
        { text: '', type: 'text' },
        { text: 'Nguyen Thanh Danh', type: 'heading' },
        { text: profile.title, type: 'text' },
        { text: '', type: 'text' },
        { text: `${profile.university} - ${profile.year}`, type: 'text' },
        { text: `Location: ${profile.location}`, type: 'text' },
        { text: '', type: 'text' },
        { text: 'Download PDF:', type: 'dim' },
        { text: profile.resumeUrl, type: 'link' },
      ],
    },
    'skills.txt': {
      content: [
        { text: 'SKILLS', type: 'heading' },
        { text: '', type: 'text' },
        { text: 'Use the "skills" command to view skills by category.', type: 'text' },
      ],
    },
    'contact.txt': {
      content: [
        { text: 'CONTACT', type: 'heading' },
        { text: '', type: 'text' },
        { text: `Email: ${profile.email}`, type: 'text' },
        { text: `LinkedIn: ${profile.linkedin}`, type: 'text' },
        { text: `GitHub: ${profile.github}`, type: 'text' },
      ],
    },
  };
}

export const catCommand: Command = {
  id: 'builtin:cat',
  name: 'cat',
  description: 'Display file contents',
  usage: 'cat <file>',
  handler: (args: string[], _context: CommandContext): CommandResult => {
    if (args.length === 0) {
      return {
        lines: [{ text: 'cat: missing file operand', type: 'error' }],
        exitStatus: 1,
      };
    }

    const path = args[0];
    const files = getVirtualFiles();
    const file = files[path];

    if (!file) {
      return {
        lines: [{ text: `cat: ${path}: No such file or directory`, type: 'error' }],
        exitStatus: 1,
      };
    }

    return {
      lines: file.content,
      exitStatus: 0,
    };
  },
};

export default catCommand;