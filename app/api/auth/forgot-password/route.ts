import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ForgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    // Generic safe response to prevent user enumeration
    return NextResponse.json({
      success: true,
      message:
        "If an account exists with that email, a password reset link has been dispatched.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
}
