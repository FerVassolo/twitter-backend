import {CursorPagination} from "main/types";
import {Post, PostStatus, PrismaClient} from "@prisma/client";


export function buildPostFilter(followingUserIds: string[], retrieveComments: string | null = null, status?: PostStatus): object {
  return {
    AND: {
      OR: [
        { authorId: { in: followingUserIds } },
        { author: { isPublic: true } },
      ],
      respondsTo: retrieveComments ? { id: retrieveComments } : null,
      status: status ?? PostStatus.APPROVED
    }
  };
}
