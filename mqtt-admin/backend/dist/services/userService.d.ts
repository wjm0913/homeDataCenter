export interface UserRecord {
    username: string;
    hash: string;
}
export declare class UserService {
    static list(): Promise<UserRecord[]>;
    static add(username: string, password: string): Promise<void>;
    static remove(username: string): Promise<void>;
}
//# sourceMappingURL=userService.d.ts.map