export interface Cert {
  id: string;
  name: string;
  issuer: string;
  year: number;
  score?: string;
  type: 'certificate' | 'proficiency' | 'award';
}

export const certs: Cert[] = [
  {
    id: 'google-cybersecurity',
    name: 'Google Cybersecurity Professional Certificate',
    issuer: 'Google',
    year: 2026,
    type: 'certificate',
  },
  {
    id: 'toeic',
    name: 'TOEIC English Proficiency',
    issuer: 'ETS',
    year: 2024,
    score: '850/990',
    type: 'proficiency',
  },
  {
    id: 'hcmut-academic',
    name: 'Outstanding Academic Performance Recognition',
    issuer: 'HCMUT',
    year: 2024,
    type: 'award',
  },
];

export default certs;