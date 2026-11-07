export type Notification = {
  id: number;
  type: string;
  user: {
    name: string;
    avatar: string;
    fallback: string;
  };
  action: string;
  target?: string;
  content?: string;
  timestamp: string;
  timeAgo: string;
  isRead: boolean;
  hasActions?: boolean;
  file?: {
    name: string;
    size: string;
    type: string;
  };
};

export const notificationItems: Notification[] = [
  {
    id: 2,
    type: "follow",
    user: {
      name: "DirtyHand",
      avatar: "https://ipfs.io/ipfs/bafkreihydgumoemjtc32nvl2wznx7lkvrkubivqqu6nhzkywjac3wfwqr4",
      fallback: "D",
    },
    action: "followed you",
    timestamp: "Friday 3:04 PM",
    timeAgo: "2 hours ago",
    isRead: false,
  },
  {
    id: 3,
    type: "invitation",
    user: {
      name: "DirtyHand",
      avatar: "https://ipfs.io/ipfs/bafkreihydgumoemjtc32nvl2wznx7lkvrkubivqqu6nhzkywjac3wfwqr4",
      fallback: "D",
    },
    action: "invited you to",
    target: "Telegram Chat",
    timestamp: "Friday 2:22 PM",
    timeAgo: "3 hours ago",
    isRead: true,
    hasActions: true,
  },
  {
    id: 4,
    type: "file_share",
    user: {
      name: "DirtyHand",
      avatar: "https://ipfs.io/ipfs/bafkreihydgumoemjtc32nvl2wznx7lkvrkubivqqu6nhzkywjac3wfwqr4",
      fallback: "D",
    },
    action: "shared a file in",
    target: "Secret Club",
    file: {
      name: "Epstein Files: Trump's Deleted Tapes.mp4",
      size: "14 MB",
      type: "MP4",
    },
    timestamp: "Friday 1:40 PM",
    timeAgo: "4 hours ago",
    isRead: true,
  },
];
