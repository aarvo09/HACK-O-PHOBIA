import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await prisma.classSession.findUnique({
      where: { id },
      include: {
        classroom: true,
        teacher: true,
        captures: {
          orderBy: { capturedAt: 'asc' }
        },
        attendances: {
          include: {
            student: true
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch session';
    console.error("Fetch Session Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
