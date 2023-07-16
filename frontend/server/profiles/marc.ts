import {
  EducationType,
  LanguageProficiency,
  Proficiency,
  Profile,
  ProjectType,
  Social,
} from '../profile.types';

export const marc: Profile = {
  person: {
    name: { first: 'Marc', last: 'Di Luzio' },
    image: { isURL: false, path: 'pp.png' },
    socials: [
      { type: Social.github, name: 'mdiluz' },
      { type: Social.linkedin, name: 'marcdiluzio' },
      { type: Social.email, name: 'marc@diluz.io' },
    ],
    // Fill this in
    // shortText: "Lorem Ipsum",
    languages: [{ lang: 'English', proficiency: LanguageProficiency.native }],
    nationalities: [{ title: 'British' }, { title: 'US-American' }],
    basedIn: { country: 'England', city: 'London' },
  },
  skills: {
    technical: [
      { title: 'C#', proficiency: Proficiency.strong },
      { title: 'C++', proficiency: Proficiency.strong },
      { title: 'C', proficiency: Proficiency.strong },
      { title: 'Linux', proficiency: Proficiency.strong },
      { title: 'Python', proficiency: Proficiency.strong },
      { title: 'Bash', proficiency: Proficiency.strong },
      { title: 'Unity', proficiency: Proficiency.strong },
      { title: 'Docker', proficiency: Proficiency.strong },

      { title: 'ASP.Net', proficiency: Proficiency.knowledgeable },
      { title: 'Golang', proficiency: Proficiency.knowledgeable },
      { title: 'SQL', proficiency: Proficiency.knowledgeable },
      { title: 'K8s', proficiency: Proficiency.knowledgeable },
      { title: 'OpenGL', proficiency: Proficiency.knowledgeable },
      { title: 'Vulkan', proficiency: Proficiency.knowledgeable },
      { title: 'Perl', proficiency: Proficiency.knowledgeable },
    ],
    education: [
      {
        title: 'MSc, Video Game Development',
        type: EducationType.university,
        source: 'Birmingham City University (Sony Scholarship)',
        date: new Date(2013, 7),
      },
      {
        title: 'Ba, Computer Visualisation and Animation',
        type: EducationType.university,
        source: 'Bournemouth University',
        date: new Date(2012, 7),
      },
    ],
  },
  projects: {
    list: [
      {
        title: 'Unity',
        role: 'Lead Software Engineer',
        url: 'https://unity.com/',
        image: 'unity.png',
        description:
          'Leading a tools team in Release Engineering, working on a variety of projects focusing on better release workflows, bug tracking and quality barriers.',
        timeframe: {
          start: new Date(2021, 12),
          end: 'current',
        },
        showInProfile: true,
        type: ProjectType.job,
        technologies: ['ASP.NET', 'Kubernetes', 'CI/CD'],
        highlights: ['Building a team of fantastic developers'],
      },
      {
        title: 'Unity',
        role: 'Senior Software Engineer',
        url: 'https://unity.com/',
        image: 'unity.png',
        description:
          'Worked in Sustained Engineering, focusing on Linux bugs and infrastructure.',
        timeframe: {
          start: new Date(2018, 4),
          end: new Date(2021, 12),
        },
        showInProfile: true,
        type: ProjectType.job,
        highlights: ['Releasing the Linux Editor out of Preview'],
        technologies: ['C/C++/C#', 'Vulkan/OpenGL', 'CI/CD'],
      },
      {
        title: 'Rove',
        role: 'Developer and Designer',
        url: 'https://github.com/mdiluz/rove',
        image: 'rove.png',
        description:
          'An asynchronous nomadic game about exploring as part of a loose community.',
        timeframe: {
          start: new Date(2020, 3),
          end: 'current',
        },
        showInProfile: true,
        type: ProjectType.sideproject,
        technologies: ['Golang', 'protobuf', 'GRPC'],
      },

      {
        title: 'GameMode',
        role: 'Founding Developer, now Contributor',
        url: 'https://github.com/FeralInteractive/gamemode',
        description: 'An open source operating system optimiser for Linux',
        timeframe: {
          start: new Date(2018, 3),
          end: 'current',
        },
        showInProfile: true,
        type: ProjectType.sideproject,
        highlights: [
          'Added as a default package shipped with all Ubuntu Desktop installs',
        ],
        technologies: ['C', 'SDbus', 'Meson', 'Inih'],
      },
      {
        title: 'Feral Interactive',
        role: 'Linux Group lead',
        url: 'https://www.feralinteractive.com/en/',
        image: 'feral_interactive.png',
        description:
          'Lead the Linux platform development while porting many AAA games such as XCOM2, Mad Max and HITMAN',
        timeframe: {
          start: new Date(2013, 8),
          end: new Date(2015, 5),
        },
        showInProfile: true,
        type: ProjectType.job,
        highlights: [
          'Built a small team of great developers',
          'Spearheaded Vulkan games development on Linux with Mad Max',
          'Shipped over 30 titles to Linux',
        ],
        technologies: ['C++', 'Vulkan/OpenGL'],
      },
      {
        title: 'Feral Interactive',
        role: 'Software Developer',
        url: 'https://www.feralinteractive.com/en/',
        image: 'feral_interactive.png',
        description:
          'Worked on Mac and Linux ports for a variety of games including ROME: Total War, Tomb Raider and XCOM',
        timeframe: {
          start: new Date(2015, 5),
          end: new Date(2018, 3),
        },
        showInProfile: true,
        type: ProjectType.job,
        highlights: [
          "Shipped a single executable supporting both ROME and it's standalone expansions on Mac",
          'Worked on shipping the first Linux game Feral sold',
        ],
        technologies: ['C++', 'OpenGL', 'CMake', 'Perl'],
      },
    ],
  },
};
