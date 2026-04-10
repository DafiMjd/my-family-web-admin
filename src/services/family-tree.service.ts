import { apiClient } from '@/lib/api-client';
import type {
  ClosestRelatedPeopleResponse,
  FamilyChildrenResponse,
  FamilyListResponse,
  FamilyRoot,
  MarriedCouplesResponse,
  Person,
  PersonWithSpouse,
  PersonListResponse,
  FamilyRootsResponse,
} from '@/types/family-tree';

interface PersonWithMarriageDates extends Person {
  startMarriageDate: string | null;
  endMarriageDate: string | null;
}

interface FamilyRootApiItem extends Person {
  spouses: PersonWithMarriageDates[];
}

interface FamilyRootsApiResponse {
  success: boolean;
  data: FamilyRootApiItem[];
  count: number;
}

interface FamilyChildApiItem extends Person {
  relationshipType: string;
  spouses: PersonWithMarriageDates[];
}

interface FamilyChildrenApiResponse {
  success: boolean;
  data: FamilyChildApiItem[];
  count: number;
}

function mapRootItemToFamilyRoots(item: FamilyRootApiItem): FamilyRoot[] {
  if (item.spouses.length === 0) {
    if (item.gender === 'MAN') {
      return [{ father: item, mother: null, isMarried: false, endMarriageDate: null }];
    }

    return [{ father: null, mother: item, isMarried: false, endMarriageDate: null }];
  }

  return item.spouses.map((spouse) => {
    if (item.gender === 'MAN') {
      return {
        father: item,
        mother: spouse,
        isMarried: true,
        endMarriageDate: spouse.endMarriageDate,
      };
    }

    return {
      father: spouse,
      mother: item,
      isMarried: true,
      endMarriageDate: spouse.endMarriageDate,
    };
  });
}

function mapChildItemToPeopleWithSpouse(item: FamilyChildApiItem): PersonWithSpouse[] {
  if (item.spouses.length === 0) {
    return [{ ...item, spouse: null, endMarriageDate: null }];
  }

  return item.spouses.map((spouse) => ({
    ...item,
    spouse,
    endMarriageDate: spouse.endMarriageDate,
  }));
}

interface AddChildrenRequestItem {
  name: string;
  gender: 'MAN' | 'WOMAN';
  birthDate: string;
  deathDate?: string;
}

interface AddChildrenRequest {
  parent: {
    fatherId: string;
    motherId: string;
  } | null;
  children: AddChildrenRequestItem[];
}

export const familyTreeService = {
  getRoots: async (): Promise<FamilyRootsResponse> => {
    const response = await apiClient<FamilyRootsApiResponse>('/api/family-tree/roots');
    const mappedRoots = response.data.flatMap(mapRootItemToFamilyRoots);

    return {
      success: response.success,
      data: mappedRoots,
      count: mappedRoots.length,
    };
  },
  getMarriedCouples: (): Promise<MarriedCouplesResponse> =>
    apiClient<MarriedCouplesResponse>('/api/family-tree/married-couples'),
  getChildren: async (params: {
    fatherId?: string;
    motherId?: string;
  }): Promise<FamilyChildrenResponse> => {
    const q = new URLSearchParams();
    if (params.fatherId) q.set('fatherId', params.fatherId);
    if (params.motherId) q.set('motherId', params.motherId);
    q.set('withSpouse', 'true');
    const response = await apiClient<FamilyChildrenApiResponse>(
      `/api/family-tree/children?${q.toString()}`,
    );
    const mappedChildren = response.data.flatMap(mapChildItemToPeopleWithSpouse);

    return {
      success: response.success,
      data: mappedChildren,
      count: mappedChildren.length,
    };
  },
  getClosestRelatedPeople: (personId: string): Promise<ClosestRelatedPeopleResponse> =>
    apiClient<ClosestRelatedPeopleResponse>(`/api/family-tree/${personId}/closest-related-people`),
  searchPeopleByName: (name: string, offset: number, limit: number): Promise<PersonListResponse> =>
    apiClient<PersonListResponse>(
      `/api/person/list?name=${encodeURIComponent(name)}&offset=${offset}&limit=${limit}`,
    ),
  getFamilyList: (params: {
    childrenId: string;
    fatherId?: string;
    motherId?: string;
    limit: number;
    offset: number;
  }): Promise<FamilyListResponse> => {
    const query = new URLSearchParams({
      childrenId: params.childrenId,
      limit: String(params.limit),
      offset: String(params.offset),
    });

    if (params.fatherId) {
      query.set('fatherId', params.fatherId);
    }

    if (params.motherId) {
      query.set('motherId', params.motherId);
    }

    return apiClient<FamilyListResponse>(`/api/family/list?${query.toString()}`);
  },
  addChildren: (body: AddChildrenRequest): Promise<{ success: boolean; data: unknown }> =>
    apiClient<{ success: boolean; data: unknown }>('/api/family-tree/add-children', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
