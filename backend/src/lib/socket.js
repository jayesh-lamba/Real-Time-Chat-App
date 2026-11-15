import { Server } from "socket.io";
import http from "http";
import express from "express";
import mongoose from "mongoose";
import Connection from "../models/connection.model.js";
import CallLog from "../models/call.model.js";
import Message from "../models/message.model.js";



const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

// ── Helper: check accepted connection between two users ──
async function areFriends(userIdA, userIdB) {
  try {
    const objA = new mongoose.Types.ObjectId(userIdA);
    const objB = new mongoose.Types.ObjectId(userIdB);
    const conn = await Connection.findOne({
      $or: [
        { requesterId: objA, recipientId: objB, status: "accepted" },
        { requesterId: objB, recipientId: objA, status: "accepted" },
      ],
    });
    return !!conn;
  } catch (error) {
    console.error("Error in areFriends connection check:", error);
    return false;
  }
}

// ── Helper: create call log event message in timeline ──
async function createCallLogMessage(callerId, receiverId, callType, callStatus, callDuration = 0) {
  try {
    const textDesc = `${callType} call ${callStatus}`;
    const msg = await Message.create({
      senderId: callerId,
      receiverId: receiverId,
      messageType: "call_log",
      callType,
      callStatus,
      callDuration,
      text: textDesc,
    });

    const senderSocket = userSocketMap[callerId.toString()];
    const receiverSocket = userSocketMap[receiverId.toString()];

    if (senderSocket) io.to(senderSocket).emit("newMessage", msg);
    if (receiverSocket) io.to(receiverSocket).emit("newMessage", msg);
  } catch (error) {
    console.error("Error creating inline call log message:", error);
  }
}



io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // ────────────────────────────────────────────────────
  // WebRTC Signaling Events (server just relays, no media passes through)
  // ────────────────────────────────────────────────────

  // Caller → callee: SDP offer + call type
  socket.on("call:offer", async ({ to, offer, callType }) => {
    const callerId = userId;
    console.log(`[SOCKET BACKEND] call:offer received. From: ${callerId}, To: ${to}, Type: ${callType}`);
    if (!callerId || !to) {
      console.warn("[SOCKET BACKEND] call:offer rejected: missing callerId or receiverId");
      return;
    }

    // Privacy check — only connected users can call each other
    const allowed = await areFriends(callerId, to);
    console.log(`[SOCKET BACKEND] areFriends allowed state: ${allowed}`);
    if (!allowed) {
      console.warn(`[SOCKET BACKEND] call:offer blocked: ${callerId} and ${to} are not friends.`);
      socket.emit("call:error", { message: "You can only call accepted connections" });
      return;
    }

    const targetSocketId = userSocketMap[to];
    console.log(`[SOCKET BACKEND] target socket ID for recipient ${to}: ${targetSocketId}`);
    if (!targetSocketId) {
      console.log(`[SOCKET BACKEND] target recipient is offline.`);
      socket.emit("call:unavailable", { userId: to });
      return;
    }

    // Log call attempt
    const callLog = await CallLog.create({
      callerId,
      receiverId: to,
      type: callType || "voice",
      status: "missed", // updated when answered/declined/ended
      startedAt: new Date(),
    }).catch((err) => {
      console.error("[SOCKET BACKEND] Error creating CallLog:", err);
      return null;
    });

    if (callLog) {
      socket.emit("call:initiated", { callLogId: callLog._id });
    }

    console.log(`[SOCKET BACKEND] Relaying call:offer to socket target: ${targetSocketId}`);
    io.to(targetSocketId).emit("call:offer", {
      from: callerId,
      offer,
      callType: callType || "voice",
      callLogId: callLog?._id,
    });
  });



  // Callee → caller: SDP answer
  socket.on("call:answer", async ({ to, answer, callLogId }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call:answer", { from: userId, answer });
    }
    // Update log to answered
    if (callLogId) {
      await CallLog.findByIdAndUpdate(callLogId, { status: "answered" }).catch(() => {});
    }
  });

  // Both sides: ICE candidates
  socket.on("call:ice-candidate", ({ to, candidate }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call:ice-candidate", { from: userId, candidate });
    }
  });

  // Callee declines
  socket.on("call:reject", async ({ to, callLogId }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call:reject", { from: userId });
    }
    if (callLogId) {
      try {
        const log = await CallLog.findById(callLogId);
        if (log) {
          log.status = "declined";
          log.endedAt = new Date();
          await log.save();
          // Create inline call log message in messenger
          await createCallLogMessage(log.callerId, log.receiverId, log.callType, "declined", 0);
        }
      } catch (error) {
        console.error("Error updating call log on reject:", error);
      }
    }
  });

  // Either side hangs up
  socket.on("call:end", async ({ to, callLogId }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call:end", { from: userId });
    }
    if (callLogId) {
      try {
        const log = await CallLog.findById(callLogId);
        if (log) {
          log.endedAt = new Date();
          let finalStatus = "missed";
          let duration = 0;
          if (log.startedAt) {
            duration = Math.round((log.endedAt.getTime() - log.startedAt.getTime()) / 1000);
            log.duration = duration;
            log.status = "answered";
            finalStatus = "answered";
          } else {
            log.status = "missed";
          }
          await log.save();
          // Create inline call log message in messenger
          await createCallLogMessage(log.callerId, log.receiverId, log.callType, finalStatus, duration);
        }
      } catch (error) {
        console.error("Error updating call log on end:", error);
      }
    }
  });


  // Camera toggle relay
  socket.on("call:camera-toggle", ({ to, cameraOn }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call:camera-toggle", { from: userId, cameraOn });
    }
  });



  // ────────────────────────────────────────────────────

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    if (userId && userSocketMap[userId] === socket.id) {
      delete userSocketMap[userId];
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

});

export { io, app, server };
