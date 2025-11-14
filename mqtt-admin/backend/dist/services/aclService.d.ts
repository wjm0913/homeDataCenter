export type AclAccess = 'read' | 'write' | 'readwrite' | 'deny';
export interface AclEntry {
    user: string;
    topic: string;
    access: AclAccess;
}
export declare class AclService {
    static list(): Promise<AclEntry[]>;
    static save(entries: AclEntry[]): Promise<void>;
}
//# sourceMappingURL=aclService.d.ts.map