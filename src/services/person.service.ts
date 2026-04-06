import { apiClient } from '@/lib/api-client';
import type { LatestPeopleResponse } from '@/types/family-tree';

export const personService = {
  getLatestPeople: (limit = 5, offset = 0): Promise<LatestPeopleResponse> =>
    apiClient<LatestPeopleResponse>(`/api/person/latest/list?limit=${limit}&offset=${offset}`),
};
