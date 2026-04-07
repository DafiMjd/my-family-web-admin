import { useQuery } from '@tanstack/react-query';
import { familyTreeService } from '@/services/family-tree.service';

export function familyChildrenQueryKey(personId: string) {
  return ['family-tree', 'children', personId] as const;
}

export function useFamilyChildren(personId: string, enabled: boolean) {
  return useQuery({
    queryKey: familyChildrenQueryKey(personId),
    queryFn: () => familyTreeService.getChildren(personId),
    enabled: enabled && Boolean(personId),
    staleTime: 5 * 60 * 1000,
  });
}
