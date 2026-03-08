import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CMS_PAGE_DEFAULTS, type CmsPageContent } from "@/lib/cms-defaults";

// ====== FETCH PAGE CONTENT ======
// Fetches from API with fallback to hardcoded defaults
export const useCmsPageContent = (slug: string) => {
  return useQuery<CmsPageContent>({
    queryKey: ["cms", "page", slug],
    queryFn: async () => {
      try {
        const data = await api.get<CmsPageContent>(`/cms/pages${slug.startsWith('/') ? slug : `/${slug}`}`);
        return data;
      } catch {
        // Fallback to defaults when API is unavailable
        const defaults = CMS_PAGE_DEFAULTS[slug];
        if (defaults) return defaults;
        throw new Error(`No content found for page: ${slug}`);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};

// ====== FETCH ALL CMS PAGES (admin) ======
export const useCmsAllPages = () => {
  return useQuery<CmsPageContent[]>({
    queryKey: ["cms", "pages", "all"],
    queryFn: async () => {
      try {
        return await api.get<CmsPageContent[]>("/cms/pages");
      } catch {
        // Fallback to all defaults
        return Object.values(CMS_PAGE_DEFAULTS);
      }
    },
    staleTime: 2 * 60 * 1000,
  });
};

// ====== SAVE PAGE CONTENT (admin) ======
export const useCmsSavePage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: CmsPageContent) => {
      try {
        return await api.put<CmsPageContent>(`/cms/pages${content.slug.startsWith('/') ? content.slug : `/${content.slug}`}`, content);
      } catch {
        // When API is unavailable, simulate save by updating cache
        return content;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["cms", "page", data.slug], data);
      queryClient.invalidateQueries({ queryKey: ["cms", "pages", "all"] });
    },
  });
};

// ====== SERVICE PAGE CONTENT ======
export const useCmsServiceContent = (service: string) => {
  const slug = service.startsWith("/") ? service : `/${service}`;
  return useCmsPageContent(slug);
};
