import { Router } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import examsRouter from "./exams";
import questionsRouter from "./questions";
import attemptsRouter from "./attempts";
import studentsRouter from "./students";
import adminRouter from "./admin";
import resultsRouter from "./results";
import topicsRouter from "./topics";
import subjectsRouter from "./subjects";
import topicMocksRouter from "./topic-mocks";
import resourcesRouter from "./resources";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/exams", examsRouter);
router.use("/questions", questionsRouter);
router.use("/attempts", attemptsRouter);
router.use("/students", studentsRouter);
router.use("/admin", adminRouter);
router.use("/results", resultsRouter);
router.use("/topics", topicsRouter);
router.use("/subjects", subjectsRouter);
router.use("/topic-mocks", topicMocksRouter);
router.use("/", resourcesRouter);

export default router;
