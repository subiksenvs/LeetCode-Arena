export interface AuthUser {
    id: string;
    username: string;
    name: string;
    role: "admin" | "user";
    token: string;
}
