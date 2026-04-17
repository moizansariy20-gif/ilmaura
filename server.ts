import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import path from "path";
import Replicate from "replicate";
import admin from "firebase-admin";
import { Resend } from "resend";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Firebase Admin
  if (admin.apps.length === 0) {
    try {
      // Using the provided service account directly to bypass env var parsing issues
      const serviceAccount = {
        "type": "service_account",
        "project_id": "edusmart-358f2",
        "private_key_id": "aca118685f933295aef5e0fb1ea259646e805731",
        "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDr+6hiyjToTZwI\nsB4Fv/H/+KA7hHrZ6uzZSF7NSaFWwZN8AvTTWUKFPKefXl5w8gE0KWtwx+q8ZhES\njhqWbXaI3Fpz9341nX1+0OmaF+NL5minYolpK945/tFvVEHY/t7X8QnxiXHToEFL\nTu73N7fB0Ber8MLmlO6DBClEOU5l40IsZhN2SrCm1YtKL/NcxG81HTGB1FoeT6yO\n7njZwFzPDO8A1ZPcQV8YRux4HCEp1iV326z/SrDLLxoK2neOkZ6xdMNuWSulERFM\nQlRUys8KJf8P2OKk9QHDtJphwppTrtL52FlxLJSy2nYa6UdTPQnOfGdjAdEY8bh0\nsAtGow4ZAgMBAAECggEAAVZU3RFzBQ16iMCRvPvaV9ZddxTgOtemVbFfqydjiQmy\nB6H/J+rxse5W71PiMl7ms5hX/eS+H2jvKBUi0K8oXKxt/Un93rkonsU5i6hevv18\nYpVv/Kb1XIwFfQ1jzaJdGilpImOiX94AvLfi6gb4bTpcBfsIabTWmKq3fqXZ/EEP\ng5k0hLUcyDioMZdQ1324mtU2Eb8Cr364rFrIAnyygOC7dN+66LoL056q0SbwlYoK\noa5Lpmoj2yLNe9o8tD+Epo5ipAHW0QYUh2YncFh8BPAfC5hY6Eg1AHITajvAmvDP\nvjVCdL7MP2Ko2R2wKrTXrfCU3WanYYHzuasuKCitcQKBgQD9hIcAfc525MfLzO+4\ngTcl+I3rtlfKuNg2YbG5wB/YwIK2ZSZM8CDS5zudTjFkN+tod+1kA9rmHxg+EdUr\nYKFn4mKMwDyRTYL6q6imk1AkpTYUH9C/4H/nP3Q/qMVFc/7uuMVcMnzVlVVgfC0T\ntC/xD0zUmyewCLmjtkHWVoJByQKBgQDuSy19tGjueiWWpdQjNXdVb1os7BasLA7T\ncUD52lMPE85SCkeYo0LkI5tAH3x0aE8XJhEKXeWnJ165vnKag8dw63szZMxU0G5t\n14jQ015S5x+qVgpf2zZv+XhfVbJkVjkdMlaEQ5hmfwm0qle1i+pzSQtYi1m4LIK2\nex0SfwUR0QKBgQCkxVUFMb9WMP3WbN1Fet5AFJsRH1NSE++a8MYVZ1SLiRurtnQ9\nPzjmOpnZdK/PZjTfkkq9XXARbxZPiUGWTti47z+EIZF8EvfVOmqD0W0eVC6gx8ji\nXORkhS5mDaghqvF/cKH9eWb/Xm6+JhcaHlumfn4+FJWn6RPW3qdNyq4gWQKBgHGY\nsQT93g/hds3MG8b1FABMZwaHPX+yORcfJER3iaTkYjTF5b+kBJ1RRA9bcy7jEuEM\nKo9wl6wJnqSZX3S9YXQ5LbAgWzALdLk0SGqUeKC4wWWoQqXTkK3slS+NYM9oMy3x\n80B2IM6rvOq9UbagDpIKvjflpk2gGmf3ZLKOjtIhAoGAUMP+daihX4iVgimTCJRY\nj1EPFIQ7DMotXRu0zcOd6wtPpZu0wAM+ZCjgaZq0huKcaZ3Acq4QeqvVg+sLkR5R\nQyBe9+z74N0xZiMZ+UpJj1miHsvdXY4qtM65e89VRXXjJXDU6pK4R5SCL3jlDLPD\nyjM0Pb35kFCiZdHofElg1dQ=\n-----END PRIVATE KEY-----\n",
        "client_email": "firebase-adminsdk-fbsvc@edusmart-358f2.iam.gserviceaccount.com",
        "client_id": "116783546404098380251",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40edusmart-358f2.iam.gserviceaccount.com"
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
      });
      console.log("EduControl: Firebase Admin initialized successfully.");
    } catch (error: any) {
      console.error("EduControl: Error initializing FIREBASE_SERVICE_ACCOUNT:", error.message);
    }
  }

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  const resend = new Resend(process.env.RESEND_API_KEY || "re_FPx1Wivn_8yELP2BGZErejwJuZhrGQkyv");

  // API routes FIRST
  app.post("/api/send-verification-code", async (req, res) => {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    try {
      const baseUrl = req.headers.origin || `https://${req.headers.host}`;
      const logoUrl = `${baseUrl}/favicon-cropped.png`;

      const { data, error } = await resend.emails.send({
        from: "Ilmaura Admin <onboarding@resend.dev>",
        to: email,
        subject: "Verification Code - Ilmaura System Admin",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="${logoUrl}" alt="Ilmaura Logo" style="width: 80px; height: 80px; border-radius: 16px;" />
              <h2 style="color: #007bff; margin-top: 10px;">Ilmaura System Security</h2>
            </div>
            <p>Someone is trying to login to the Mother Admin panel. If this was you, use the code below:</p>
            <div style="background: #f4f7f6; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; border: 1px dashed #007bff;">
              <span style="font-size: 40px; font-weight: bold; letter-spacing: 8px; color: #007bff;">${code}</span>
            </div>
            <p style="font-size: 14px; color: #666; line-height: 1.5;">
              This code is valid for a short time. If you did not request this login, please change your password immediately and contact support.
            </p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999; text-align: center;">
              &copy; ${new Date().getFullYear()} Ilmaura Learning Management System. All rights reserved.
            </p>
          </div>
        `
      });

      if (error) {
        console.error("Resend Error:", error);
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true, data });
    } catch (err: any) {
      console.error("Server Error sending email:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/deliver-alert", async (req, res) => {
    console.log("EduControl: Received request at /api/deliver-alert", req.body);
    try {
      const { token, title, body, data } = req.body;
      
      if (!admin.apps.length) {
        console.error("EduControl: Firebase Admin not initialized when trying to send alert");
        return res.status(500).json({ error: "Firebase Admin not initialized" });
      }

      if (!token) {
        console.error("EduControl: No token provided in request");
        return res.status(400).json({ error: "No FCM token provided" });
      }

      const baseUrl = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : '');
      const defaultIcon = baseUrl ? `${baseUrl}/favicon-cropped.png` : '/favicon-cropped.png';

      const message: any = {
        notification: { title, body },
        token: token,
        data: data || {},
        webpush: {
          headers: {
            Urgency: 'high'
          },
          notification: {
            icon: data?.icon || defaultIcon,
            badge: defaultIcon,
            vibrate: [200, 100, 200, 100, 200, 100, 200],
            requireInteraction: true,
            renotify: true,
            tag: `alert-${Date.now()}`
          },
          fcmOptions: {
            link: baseUrl
          }
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            vibrateTimingsMillis: [200, 100, 200, 100, 200, 100, 200],
            defaultVibrateTimings: false,
            defaultSound: true
          }
        },
        apns: {
          headers: {
            'apns-priority': '10'
          },
          payload: {
            aps: {
              sound: 'default'
            }
          }
        }
      };

      // Ensure we don't send base64 data in the data payload to prevent crashes
      if (message.data.icon) {
        if (!message.data.icon.startsWith('http://') && !message.data.icon.startsWith('https://')) {
            console.warn("EduControl: Removed base64 icon from data payload to prevent crash.");
            delete message.data.icon;
            message.webpush.notification.icon = defaultIcon;
        }
      }

      console.log("EduControl: Sending message to FCM...", { ...message, data: { ...message.data, icon: message.data.icon ? message.data.icon : undefined } });
      const response = await admin.messaging().send(message);
      console.log("EduControl: Successfully sent message:", response);
      res.json({ success: true, response });
    } catch (error: any) {
      console.error("EduControl: Error sending push notification:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/generate-id", async (req, res) => {
    try {
      const { studentImage, uniformImage, backgroundColor } = req.body;
      
      const falKey = process.env.FAL_KEY || "06e88540-f1d2-4e4b-b0b3-1f1c7d2c1e8d:019ed6b8d417ad467d03a63f6068006b"; // Updated key

      console.log("Starting Fal.ai processing...");

      // Step 1: Virtual Try-On (IDM-VTON)
      console.log("Calling IDM-VTON...");
      const vtonResponse = await fetch("https://fal.run/fal-ai/idm-vton", {
        method: "POST",
        headers: {
          "Authorization": `Key ${falKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          human_image_url: studentImage,
          garment_image_url: uniformImage,
          description: "A professional passport photo of a student wearing a school uniform, studio lighting, highly detailed face",
          category: "upper_body"
        })
      });

      if (!vtonResponse.ok) {
        const errText = await vtonResponse.text();
        console.warn(`Fal.ai VTON Error: ${errText}`);
        console.log("Balance exhausted or API failed. Falling back to original image.");
        // Fallback: Return the original cropped image so the app doesn't break
        return res.json({ imageUrl: studentImage, fallback: true });
      }

      const vtonData = await vtonResponse.json();
      const vtonImageUrl = vtonData.image.url;
      console.log("VTON completed:", vtonImageUrl);

      // Step 2: Background Removal
      console.log("Calling Background Removal...");
      const bgResponse = await fetch("https://fal.run/fal-ai/bria-rmbg", {
        method: "POST",
        headers: {
          "Authorization": `Key ${falKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image_url: vtonImageUrl
        })
      });

      if (!bgResponse.ok) {
        const errText = await bgResponse.text();
        throw new Error(`Fal.ai BG Removal Error: ${errText}`);
      }

      const bgData = await bgResponse.json();
      const transparentImageUrl = bgData.image.url;
      console.log("BG Removal completed:", transparentImageUrl);

      // Step 3: Face Enhancement & Upscaling (GFPGAN / CodeFormer)
      console.log("Calling Face Enhancer & Upscaler...");
      const upscaleResponse = await fetch("https://fal.run/fal-ai/face-restoration", {
        method: "POST",
        headers: {
          "Authorization": `Key ${falKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image_url: transparentImageUrl,
          upscale: true,
          scale: 2 // 2x upscaling for 4K/HD quality
        })
      });

      if (!upscaleResponse.ok) {
        const errText = await upscaleResponse.text();
        console.warn(`Fal.ai Upscaler Error (falling back to BG removed image): ${errText}`);
        // If upscaler fails, we still return the transparent image so the process doesn't completely break
        return res.json({ imageUrl: transparentImageUrl });
      }

      const upscaleData = await upscaleResponse.json();
      const finalHdImageUrl = upscaleData.image.url;
      console.log("Upscaling completed:", finalHdImageUrl);

      res.json({ imageUrl: finalHdImageUrl });

    } catch (error: any) {
      console.error("Fal.ai API Error:", error);
      // If anything fails (network error, etc.), fallback to the original image
      // so the student can still save their profile.
      res.json({ imageUrl: req.body.studentImage, fallback: true });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
