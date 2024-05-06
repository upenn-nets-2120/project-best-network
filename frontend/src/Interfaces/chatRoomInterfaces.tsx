export interface Invite {
    inviteID: number;
    inviteUsername: string;
    senderUsername: string;
    room: Room;
  }
  
  export interface Room {
    roomID: number;
    users: string[];
    notification: boolean;
    notificationMessage: string;
  }
  
  export interface Message {
    sender: string;
    message: string;
    timestamp: number;
    roomID: number;
  }