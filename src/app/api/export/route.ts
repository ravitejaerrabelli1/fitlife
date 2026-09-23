import { exportDataAction } from "@/app/actions";
import { getSessionUser } from "@/lib/auth";

export async function GET(): Promise<Response> {
  const user = await getSessionUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const json = await exportDataAction();
  return new Response(json, {
    headers: {
      "content-type": "application/json",
      "content-disposition": 'attachment; filename="fitlife-export.json"',
    },
  });
}
