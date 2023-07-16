import {
  EducationType,
  LanguageProficiency,
  Proficiency,
  Profile,
  // ProjectType,
  Social,
} from '../profile.types';

export const julian: Profile = {
  person: {
    name: { first: 'Julian', last: 'Di Luzio' },
    // profession: 'Fullstack Developer, Games Engineer. CTO @ flint.gg',
    image: { isURL: false, path: 'pp.png' },
    socials: [
      { type: Social.github, name: '7crmbs2' },
      { type: Social.linkedin, name: 'julian-di-luzio' },
      { type: Social.email, name: 'julian@diluz.io' },
    ],
    shortText: 'cyber security enthusiast, baseball player, biker.',
    languages: [
      { lang: 'German', proficiency: LanguageProficiency.native },
      { lang: 'English', proficiency: LanguageProficiency.native },
    ],
    nationalities: [{ title: 'German' }, { title: 'US-American' }],
    basedIn: { country: 'Germany', city: 'Munich' },
  },
  skills: {
    technical: [
      { title: 'Linux', proficiency: Proficiency.strong },
      { title: 'Windows', proficiency: Proficiency.strong },
      { title: 'Kali', proficiency: Proficiency.knowledgeable },
      { title: 'Bash', proficiency: Proficiency.strong },
      { title: 'Powershell', proficiency: Proficiency.knowledgeable },
      { title: 'Python', proficiency: Proficiency.knowledgeable },
      { title: 'Golang', proficiency: Proficiency.knowledgeable },
      { title: 'Kubernetes', proficiency: Proficiency.strong },
      { title: 'Ansible', proficiency: Proficiency.knowledgeable },
      { title: 'Terraform', proficiency: Proficiency.knowledgeable },
      { title: 'Gitlab / Gitlab CI', proficiency: Proficiency.knowledgeable },
      { title: 'Prometheus', proficiency: Proficiency.strong },
      { title: 'Grafana', proficiency: Proficiency.strong },
    ],
    education: [
      {
        title: 'secondary school certificate',
        type: EducationType.school,
        source: 'Dr.-Josef-Schwalber-Realschule Dachau ',
        date: new Date(2017, 6),
        link: 'https://realschuledachau.de/',
      },
    ],
  },
  projects: {
    list: [],
    final: {
      title: 'The beginning of time',
      text: 'If you want to see some side projects, take a look at my GitHub.',
    },
  },
};
