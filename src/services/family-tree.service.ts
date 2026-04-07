import { apiClient } from '@/lib/api-client';
import type {
  ClosestRelatedPeopleResponse,
  FamilyChildrenResponse,
  FamilyListResponse,
  PersonListResponse,
  FamilyRootsResponse,
} from '@/types/family-tree';

interface AddChildrenRequestItem {
  name: string;
  gender: 'MAN' | 'WOMAN';
  birthDate: string;
  deathDate?: string;
}

interface AddChildrenRequest {
  parentId: string;
  children: AddChildrenRequestItem[];
}

export const familyTreeService = {
  getRoots: (): Promise<FamilyRootsResponse> =>
    apiClient<FamilyRootsResponse>('/api/family-tree/roots'),
  getChildren: (personId: string): Promise<FamilyChildrenResponse> =>
    apiClient<FamilyChildrenResponse>(`/api/family-tree/${personId}/children?withSpouse=true`),
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
