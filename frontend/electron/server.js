const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const EventEmitter = require("events");
const eventEmitter = require("./events");
const ProcessManager = require("./ProcessManager");
const { v4: uuidv4 } = require("uuid");

const PORT = 58000;
const processManager = new ProcessManager(2);

class Server extends EventEmitter {
  constructor() {
    super();
    this.app = express();
    this.setupServer();

    // 프로세스 매니저의 이벤트를 서버 이벤트로 전달
    eventEmitter.on("processing-status", (data) => {
      this.emit("processing-status", data);
    });
  }

  setupServer() {
    const app = this.app;
    app.use(
      cors({
        origin: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
      })
    );
    app.use(express.json());

    app.get("/", (req, res) => {
      res.send("Express 서버가 실행 중입니다!");
    });

    app.get("/status", (req, res) => {
      res.json({ status: "online" });
    });

    app.post("/remove-bg", async (req, res) => {
      const { image_url, async = true } = req.body;
      const processId = uuidv4();

      if (!image_url) {
        return res.status(400).json({
          success: false,
          error: "이미지 URL이 필요합니다",
        });
      }

      try {
        if (async) {
          console.log("비동기 작업 추가");
          await processManager.addToQueue(processId, "remove-bg", {
            image_url,
            res,
            async: true,
          });

          return res.json({
            success: true,
            processId,
            status: "queued",
            message: "작업이 큐에 추가되었습니다",
          });
        } else {
          console.log("동기 작업 추가");
          const result = await processManager.addToSyncQueue(
            processId,
            "remove-bg",
            {
              image_url,
              res,
              async: false,
            }
          );

          return res.json(result);
        }
      } catch (error) {
        console.error("작업 추가 실패:", error);
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            error: "서버 오류",
            details: error.message,
          });
        }
      }
    });

    app.get("/status-events", (req, res) => {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      const processes = Array.from(processManager.processes.values());
      if (processes.length > 0) {
        processes.forEach((process) => {
          sendEvent({
            processId: process.id,
            type: process.type,
            status: process.status,
          });
        });
      }

      app.on("processing-status", (data) => {
        this.emit("processing-status", data);
      });

      req.on("close", () => {
        app.removeListener("processing-status", sendEvent);
      });
    });

    app.get("/process/:processId", (req, res) => {
      const process = processManager.getProcess(req.params.processId);
      if (process) {
        res.json(process);
      } else {
        res.status(404).json({ error: "프로세스를 찾을 수 없습니다" });
      }
    });

    app.get("/process/:processId/status", (req, res) => {
      const process = processManager.getProcess(req.params.processId);
      if (process) {
        res.json({
          processId: process.id,
          type: process.type,
          status: process.status,
          progress: process.progress || 0,
        });
      } else {
        res.status(404).json({
          error: "프로세스를 찾을 수 없습니다",
          processId: req.params.processId,
        });
      }
    });

    app.get("/process/:processId/result", (req, res) => {
      const process = processManager.getProcess(req.params.processId);
      if (!process) {
        return res.status(404).json({
          error: "프로세스를 찾을 수 없습니다",
          processId: req.params.processId,
        });
      }

      if (process.status === "completed") {
        res.json({
          success: true,
          processId: process.id,
          result: process.result,
        });
      } else if (process.status === "error") {
        res.status(500).json({
          success: false,
          processId: process.id,
          error: process.error,
        });
      } else {
        res.json({
          success: false,
          processId: process.id,
          status: process.status,
          message: "아직 처리 중입니다",
        });
      }
    });

    app.listen(PORT, () => {
      console.log(`Express 서버가 포트 ${PORT}에서 실행 중입니다`);
    });
  }
}

const server = new Server();
module.exports = server;
