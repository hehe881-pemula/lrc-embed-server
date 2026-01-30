import express from "express";
import multer from "multer";
import fs from "fs";
import { execFile } from "child_process";

const app = express();
const upload = multer({ dest: "/tmp" });

app.get("/", (req, res) => {
  res.send("SYLT Embed Server (Poweramp) running 🚀");
});

/* ========= UTIL ========= */
function parseLRC(lrcText) {
  const lines = [];
  const regex = /\[(\d+):(\d{2})(?:\.(\d{1,2}))?\](.*)/g;

  let m;
  while ((m = regex.exec(lrcText)) !== null) {
    const min = parseInt(m[1], 10);
    const sec = parseInt(m[2], 10);
    const cs = m[3] ? parseInt(m[3].padEnd(2, "0")) : 0;
    const timeMs = (min * 60 + sec) * 1000 + cs * 10;
    const text = m[4].trim();
    if (text) lines.push({ timeMs, text });
  }

  if (!lines.length) return null;
  return lines;
}

/* ========= EMBED ========= */
app.post("/embed", upload.fields([
  { name: "audio", maxCount: 1 },
  { name: "lrc", maxCount: 1 }
]), async (req, res) => {
  try {
    const audio = req.files.audio?.[0];
    const lrc = req.files.lrc?.[0];
    if (!audio || !lrc) {
      return res.status(400).json({ error: "Missing files" });
    }

    const lrcText = fs.readFileSync(lrc.path, "utf8");
    const parsed = parseLRC(lrcText);

    if (!parsed) {
      return res.status(400).json({
        error: "LRC tidak valid atau tidak bertimestamp"
      });
    }

    const syltPath = `/tmp/${Date.now()}.sylt`;

    const syltData = parsed
      .map(l => `${l.timeMs}|${l.text}`)
      .join("\n");

    fs.writeFileSync(syltPath, syltData, "utf8");

    const output = `/tmp/${Date.now()}_${audio.originalname}`;
    const args = [
      "-y",
      "-i", audio.path,
      "-metadata", `TXXX:SYLT_POWERAMP=${syltData}`,
      "-map_metadata", "0",
      "-c", "copy",
      output
    ];

    execFile("ffmpeg", args, (err, stdout, stderr) => {
      if (err) {
        console.error("FFmpeg SYLT error:", stderr);
        return res.status(500).json({
          error: "Gagal embed SYLT (Poweramp)"
        });
      }

      res.download(output, audio.originalname, () => {
        fs.unlinkSync(audio.path);
        fs.unlinkSync(lrc.path);
        fs.unlinkSync(output);
        fs.unlinkSync(syltPath);
      });
    });

  } catch (e) {
    console.error("Server crash:", e);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("SYLT server running");
});    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error("FFmpeg error:", stderr);
        return res.download(audio.path, audio.originalname);
      }

      res.download(output, audio.originalname, () => {
        fs.unlinkSync(audio.path);
        fs.unlinkSync(lrc.path);
        fs.unlinkSync(output);
      });
    });

  } catch (e) {
    console.error("Server crash:", e);
    res.status(500).send("Server error");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
