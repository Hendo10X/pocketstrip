import type { User, Session } from "better-auth/types";

export type Variables = {
    user: User;
    session: Session;
    membership: {
        id: string;
        projectId: string;
        userId: string;
        role: string;
        createdAt: Date;
    };
    project: {
        id: string;
        name: string;
        slug: string;
        ownerId: string;
        webhookSecret: string;
        createdAt: Date;
    };
};
