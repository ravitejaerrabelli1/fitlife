import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./auth";
import { getProfile, type Profile } from "./profile";

export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  return user;
}

export async function requireOnboardedProfile(): Promise<{
  user: SessionUser;
  profile: Profile;
}> {
  const user = await requireSession();
  const profile = getProfile(user.id);
  if (!profile || !profile.onboarded) redirect("/onboarding");
  return { user, profile };
}
