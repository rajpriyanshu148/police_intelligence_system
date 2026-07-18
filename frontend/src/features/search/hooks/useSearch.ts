import { useMutation } from '@tanstack/react-query'
import { searchService, type SearchRequest } from '@/services/search.service'
import { useToast } from '@/hooks/useToast'

export const useGlobalSearch = () => {
  const { addToast } = useToast()

  return useMutation({
    mutationFn: (payload: SearchRequest) => searchService.search(payload),
    onError: (err: any) => {
      addToast(err?.response?.data?.message || 'Global search failed.', 'error')
    },
  })
}
