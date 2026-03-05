import {
  createLibrarySendAndConfirm,
  addBookSendAndConfirm,
  removeBookSendAndConfirm,
  toggleAvailabilitySendAndConfirm,
} from "../client/rpc";
import { checkSolBalance } from "../utils/validation";
import type { ActionContext } from "../shared/types";

// ---------- create_library ----------

export interface CreateLibraryActionParams {
  name: string;
}

export interface CreateLibraryActionResult {
  signature: string;
}

export async function createLibraryAction(
  ctx: ActionContext,
  args: CreateLibraryActionParams
): Promise<CreateLibraryActionResult> {
  const { connection, walletPubKey } = ctx;
  const balanceCheck = checkSolBalance(connection, walletPubKey);
  if (!balanceCheck.sufficient) {
    throw new Error(balanceCheck.error ?? "Insufficient SOL for transaction fees.");
  }
  const signature = await createLibrarySendAndConfirm(walletPubKey, { name: args.name });
  return { signature };
}

// ---------- add_book ----------

export interface AddBookActionParams {
  name: string;
  pages: number;
}

export interface AddBookActionResult {
  signature: string;
}

export async function addBookAction(
  ctx: ActionContext,
  args: AddBookActionParams
): Promise<AddBookActionResult> {
  const { connection, walletPubKey } = ctx;
  const balanceCheck = checkSolBalance(connection, walletPubKey);
  if (!balanceCheck.sufficient) {
    throw new Error(balanceCheck.error ?? "Insufficient SOL for transaction fees.");
  }
  const signature = await addBookSendAndConfirm(walletPubKey, {
    name: args.name,
    pages: args.pages,
  });
  return { signature };
}

// ---------- remove_book ----------

export interface RemoveBookActionParams {
  name: string;
}

export interface RemoveBookActionResult {
  signature: string;
}

export async function removeBookAction(
  ctx: ActionContext,
  args: RemoveBookActionParams
): Promise<RemoveBookActionResult> {
  const { connection, walletPubKey } = ctx;
  const balanceCheck = checkSolBalance(connection, walletPubKey);
  if (!balanceCheck.sufficient) {
    throw new Error(balanceCheck.error ?? "Insufficient SOL for transaction fees.");
  }
  const signature = await removeBookSendAndConfirm(walletPubKey, { name: args.name });
  return { signature };
}

// ---------- toggle_availability ----------

export interface ToggleAvailabilityActionParams {
  name: string;
}

export interface ToggleAvailabilityActionResult {
  signature: string;
}

export async function toggleAvailabilityAction(
  ctx: ActionContext,
  args: ToggleAvailabilityActionParams
): Promise<ToggleAvailabilityActionResult> {
  const { connection, walletPubKey } = ctx;
  const balanceCheck = checkSolBalance(connection, walletPubKey);
  if (!balanceCheck.sufficient) {
    throw new Error(balanceCheck.error ?? "Insufficient SOL for transaction fees.");
  }
  const signature = await toggleAvailabilitySendAndConfirm(walletPubKey, { name: args.name });
  return { signature };
}
