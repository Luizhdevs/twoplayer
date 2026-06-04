import { api } from "@/lib/api";

export type MediaCategory =
  | "AVATAR"
  | "PROVIDER_GALLERY"
  | "SERVICE_GALLERY"
  | "DISPUTE_EVIDENCE"
  | "DOCUMENT";

export const mediaService = {
  upload: async (
    file:     File,
    category: MediaCategory,
  ): Promise<{ id: string; url: string }> => {
    const form = new FormData();
    form.append("file", file);
    form.append("category", category);
    const { data } = await api.post<{ data: { id: string; url: string } }>(
      "/media/upload",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.data;
  },

  remove: async (id: string) => {
    await api.delete(`/media/${id}`);
  },
};
