import Connection from "../models/connection.model.js";

/**
 * Check if two users have an accepted connection between them.
 * @param {string|ObjectId} userIdA
 * @param {string|ObjectId} userIdB
 * @returns {Promise<boolean>}
 */
export async function isConnected(userIdA, userIdB) {
  const connection = await Connection.findOne({
    $or: [
      { requesterId: userIdA, recipientId: userIdB, status: "accepted" },
      { requesterId: userIdB, recipientId: userIdA, status: "accepted" },
    ],
  });
  return !!connection;
}
