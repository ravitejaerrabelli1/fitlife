import { getSessionUser } from "@/lib/auth";
import { searchFoods } from "@/lib/content/food-search";

export async function GET(request: Request): Promise<Response> {
  const user = await getSessionUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const query = new URL(request.url).searchParams.get("q")?.slice(0, 80) ?? "";
  return Response.json(query.trim().length >= 2 ? searchFoods(query, 8) : []);
}
