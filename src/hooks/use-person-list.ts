import { useQuery } from '@tanstack/react-query';
import { personService } from '@/services/person.service';

interface UsePersonListParams {
  limit: number;
  offset: number;
  name?: string;
  gender?: 'MAN' | 'WOMAN';
  status?: 'SINGLE' | 'MARRIED';
}

export function usePersonList(params: UsePersonListParams) {
  return useQuery({
    queryKey: ['person', 'list', params],
    queryFn: () => personService.getPersonList(params),
  });
}
