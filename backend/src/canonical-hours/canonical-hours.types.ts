export type CanonicalHourType =
  | 'invitatory'
  | 'office_of_readings'
  | 'lauds'
  | 'terce'
  | 'sext'
  | 'none'
  | 'vespers'
  | 'compline';

export type LiturgicalRank =
  | 'solemnity'
  | 'feast'
  | 'obligatory_memorial'
  | 'optional_memorial'
  | 'ferial';

export type LiturgicalColor = 'green' | 'white' | 'red' | 'purple' | 'rose';

export interface PsalmItem {
  number?: string;
  antiphon: string;
  title: string;
  subtitle?: string;
  verses: string[];
  gloryBe?: string;
}

export interface CanonicalHourContent {
  introductoryVerse?: string;
  invitatory?: {
    antiphon: string;
    psalmText: string[];
  };
  hymn?: {
    title?: string;
    rubric?: string;
    verses: string[];
  };
  psalmody?: PsalmItem[];
  firstReading?: {
    heading?: string;
    title?: string;
    citation?: string;
    text: string;
  };
  firstResponsory?: {
    versicle?: string;
    response?: string;
    fullText?: string;
  };
  secondReading?: {
    heading?: string;
    title?: string;
    citation?: string;
    text: string;
  };
  secondResponsory?: {
    versicle?: string;
    response?: string;
    fullText?: string;
  };
  teDeum?: {
    title: string;
    verses: string[];
  };
  briefReading?: {
    citation?: string;
    text: string;
  };
  briefResponsory?: {
    text: string;
  };
  evangelicalCanticle?: {
    type: 'benedictus' | 'magnificat' | 'nunc_dimittis';
    antiphon: string;
    title: string;
    verses: string[];
  };
  intercessions?: {
    introduction?: string;
    response?: string;
    intentions: string[];
    ourFather?: string;
  };
  closingPrayer?: {
    rubric?: string;
    text: string;
  };
  conclusion?: {
    text: string;
  };
  finalAntiphonMarian?: {
    title?: string;
    text: string;
    latinText?: string;
  };
  rawCleanText?: string;
}

export interface DailyCanonicalHourRecord {
  id?: string;
  date: string;
  hour_type: CanonicalHourType;
  liturgical_color: LiturgicalColor;
  liturgical_rank: LiturgicalRank;
  celebration_title: string;
  source_url?: string;
  has_memorial: boolean;
  memorial_title?: string;
  content: CanonicalHourContent;
  memorial_content?: Partial<CanonicalHourContent>;
  ferial_content?: Partial<CanonicalHourContent>;
  created_at?: string;
  updated_at?: string;
}
