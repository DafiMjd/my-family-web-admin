export const Gender = {
  MAN: 'MAN',
  WOMAN: 'WOMAN',
} as const;

export type Gender = (typeof Gender)[keyof typeof Gender];

export interface ParentPair {
  fatherId: string;
  motherId: string;
}

export interface Person {
  id: string;
  name: string;
  gender: Gender;
  birthDate: string;
  deathDate: string | null;
  bio: string | null;
  profilePictureUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LatestPeopleResponse {
  success: true;
  data: Person[];
  count: number;
  total: number;
  limit: number;
  offset: number;
}

export interface FamilyRoot {
  father: Person | null;
  mother: Person | null;
  isMarried: boolean;
  endMarriageDate: string | null;
}

export interface FamilyRootsResponse {
  success: boolean;
  data: FamilyRoot[];
  count: number;
}

/** Matches GET /api/family-tree/married-couples */
export interface MarriedCoupleEntry {
  father: Person & { relationshipType: string; spouses: unknown[] };
  mother: Person & { relationshipType: string; spouses: unknown[] };
}

export interface MarriedCouplesResponse {
  success: boolean;
  data: MarriedCoupleEntry[];
  count: number;
}

export interface PersonWithSpouse extends Person {
  relationshipType: string;
  spouse: Person | null;
  endMarriageDate: string | null;
}

export interface FamilyChildrenResponse {
  success: boolean;
  data: PersonWithSpouse[];
  count: number;
}

export interface ClosestRelatedPeople {
  spouse: Person | null;
  children: Person[];
  parents: Person[];
}

export interface ClosestRelatedPeopleResponse {
  success: boolean;
  data: ClosestRelatedPeople;
}

export interface PersonListResponse {
  success: boolean;
  data: Person[];
  count: number;
  total: number;
  limit: number;
  offset: number;
}

export interface FamilyListItem {
  id: string;
  name: string;
  description: string | null;
  father: Person | null;
  mother: Person | null;
  children: PersonWithSpouse[];
  createdAt: string;
  updatedAt: string;
}

export interface FamilyListResponse {
  success: boolean;
  data: FamilyListItem[];
  count: number;
  total: number;
  limit: number;
  offset: number;
}
