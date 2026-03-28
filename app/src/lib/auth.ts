import {
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth"
import { auth } from "@/lib/firebase"

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, new GoogleAuthProvider())
}

export async function signInWithGitHub(): Promise<void> {
  await signInWithPopup(auth, new GithubAuthProvider())
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
}

export function providerLabel(providerId: string): string {
  const map: Record<string, string> = {
    "google.com": "Google",
    "github.com": "GitHub",
  }
  return map[providerId] ?? providerId
}
