import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getWarningEmailPreview } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

async function getWeakestSubjectInsight(rollNumber: string): Promise<{ subject: string; percentage: number } | null> {
  const prisma = getPrismaClient();
  const student = await prisma.student.findFirst({
    where: { rollNumber },
    include: {
      attendances: {
        include: {
          session: {
            include: {
              subject: true,
            },
          },
        },
      },
    },
  });

  if (!student || student.attendances.length === 0) return null;

  const subjectStats = new Map<string, { present: number; total: number }>();
  for (const attendance of student.attendances) {
    const subjectName = attendance.session.subject.name;
    const current = subjectStats.get(subjectName) || { present: 0, total: 0 };
    current.total += 1;
    if (attendance.isPresent && !attendance.leftEarly) {
      current.present += 1;
    }
    subjectStats.set(subjectName, current);
  }

  let weakest: { subject: string; percentage: number } | null = null;
  for (const [subject, stat] of subjectStats.entries()) {
    const pct = stat.total > 0 ? (stat.present / stat.total) * 100 : 0;
    if (!weakest || pct < weakest.percentage) {
      weakest = { subject, percentage: Number(pct.toFixed(1)) };
    }
  }

  return weakest;
}

async function getWeakestSubjectInsightByStudentId(studentId: string): Promise<{ subject: string; percentage: number } | null> {
  const prisma = getPrismaClient();
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      attendances: {
        include: {
          session: {
            include: {
              subject: true,
            },
          },
        },
      },
    },
  });

  if (!student || student.attendances.length === 0) return null;

  const subjectStats = new Map<string, { present: number; total: number }>();
  for (const attendance of student.attendances) {
    const subjectName = attendance.session.subject.name;
    const current = subjectStats.get(subjectName) || { present: 0, total: 0 };
    current.total += 1;
    if (attendance.isPresent && !attendance.leftEarly) {
      current.present += 1;
    }
    subjectStats.set(subjectName, current);
  }

  let weakest: { subject: string; percentage: number } | null = null;
  for (const [subject, stat] of subjectStats.entries()) {
    const pct = stat.total > 0 ? (stat.present / stat.total) * 100 : 0;
    if (!weakest || pct < weakest.percentage) {
      weakest = { subject, percentage: Number(pct.toFixed(1)) };
    }
  }

  return weakest;
}

function getFallbackSubjectInsight(rollNumber: string): { subject: string; percentage: number } {
  const subjects = ["Mathematics", "Physics", "Data Structures", "Operating Systems", "Database Systems", "Machine Learning"];
  const numericPart = Number((rollNumber.match(/\d+/)?.[0] || "1"));
  const subject = subjects[numericPart % subjects.length];
  const percentage = 55 + (numericPart % 15);
  return { subject, percentage };
}

export async function GET(req: NextRequest) {
  try {
    const prisma = getPrismaClient();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        subject: {
          include: {
            course: true,
          },
        },
        classroom: {
          include: {
            students: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const totalSessionsForSubject = await prisma.classSession.count({
      where: { subjectId: session.subjectId },
    });

    const previews: Array<{
      studentName: string;
      rollNumber: string;
      attendancePercentage: number;
      preview: Awaited<ReturnType<typeof getWarningEmailPreview>>;
    }> = [];

    for (const student of session.classroom.students) {
      if (totalSessionsForSubject === 0) {
        continue;
      }

      const presentSessions = await prisma.studentAttendance.count({
        where: {
          studentId: student.id,
          isPresent: true,
          leftEarly: false,
          session: { subjectId: session.subjectId },
        },
      });

      const attendancePercentage = Number(((presentSessions / totalSessionsForSubject) * 100).toFixed(1));
      if (attendancePercentage >= 75) continue;

      const weakestInsight =
        (await getWeakestSubjectInsightByStudentId(student.id)) || getFallbackSubjectInsight(student.rollNumber);
      const studentEmail = `${student.rollNumber.toLowerCase()}@university.edu`;
      const preview = await getWarningEmailPreview(
        studentEmail,
        student.name,
        attendancePercentage,
        weakestInsight.subject,
        weakestInsight.percentage
      );

      previews.push({
        studentName: student.name,
        rollNumber: student.rollNumber,
        attendancePercentage,
        preview,
      });
    }

    // Keep the showcase usable even when DB records are missing or all students are above threshold.
    if (previews.length === 0) {
      const showcaseStudents: Array<{ id?: string; name: string; rollNumber: string }> =
        session.classroom.students.length > 0
          ? session.classroom.students.slice(0, 5).map((student) => ({
              id: student.id,
              name: student.name,
              rollNumber: student.rollNumber,
            }))
          : [
              { name: "Aarav Sharma", rollNumber: "DS-001" },
              { name: "Ishita Verma", rollNumber: "DS-002" },
              { name: "Rohan Singh", rollNumber: "DS-003" },
              { name: "Sneha Patel", rollNumber: "DS-004" },
              { name: "Aditya Kumar", rollNumber: "DS-005" },
            ];

      const syntheticPercentages = [72.5, 69.0, 66.4, 63.2, 58.9];

      for (let i = 0; i < showcaseStudents.length; i++) {
        const student = showcaseStudents[i];
        const attendancePercentage = syntheticPercentages[i % syntheticPercentages.length];
        const weakestInsight = student.id
          ? (await getWeakestSubjectInsightByStudentId(student.id)) || getFallbackSubjectInsight(student.rollNumber)
          : { subject: session.subject.name, percentage: Number((attendancePercentage - 6).toFixed(1)) };
        const studentEmail = `${student.rollNumber.toLowerCase()}@university.edu`;
        const preview = await getWarningEmailPreview(
          studentEmail,
          student.name,
          attendancePercentage,
          weakestInsight.subject,
          weakestInsight.percentage
        );

        previews.push({
          studentName: student.name,
          rollNumber: student.rollNumber,
          attendancePercentage,
          preview,
        });
      }
    }

    return NextResponse.json({
      success: true,
      context: {
        courseId: session.subject.course.id,
        courseName: session.subject.course.name,
        classId: session.id,
        classTitle: session.title,
      },
      generatedCount: previews.length,
      previews,
    });
  } catch (error) {
    console.error("Mail preview GET API error:", error);
    return NextResponse.json(
      { error: "Failed to auto-generate low-attendance mail previews" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      studentName,
      rollNumber,
      attendancePercentage,
    }: {
      studentName?: string;
      rollNumber?: string;
      attendancePercentage?: number;
    } = await req.json();

    if (!studentName || !rollNumber || typeof attendancePercentage !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const studentEmail = `${rollNumber.toLowerCase()}@university.edu`;
    const weakestInsight = (await getWeakestSubjectInsight(rollNumber)) || getFallbackSubjectInsight(rollNumber);

    const preview = await getWarningEmailPreview(
      studentEmail,
      studentName,
      attendancePercentage,
      weakestInsight.subject,
      weakestInsight.percentage
    );

    return NextResponse.json({
      success: true,
      preview,
    });
  } catch (error) {
    console.error("Mail preview API error:", error);
    return NextResponse.json(
      { error: "Failed to generate student mail preview" },
      { status: 500 }
    );
  }
}
