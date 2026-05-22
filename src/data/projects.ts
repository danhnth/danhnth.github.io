export interface Project {
  id: string;
  title: string;
  period: string;
  description: string;
  tags: string[];
  githubUrl: string;
}

export const projects: Project[] = [
  {
    id: 'ids-deep-learning',
    title: 'IDS Deep Learning',
    period: 'Sept 2025 – Dec 2025',
    description:
      'An Intrusion Detection System using Deep Learning to classify network traffic from PCAP files. Built with TensorFlow, processed packet captures using Wireshark to extract features for model training and evaluation.',
    tags: ['Python', 'TensorFlow', 'Wireshark', 'PCAP', 'Deep Learning'],
    githubUrl: 'https://github.com/OnlyD05905/Final_Projec_MMT',
  },
  {
    id: 'soc-implementation',
    title: 'SOC Implementation',
    period: 'Jan 2026 – Present',
    description:
      'A Security Operations Center (SOC) implementation using Docker, ELK Stack, and Linux. Focuses on centralized log collection, log analysis with SIEM tools, and real-time threat monitoring for enterprise environments.',
    tags: ['Docker', 'ELK Stack', 'Log Analysis', 'SIEM', 'Linux'],
    githubUrl: 'https://github.com/danhnth/btl_252_soc',
  },
];

export default projects;