import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import GitHub from "next-auth/providers/github"

declare module "next-auth" {
  interface Session {
    accessToken: string
    provider: string
  }
}


export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/drive.file",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    MicrosoftEntraID({
      authorization: {
        params: {
          scope:
            "openid email profile offline_access Files.ReadWrite.AppFolder User.Read",
        },
      },
    }),
    GitHub,
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.provider = account.provider
      }
      return token
    },
    session({ session, token }) {
      session.accessToken = (token.accessToken as string) ?? ""
      session.provider = (token.provider as string) ?? ""
      return session
    },
  },
})
