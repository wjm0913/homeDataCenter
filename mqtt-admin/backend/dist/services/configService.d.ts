export interface MosquittoConfig {
    [key: string]: string;
}
export declare class ConfigService {
    static read(): Promise<MosquittoConfig>;
    static save(newConfig: MosquittoConfig): Promise<void>;
}
//# sourceMappingURL=configService.d.ts.map