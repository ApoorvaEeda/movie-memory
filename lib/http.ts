import { NextResponse } from "next/server";
import type { ApiErrorBody, ApiErrorCode } from "@/lib/types";

const NO_STORE = { "Cache-Control": "no-store" };

export function json<T>(data: T, status = 200) {
  return NextResponse.json<T>(data, { status, headers: NO_STORE });
}

export function jsonError(status: number, code: ApiErrorCode, message: string) {
  return NextResponse.json<ApiErrorBody>({ error: { code, message } }, { status, headers: NO_STORE });
}

export const unauthorized = () => jsonError(401, "UNAUTHORIZED", "Please sign in.");
