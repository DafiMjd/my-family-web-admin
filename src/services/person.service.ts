import { apiClient } from '@/lib/api-client';
import type { LatestPeopleResponse, PersonListResponse } from '@/types/family-tree';

interface CreatePersonRequest {
  parentId?: string;
  name: string;
  gender: 'MAN' | 'WOMAN';
  birthDate: string;
  deathDate: string | null;
}

interface FamilyPersonPayload {
  parentId?: string;
  name: string;
  gender: 'MAN' | 'WOMAN';
  birthDate: string;
  deathDate: string | null;
}

interface CreateFamilyRequest {
  father: FamilyPersonPayload;
  mother: FamilyPersonPayload;
  children: Array<Omit<FamilyPersonPayload, 'parentId'>>;
}

interface MarriagePersonPayload {
  personId?: string;
  newPerson?: FamilyPersonPayload;
}

interface CreateMarriageRequest {
  person1: MarriagePersonPayload;
  person2: MarriagePersonPayload;
  startDate?: string;
}

export const personService = {
  getLatestPeople: (limit = 5, offset = 0): Promise<LatestPeopleResponse> =>
    apiClient<LatestPeopleResponse>(`/api/person/latest/list?limit=${limit}&offset=${offset}`),
  getPersonList: (params: {
    limit: number;
    offset: number;
    name?: string;
    gender?: 'MAN' | 'WOMAN';
    status?: 'SINGLE' | 'MARRIED';
  }): Promise<PersonListResponse> => {
    const query = new URLSearchParams({
      limit: String(params.limit),
      offset: String(params.offset),
    });

    if (params.name && params.name.trim().length > 0) {
      query.set('name', params.name.trim());
    }

    if (params.gender) {
      query.set('gender', params.gender);
    }

    if (params.status) {
      query.set('status', params.status);
    }

    return apiClient<PersonListResponse>(`/api/person/list?${query.toString()}`);
  },
  createPerson: (body: CreatePersonRequest): Promise<{ success: boolean; data: unknown }> =>
    apiClient<{ success: boolean; data: unknown }>('/api/person/one', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  createFamily: (body: CreateFamilyRequest): Promise<{ success: boolean; data: unknown }> =>
    apiClient<{ success: boolean; data: unknown }>('/api/family/one', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  createMarriage: (body: CreateMarriageRequest): Promise<{ success: boolean; data: unknown }> =>
    apiClient<{ success: boolean; data: unknown }>('/api/marriage/marry', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
