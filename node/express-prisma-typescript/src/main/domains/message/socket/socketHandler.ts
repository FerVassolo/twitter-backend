import { Server, Socket } from "socket.io";
import { db, Logger, socketAuth } from "main/utils";
import { FollowerService, FollowerServiceImpl } from "@main/domains/follower/service";
import { FollowerRepositoryImpl } from "@main/domains/follower/repository";
import { UserService, UserServiceImpl } from "@main/domains/user/service";
import { UserRepositoryImpl } from "@main/domains/user/repository";
import {UserViewDTO} from "@main/domains/user/dto";
import {MessageService} from "@main/domains/message/service/message.service";
import {MessageServiceImpl} from "@main/domains/message/service/message.service.impl";
import {MessageRepositoryImpl} from "@main/domains/message/repository/message.repository.impl";

export class SocketHandler {
  private io: Server;
  private connectedUsers: Map<string, Set<string>>; // Map<UserId, Set<SocketId>>
  private followerService: FollowerService;
  private userService: UserService;
  private service: MessageService;

  constructor(io: Server) {
    this.io = io;
    this.connectedUsers = new Map<string, Set<string>>();
    this.followerService = new FollowerServiceImpl(new FollowerRepositoryImpl(db));
    this.userService = new UserServiceImpl(new UserRepositoryImpl(db));
    this.service = new MessageServiceImpl(new MessageRepositoryImpl(db));
  }

  public async setupHandlers(): Promise<void> {
    this.io.use(socketAuth);

    this.io.on("connection", async (socket) => {
      Logger.info(`User connected: ${socket.id}`);
      Logger.info("connection UserID", socket.data.context.userId);

      try {
        const user = await this.assignUser(socket);
        if (!user) {
          this.handleDisconnect(socket);
          return;
        }

        this.notifyConnectedUser(socket, user.id, user.username); // returns the data of the user to the user
        this.broadcastUserList(); // Broadcasts the updated list

        socket.on("private_message", async (data) => await this.handlePrivateMessage(socket, data));
        socket.on("disconnect", () => this.handleDisconnect(socket));
      } catch (e) {
        Logger.error(`Error setting up user connection: ${e}`);
        socket.disconnect();
      }
    });
  }

  private async assignUser(socket: Socket): Promise<UserViewDTO | null> {
    try {
      const user = await this.userService.getUser(socket.data.context.userId, socket.data.context.userId);

      const userId = user.id;
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }

      this.connectedUsers.get(userId)?.add(socket.id); // Add socket to user's socket set
      return user;
    } catch (e) {
      Logger.error(`Error assigning user to socket ${socket.id}: ${e}`);
      return null;
    }
  }

  private notifyConnectedUser(socket: Socket, userId: string, username: string): void {
    socket.emit("your_socket_id", { socketId: socket.id, userId, username });
    Logger.info(`User registered: ${username} (Socket ID: ${socket.id})`);
  }

  // this method MAY be wrong.
  private broadcastUserList(): void {
    const uniqueUsers = Array.from(this.connectedUsers.keys()); // Only user IDs
    this.io.emit("update_user_list", uniqueUsers);
  }

  private async handlePrivateMessage(
    socket: Socket,
    { to, message }: { to: string; message: string }
  ): Promise<void> {

    // We get the sender user Id so the receiver knows who sent the messge.
    const senderUserId = this.getSenderUserId(socket);
    if (!senderUserId) {
      Logger.warn(`Sender socket ${socket.id} not associated with a user`);
      return;
    }

    const areFriends = await this.followerService.areFriends(senderUserId, to);
    if (!areFriends) {
      Logger.warn(`User ${senderUserId} cannot send a message to ${to} since they are not friends`);
      this.io.to(socket.id).emit("not_friends", `User cannot send a message to ${to} since they are not friends`);
      return;
    }

    return await this.sendMessage(socket, senderUserId, to, message);
  }

  private async sendMessage(socket: Socket, senderUserId: string, to: string, message: string): Promise<void> {
    // Either if the receiver is or not connected, we save the message.
    // We do this before emitting the event so we can also send the message id. Is good for the front end to have it.
    const savedId = await this.saveOnDB(socket.id, message, senderUserId, to);

    const data = {
      sender: senderUserId,
      recipient: to,
      message,
      savedId
    }
    // Send message to receiver. If he sends to himself skip this since we are doing it on the next line
    if(to !== senderUserId)
      this.sendMessageToAllReceiverSockets(socket, to, "receive_message", data)

    // Sync message to all open sockets of the sender
    this.sendMessageToAllReceiverSockets(socket, senderUserId, "receive_message", data)

    Logger.info(`Private message from ${senderUserId} to ${to}: "${message}"`);
  }

  private getSenderUserId(socket: Socket): string | null {
    return Array.from(this.connectedUsers.entries()).find(
      // (, socket): [string, Set<string>] with string (userId) not being passed
      ([, sockets]) => sockets.has(socket.id)
    )?.[0] || null;
  }

  private sendMessageToAllReceiverSockets(socket: Socket, to: string, event: string, data: any): void {
    const userSockets = this.connectedUsers.get(to);
    if (userSockets && userSockets.size > 0) {
      userSockets.forEach((socketId) => {
        if(socketId !== socket.id) // Doesn't send to the socket sending the message
          this.io.to(socketId).emit(event, data);
      });
    }
    else{
      Logger.log(`User ${to} not connected for private message`);
    }
  }

  private handleDisconnect(socket: Socket): void {
    const userId = Array.from(this.connectedUsers.entries()).find(
      ([, sockets]) => sockets.has(socket.id)
    )?.[0];

    if (userId) {
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id); // Remove the disconnected socket
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId); // If no more sockets, remove user
        }
      }

      this.broadcastUserList();
      Logger.info(`User disconnected: ${userId} (Socket ID: ${socket.id})`);
    }
  }

  private async saveOnDB(socketId: string, message: string, senderUserId: string, to: string): Promise<string> {
    const saved = await this.service.saveMessage(message, senderUserId, to);
    this.io.to(socketId).emit("message_saved", saved);
    return saved.id;
  }
}
