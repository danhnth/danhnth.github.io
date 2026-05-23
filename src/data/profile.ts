export interface Profile {
  name: string;
  title: string;
  location: string;
  university: string;
  year: string;
  major: string;
  bio: string;
  email: string;
  emailDisplay: string;
  linkedin: string;
  linkedinDisplay: string;
  github: string;
  githubDisplay: string;
  resumeUrl: string;
}

export const profile: Profile = {
  name: 'Nguyen Thanh Danh',
  title: 'Cybersecurity Engineer & SOC Specialist',
  location: 'Ho Chi Minh City, Vietnam',
  university: 'Ho Chi Minh City University of Technology (HCMUT)',
  year: '3rd year',
  major: 'Computer Science, Cybersecurity specialization',
  bio: "I'm a 3rd-year Computer Science student at Ho Chi Minh City University of Technology (HCMUT), specializing in Cybersecurity. I build intelligent security systems — from deep-learning-powered Intrusion Detection Systems to full-scale SOC architectures.",
  email: 'mailto:tdanh2005@gmail.com',
  emailDisplay: 'tdanh2005@gmail.com',
  linkedin: 'https://linkedin.com/in/danhnt24',
  linkedinDisplay: 'linkedin.com/in/danhnt24',
  github: 'https://github.com/danhnth',
  githubDisplay: 'github.com/danhnth',
  resumeUrl: '/assets/Nguyen_Thanh_Danh_CV.pdf',
};

export default profile;