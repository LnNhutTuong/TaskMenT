export type JwtPayload = {
  sub: string;
  email: string;
  name: string | null;
};

export type LoginResponse = {
  accessToken: string;
  user: {
    email: string;
    name: string | null;
    roles: {
      system: string[],
      workspace: {
        workspaceName: string,
        role: string
      }[]
    }
  };
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};
