import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

type SessionRow = {
  id: string;
  title: string;
  startTime: Date;
  teacherName: string | null;
  roomName: string | null;
  subjectName: string | null;
  subjectId: string | null;
  courseName: string | null;
  courseId: string | null;
};

type CaptureRow = {
  sessionId: string;
  intervalString: string;
  headcount: number;
  status: string;
};

type DashboardCourse = {
  id: string;
  name: string;
  subjects: Record<string, DashboardSubject>;
};

type DashboardSubject = {
  id: string;
  name: string;
  classes: Array<{
    id: string;
    title: string;
    teacher: string | null;
    room: string | null;
    status: "pending" | "good" | "warning";
    firstCapture: number;
    lastCapture: number;
    time: string;
  }>;
};

function getShowcaseDashboardData() {
  return [
    {
      id: "course-showcase-1",
      name: "B.Tech CSE",
      subjects: [
        {
          id: "subject-showcase-1",
          name: "Algorithms",
          classes: [
            {
              id: "class-showcase-1",
              title: "Algorithms - Section B",
              teacher: "Amit Kumar Pandey",
              room: "Room 204",
              status: "warning" as const,
              firstCapture: 58,
              lastCapture: 44,
              time: "Live Session",
            },
          ],
        },
      ],
    },
  ];
}

export async function GET(req: NextRequest) {
  const prisma = getPrismaClient();
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || "ADMIN";
  const userId = searchParams.get("userId");

  try {
    // Raw SQL — bypasses stale Prisma ORM client schema knowledge
    let sessions: SessionRow[];
    if (role === "TEACHER" && userId) {
      sessions = await prisma.$queryRaw`
        SELECT
          cs.id,
          cs.title,
          cs."startTime",
          u.name as "teacherName",
          cl.name as "roomName",
          sub.name as "subjectName",
          sub.id as "subjectId",
          co.name as "courseName",
          co.id as "courseId"
        FROM "ClassSession" cs
        LEFT JOIN "User" u ON cs."teacherId" = u.id
        LEFT JOIN "Classroom" cl ON cs."classroomId" = cl.id
        LEFT JOIN "Subject" sub ON cs."subjectId" = sub.id
        LEFT JOIN "Course" co ON sub."courseId" = co.id
        WHERE cs."teacherId" = ${userId}
        ORDER BY co.name, sub.name
      `;
    } else {
      sessions = await prisma.$queryRaw`
        SELECT
          cs.id,
          cs.title,
          cs."startTime",
          u.name as "teacherName",
          cl.name as "roomName",
          sub.name as "subjectName",
          sub.id as "subjectId",
          co.name as "courseName",
          co.id as "courseId"
        FROM "ClassSession" cs
        LEFT JOIN "User" u ON cs."teacherId" = u.id
        LEFT JOIN "Classroom" cl ON cs."classroomId" = cl.id
        LEFT JOIN "Subject" sub ON cs."subjectId" = sub.id
        LEFT JOIN "Course" co ON sub."courseId" = co.id
        ORDER BY co.name, sub.name
      `;
    }

    // Fetch all captures
    const captures: CaptureRow[] = await prisma.$queryRaw`
      SELECT "sessionId", "intervalString", headcount, status
      FROM "AttendanceCapture"
      ORDER BY "capturedAt" DESC
    `;

    // Group by Course -> Subject -> Classes
    const courseMap: Record<string, DashboardCourse> = {};
    for (const row of sessions) {
      const courseKey = row.courseId || "unknown";
      if (!courseMap[courseKey]) {
        courseMap[courseKey] = {
          id: courseKey,
          name: row.courseName || "General",
          subjects: {}
        };
      }
      const subKey = row.subjectId || "unknown";
      if (!courseMap[courseKey].subjects[subKey]) {
        courseMap[courseKey].subjects[subKey] = {
          id: subKey,
          name: row.subjectName || "General",
          classes: []
        };
      }

      const sessionCaptures = captures.filter((c) => c.sessionId === row.id);
      const first = sessionCaptures.find((c) => c.intervalString === "first_10_min");
      const last = sessionCaptures.find((c) => c.intervalString === "last_10_min");

      let status: "pending" | "good" | "warning" = "pending";
      if (first && last) {
        status = Math.abs(Number(first.headcount) - Number(last.headcount)) > 5 ? "warning" : "good";
      }

      courseMap[courseKey].subjects[subKey].classes.push({
        id: row.id,
        title: row.title,
        teacher: row.teacherName,
        room: row.roomName,
        status,
        firstCapture: Number(first?.headcount) || 0,
        lastCapture: Number(last?.headcount) || 0,
        time: "Live Session",
      });
    }

    const dashboardData = Object.values(courseMap).map((course) => ({
      ...course,
      subjects: Object.values(course.subjects)
    }));

    return NextResponse.json({ dashboardData });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({
      dashboardData: getShowcaseDashboardData(),
      fallback: true,
      warning: "Database unavailable. Returning showcase data.",
    });
  }
}
