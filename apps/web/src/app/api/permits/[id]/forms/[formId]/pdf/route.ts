import { NextRequest } from "next/server";
import {
  getAuthenticatedUser,
  unauthorized,
  serverError,
} from "@/lib/api-auth";
import { checkPermitAccess, forbidden } from "@/lib/rbac";
import { generateFormPDF } from "@/lib/pdf";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; formId: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  try {
    const { id, formId } = await params;
    const access = await checkPermitAccess(id, user.id);
    if (!access) return forbidden("You don't have access to this permit");

    const { html, title } = await generateFormPDF(formId);

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${title}.html"`,
      },
    });
  } catch (error) {
    console.error("Generate PDF error:", error);
    return serverError("Failed to generate form PDF");
  }
}
