import type { AuthMeUser } from "@/features/parcelles/api";

export const isProfileComplete = (user: AuthMeUser | null | undefined): boolean =>
  Boolean(user?.wilaya && String(user.wilaya).trim().length > 0);
