const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const before = {
    visits: await prisma.siteVisit.count(),
    registrations: await prisma.courseRegistration.count(),
    messages: await prisma.contactMessage.count(),
    notifications: await prisma.notification.count(),
    calendar: await prisma.calendarEvent.count(),
  };

  await prisma.siteVisit.deleteMany();
  await prisma.courseRegistration.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.notification.deleteMany();

  // Remove duplicate workshops: same title (keep newest), and legacy auto-slugs extras
  const events = await prisma.calendarEvent.findMany({
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  });

  const seenSlug = new Set();
  const seenTitle = new Set();
  const removeIds = [];

  for (const row of events) {
    const titleKey = row.title.trim().toLowerCase();
    const isDupSlug = seenSlug.has(row.slug);
    const isDupTitle = seenTitle.has(titleKey);
    if (isDupSlug || isDupTitle) {
      removeIds.push(row.id);
      continue;
    }
    seenSlug.add(row.slug);
    seenTitle.add(titleKey);
  }

  if (removeIds.length) {
    await prisma.calendarEvent.deleteMany({ where: { id: { in: removeIds } } });
  }

  // At most one featured workshop
  const featured = await prisma.calendarEvent.findMany({
    where: { isFeatured: true },
    orderBy: { updatedAt: 'desc' },
  });
  if (featured.length > 1) {
    await prisma.calendarEvent.updateMany({
      where: { id: { in: featured.slice(1).map((r) => r.id) } },
      data: { isFeatured: false },
    });
  }

  // Remove leftover legacy auto-slugs (workshop-{cuid} from old seeds)
  const legacy = await prisma.calendarEvent.deleteMany({
    where: { slug: { startsWith: 'workshop-' } },
  });

  const after = {
    visits: await prisma.siteVisit.count(),
    registrations: await prisma.courseRegistration.count(),
    messages: await prisma.contactMessage.count(),
    notifications: await prisma.notification.count(),
    calendar: await prisma.calendarEvent.count(),
    removedDuplicateWorkshops: removeIds.length,
    removedLegacyWorkshops: legacy.count,
    remainingWorkshops: await prisma.calendarEvent.findMany({
      select: { slug: true, title: true, isPublished: true, isFeatured: true },
    }),
  };

  console.log(JSON.stringify({ before, after }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
