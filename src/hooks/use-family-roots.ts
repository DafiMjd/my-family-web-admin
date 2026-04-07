import { useQuery } from '@tanstack/react-query';
import { familyTreeService } from '@/services/family-tree.service';

export function useFamilyRoots() {
  return useQuery({
    queryKey: ['family-tree', 'roots'],
    queryFn: () => familyTreeService.getRoots(),
  });
}
