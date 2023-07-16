export enum Social { linkedin, github, email, website, mastodon }

export enum LanguageProficiency {
  native = 'Native',
  C2 = 'C2',
  C1 = 'C1',
  B2 = 'B2',
  B1 = 'B1',
  A2 = 'A2',
  A1 = 'A1',
}

export enum Proficiency {
  strong = 0x0001,
  knowledgeable = 0x1001,
}

export enum EducationType {
  school = 'school',
  university = 'file-certificate',
}

type Person = {
  name: {
    first: string;
    last: 'Di Luzio'; // we could support other spellings of the name later on
  };
  image?: { isURL: boolean; path: string };
  shortText?: string;
  socials: Array<{ type: Social; name: string }>;
  languages?: Array<{ lang: string; proficiency: LanguageProficiency }>;
  nationalities?: Array<{ title: string }>;
  basedIn?: { country: string; city?: string };
};

export enum ProjectType {
  sideproject,
  job,
}

export type Project = {
  title: string;
  role: string;
  image?: string;
  description: string;
  highlights?: Array<string>;
  url?: string;
  technologies?: Array<string>;
  timeframe: { start: Date; end: Date | 'current' };
  subprojects?: Array<Project>;
  showInProfile: boolean;
  type: ProjectType;
};

type Skills = {
  technical?: Array<{ title: string; proficiency: Proficiency }>;
  certificates?: Array<{ title: string; link?: string }>;
  education?: Array<{
    source: string;
    title: string;
    date?: Date;
    link?: string;
    type: EducationType;
  }>;
  misc?: Array<{ title: string }>;
};

export type Profile = {
  person: Person;
  skills: Skills;
  projects: {
    list: Array<Project>;
    final?: {
      title: string;
      text: string;
    };
  };
};
