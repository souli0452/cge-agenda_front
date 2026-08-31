export interface UserAccount {
    id?:               string;
    username:          string;
    email:             string;
    firstName:         string;
    lastName:          string;
    roles:             string[];
    enabled:           boolean;
    emailVerified?:    boolean;
    createdTimestamp?: number;
}
