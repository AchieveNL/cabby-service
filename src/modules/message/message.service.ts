import prisma from '@/lib/prisma';

export default class MessageService {
  public getUserConversations = async (userId: string) => {
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
                profilePhoto: true,
              },
            },
          },
        },
        recipient: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
                profilePhoto: true,
              },
            },
          },
        },
      },
    });

    // Group by conversation (unique pair of sender and recipient),
    // and take the latest message from each group.
    const groupedConversations = {};

    messages.forEach((message) => {
      // Distinguish between messages sent and received to identify the other user.
      const otherUser =
        message.sender.id === userId ? message.recipient : message.sender;

      // Create a unique key for the conversation, assuming user IDs are strings.
      const conversationKey = [message.sender.id, message.recipient.id]
        .sort()
        .join('-');

      if (
        !groupedConversations[conversationKey] ||
        groupedConversations[conversationKey].createdAt < message.createdAt
      ) {
        groupedConversations[conversationKey] = {
          lastMessage: message,
          otherUser,
        };
      }
    });

    // Convert the grouped conversations object to an array if needed
    const conversationsArray = Object.values(groupedConversations);

    return conversationsArray;
  };
}
