import {
  IsEnum,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  IsObject,
  ValidateNested,
} from 'class-validator';

// The following DTO was generated based on http://nodeinfo.diaspora.software/ns/schema/2.1

export enum Protocol {
  ActivityPub = 'activitypub',
  Buddycloud = 'buddycloud',
  Dfrn = 'dfrn',
  Diaspora = 'diaspora',
  Libertree = 'libertree',
  OStatus = 'ostatus',
  Pumpio = 'pumpio',
  Tent = 'tent',
  XMPP = 'xmpp',
  Zot = 'zot',
}

enum Service {
  Atom = 'atom1.0',
  GNUsocial = 'gnusocial',
  IMAP = 'imap',
  Pnut = 'pnut',
  POP3 = 'pop3',
  Pumpio = 'pumpio',
  RSS = 'rss2.0',
  Twitter = 'twitter',
  Blogger = 'blogger',
  Dreamwidth = 'dreamwidth',
  Drupal = 'drupal',
  Facebook = 'facebook',
  Friendica = 'friendica',
  Google = 'google',
  InsaneJournal = 'insanejournal',
  Libertree = 'libertree',
  LinkedIn = 'linkedin',
  LiveJournal = 'livejournal',
  MediaGoblin = 'mediagoblin',
  MySpace = 'myspace',
  Pinterest = 'pinterest',
  Posterous = 'posterous',
  RedMatrix = 'redmatrix',
  SMTP = 'smtp',
  Tumblr = 'tumblr',
  WordPress = 'wordpress',
  XMPP = 'xmpp',
}

class Software {
  @IsString()
    name: string;

  @IsString()
    version: string;

  @IsString()
    repository?: string;

  @IsString()
    homepage?: string;
}

class UsageUsers {
  @IsInt()
  @Min(0)
    total: number;

  @IsInt()
  @Min(0)
    activeHalfyear: number;

  @IsInt()
  @Min(0)
    activeMonth: number;
}

class Usage {
  @ValidateNested()
    users: UsageUsers;

  @IsInt()
  @Min(0)
    localPosts: number;

  @IsInt()
  @Min(0)
    localComments: number;
}

export class NodeInfoDto {
  @IsString()
    version: '2.1';

  @ValidateNested()
    software: Software;

  @IsEnum(Protocol, { each: true })
    protocols: Protocol[];

  @IsObject()
  @ValidateNested()
    services: {
    inbound?: Service[];
    outbound?: Service[];
  };

  @IsBoolean()
    openRegistrations: boolean;

  @ValidateNested()
    usage: Usage;

  @IsObject()
    metadata: Record<string, unknown>;
}
