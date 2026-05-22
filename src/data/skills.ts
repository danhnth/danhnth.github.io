export interface Skills {
  languages: string[];
  tools: string[];
  platforms: string[];
  security: string[];
}

export const skills: Skills = {
  languages: ['Python', 'C++', 'Bash', 'SQL'],
  tools: ['Docker', 'Wireshark', 'Nmap'],
  platforms: ['AWS', 'Kubernetes', 'Linux'],
  security: ['SOC Ops', 'IDS/IPS'],
};

export default skills;