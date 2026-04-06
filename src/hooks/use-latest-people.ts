import { useQuery } from '@tanstack/react-query';
import { personService } from '@/services/person.service';

export function useLatestPeople(limit = 5, offset = 0) {
  return useQuery({
    queryKey: ['latest-people', limit, offset],
    queryFn: () => personService.getLatestPeople(limit, offset),
  });
}
