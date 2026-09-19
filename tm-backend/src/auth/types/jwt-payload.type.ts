import { RoleName } from '../../generated/prisma/enums.js';

export type JwtPayload = {
  sub: string;
  email: string;
  name: string | null;
  role: RoleName;
};

export type LoginResponse = {
  accessToken: string;
  user: {
    email: string;
    name: string | null;
  };
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: RoleName;
};
