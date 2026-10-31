import type { Request, Response } from "express";
import type { ResultSetHeader } from "mysql2";
import pool from "../config/database";

export async function savePushSubscription(
  req: Request,
  res: Response
) {
  try {
    const userId = String(res.locals.userId);

    const subscription = req.body.subscription;

    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const auth = subscription?.keys?.auth;

    if (
      typeof endpoint !== "string" ||
      typeof p256dh !== "string" ||
      typeof auth !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid push subscription data."
      });
      return;
    }

    // Endpoint valid HTTPS URL hona chahiye.
    let endpointUrl: URL;

    try {
      endpointUrl = new URL(endpoint);
    } catch {
      res.status(400).json({
        success: false,
        message: "Invalid subscription endpoint."
      });
      return;
    }

    if (endpointUrl.protocol !== "https:") {
      res.status(400).json({
        success: false,
        message: "HTTPS endpoint required."
      });
      return;
    }

    await pool.execute<ResultSetHeader>(
      `INSERT INTO push_subscriptions
       (user_id, endpoint, p256dh, auth)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         user_id = VALUES(user_id),
         p256dh = VALUES(p256dh),
         auth = VALUES(auth),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, endpoint, p256dh, auth]
    );

    res.status(201).json({
      success: true,
      message: "Push subscription saved successfully."
    });

  } catch (error) {
    console.error("Save push subscription error:", error);

    res.status(500).json({
      success: false,
      message: "Push subscription save nahi hui."
    });
  }
}
